import type { Account, ActivityDetails, AddonContext } from '@wealthfolio/addon-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildAccountPayload } from '../lib/accounts';
import { createClient, createSyncDeps } from '../lib/api-deps';
import { parseCallback } from '../lib/auth-callback';
import {
  defaultBankColor,
  removeConnection,
  renewConnection,
  resetAccountSync,
  setBankColor,
  updateAccount,
} from '../lib/bank';
import type { Aspsp } from '../lib/client';
import { consentValidUntil } from '../lib/consent';
import { importedRefs, toEntryRows, type EntryRow } from '../lib/entries';
import { appendLog, loadLog, type LogEntry } from '../lib/log';
import { summarizeRun } from '../lib/run-summary';
import { mapTransactions } from '../lib/mapping';
import { consumePending, savePending } from '../lib/pending';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '../lib/settings';
import { spendingWarning, type SpendingContextLike } from '../lib/spending-check';
import { loadConnections, saveConnections, type Connection } from '../lib/state';
import { syncConnection } from '../lib/sync';
import { APP_ID_SECRET, PRIVATE_KEY_SECRET } from '../lib/token';

const REDIRECT_KEY = 'eb-redirect-url';
const LAST_AUTO_KEY = 'eb-last-auto-sync';
const RECENT_DAYS = 30;
const DAY_MS = 86_400_000;

export type View = 'overview' | 'add' | 'entries' | 'settings';
export type Dialog = { kind: 'account'; sessionId: string; uid: string } | { kind: 'bank'; sessionId: string } | null;
export interface AccountStats {
  imported: number;
  recent: number;
}
export interface EntryItem extends EntryRow {
  sessionId: string;
  bank: string;
  accountName: string;
  activity?: ActivityDetails;
}

export function useBankSync(ctx: AddonContext, search: string) {
  const { api } = ctx;
  const [view, setView] = useState<View>('overview');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [spending, setSpending] = useState<SpendingContextLike | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastAutoRun, setLastAutoRun] = useState<number>();
  const [configured, setConfigured] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [stats, setStats] = useState<Record<string, AccountStats>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string>();
  const [now, setNow] = useState(() => Date.now());
  const connectionsRef = useRef<Connection[]>([]);

  const fail = useCallback((e: unknown) => api.toast.error(e instanceof Error ? e.message : String(e)), [api]);

  const persist = useCallback(
    async (next: Connection[]) => {
      connectionsRef.current = next;
      setConnections(next);
      await saveConnections(api.storage, next);
    },
    [api],
  );

  const loadStats = useCallback(
    async (list: Connection[]) => {
      const since = Date.now() - RECENT_DAYS * DAY_MS;
      const next: Record<string, AccountStats> = {};
      for (const c of list) {
        for (const a of c.accounts) {
          if (!a.accountId) continue;
          const imported = (await api.activities.getAll(a.accountId)).filter((x) =>
            x.sourceRecordId?.startsWith('addon:enable-banking-sync:'),
          );
          next[a.uid] = {
            imported: imported.length,
            recent: imported.filter((x) => new Date(x.date).getTime() >= since).length,
          };
        }
      }
      setStats(next);
    },
    [api],
  );

  const reload = useCallback(async () => {
    const list = await loadConnections(api.storage);
    setConnections(list);
    connectionsRef.current = list;
    setAccounts(await api.accounts.getAll());
    setSettings(await loadSettings(api.storage));
    setLog(await loadLog(api.storage));
    const last = await api.storage.get(LAST_AUTO_KEY);
    setLastAutoRun(last ? Number(last) : undefined);
    setRedirectUrl((await api.storage.get(REDIRECT_KEY)) ?? '');
    setConfigured(Boolean(await api.secrets.get(APP_ID_SECRET)) && Boolean(await api.secrets.get(PRIVATE_KEY_SECRET)));
    setSpending(await api.spending.getContext().catch(() => null));
    await loadStats(list);
  }, [api, loadStats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the host API on mount, setState runs after awaiting it
    reload().catch(fail);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(tick);
  }, [reload, fail]);

  useEffect(() => {
    const callback = parseCallback(search);
    if (!callback) return;
    (async () => {
      if ('error' in callback) throw new Error(`Bank authorisation failed: ${callback.error}`);
      const pending = await consumePending(api.storage, callback.state);
      if (!pending) throw new Error('Unknown authorisation state; start the connection again');

      const session = await (await createClient(api)).createSession(callback.code);
      const existing = await loadConnections(api.storage);
      const connection: Connection = {
        sessionId: session.session_id,
        aspsp: pending,
        validUntil: session.access.valid_until,
        color: defaultBankColor(existing.length),
        accounts: session.accounts.map((a) => ({
          uid: a.uid,
          name: a.name ?? a.details ?? a.account_id?.iban ?? a.uid,
          iban: a.account_id?.iban,
          currency: a.currency ?? 'EUR',
        })),
      };
      await persist(renewConnection(existing, connection));
      await appendLog(api.storage, {
        at: Date.now(),
        kind: 'bank',
        ok: true,
        title: 'Bank connected',
        detail: pending.name,
      });
      setLog(await loadLog(api.storage));
      setView('add');
      api.toast.success(`Connected ${pending.name}. Link its accounts below.`);
    })().catch(fail);
  }, [search, api, persist, fail]);

  const saveCredentials = async (appId: string, privateKey: string, redirect: string) => {
    try {
      await api.secrets.set(APP_ID_SECRET, appId.trim());
      await api.secrets.set(PRIVATE_KEY_SECRET, privateKey.trim());
      await api.storage.set(REDIRECT_KEY, redirect.trim());
      await api.storage.delete('eb-jwt-exp');
      setRedirectUrl(redirect.trim());
      setConfigured(true);
      api.toast.success('Credentials saved');
    } catch (e) {
      fail(e);
    }
  };

  const updateSettings = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await saveSettings(api.storage, next);
    } catch (e) {
      fail(e);
    }
  };

  const listBanks = async (country: string): Promise<Aspsp[]> => {
    try {
      return await (await createClient(api)).listAspsps(country);
    } catch (e) {
      fail(e);
      return [];
    }
  };

  const connect = async (aspsp: Pick<Aspsp, 'name' | 'country' | 'maximum_consent_validity'>) => {
    try {
      const state = crypto.randomUUID();
      const { url } = await (
        await createClient(api)
      ).startAuth({
        aspsp,
        redirectUrl,
        state,
        validUntil: consentValidUntil(aspsp.maximum_consent_validity, Date.now()),
      });
      await savePending(api.storage, state, { name: aspsp.name, country: aspsp.country });
      setAuthUrl(url);
    } catch (e) {
      fail(e);
    }
  };

  const saveAccount = async (
    sessionId: string,
    uid: string,
    patch: { accountId?: string; syncEnabled?: boolean; importFrom?: string; longestHistory?: boolean },
  ) => {
    try {
      let accountId = patch.accountId;
      if (accountId === 'new') {
        const connection = connectionsRef.current.find((c) => c.sessionId === sessionId)!;
        const source = connection.accounts.find((a) => a.uid === uid)!;
        const created = await api.accounts.create(buildAccountPayload(connection.aspsp.name, source));
        setAccounts(await api.accounts.getAll());
        accountId = created.id;
      }
      await persist(
        updateAccount(connectionsRef.current, sessionId, uid, { ...patch, ...(accountId && { accountId }) }),
      );
      setSpending(await api.spending.getContext().catch(() => null));
    } catch (e) {
      fail(e);
    }
  };

  const setColor = (sessionId: string, color: string) =>
    persist(setBankColor(connectionsRef.current, sessionId, color)).catch(fail);

  const removeBank = async (sessionId: string) => {
    const bank = connectionsRef.current.find((c) => c.sessionId === sessionId);
    await persist(removeConnection(connectionsRef.current, sessionId)).catch(fail);
    if (bank)
      await appendLog(api.storage, {
        at: Date.now(),
        kind: 'bank',
        ok: true,
        title: 'Bank removed',
        detail: bank.aspsp.name,
      });
    setLog(await loadLog(api.storage));
    setDialog(null);
  };

  const sync = async (
    scope: { sessionId?: string; uid?: string },
    kind: LogEntry['kind'],
    base = connectionsRef.current,
  ) => {
    setBusy(scope.uid ?? scope.sessionId ?? 'all');
    try {
      const deps = await createSyncDeps(api);
      let next = base;
      let imported = 0;
      let duplicates = 0;
      let limited = false;
      const errors: string[] = [];

      for (const c of base.filter((x) => !scope.sessionId || x.sessionId === scope.sessionId)) {
        const subset = scope.uid ? { ...c, accounts: c.accounts.filter((a) => a.uid === scope.uid) } : c;
        try {
          const result = await syncConnection(subset, deps);
          next = next.map((x) =>
            x.sessionId === c.sessionId
              ? { ...x, accounts: x.accounts.map((a) => result.updated.accounts.find((u) => u.uid === a.uid) ?? a) }
              : x,
          );
          result.reports.forEach((r) => {
            imported += r.imported ?? 0;
            duplicates += r.duplicates ?? 0;
            limited ||= r.limited === true;
            if (r.error) errors.push(r.error);
          });
        } catch (e) {
          errors.push(e instanceof Error ? e.message : String(e));
        }
      }

      await persist(next);
      const summary = summarizeRun(kind, { imported, duplicates, limited, errors });
      await appendLog(api.storage, { at: Date.now(), kind, ...summary });
      setLog(await loadLog(api.storage));
      if (errors.length) api.toast.error(errors.join('; '));
      else api.toast.success(limited ? `${summary.detail}` : `Imported ${imported} new transactions`);
      await loadStats(next);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const reimport = (sessionId: string, uid: string) =>
    sync({ sessionId, uid }, 'history', resetAccountSync(connectionsRef.current, sessionId, uid));

  const fetchEntries = useCallback(
    async (days: number): Promise<EntryItem[]> => {
      const client = await createClient(api);
      const dateFrom = new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
      const jobs = connectionsRef.current.flatMap((c) =>
        c.accounts.map(async (a) => {
          const [activities, transactions] = await Promise.all([
            a.accountId ? api.activities.getAll(a.accountId) : Promise.resolve([]),
            client.getTransactions(a.uid, { dateFrom }),
          ]);
          const byRef = new Map(
            activities.map((x) => [x.sourceRecordId?.replace('addon:enable-banking-sync:', ''), x]),
          );
          return toEntryRows(a.uid, transactions, importedRefs(activities)).map<EntryItem>((r) => ({
            ...r,
            sessionId: c.sessionId,
            bank: c.aspsp.name,
            accountName: a.name,
            activity: byRef.get(r.ref),
          }));
        }),
      );
      const items = (await Promise.all(jobs)).flat();
      return items.sort((x, y) => (x.date < y.date ? 1 : -1));
    },
    [api],
  );

  const importEntry = async (item: EntryItem) => {
    const account = connectionsRef.current.flatMap((c) => c.accounts).find((a) => a.uid === item.accountUid);
    if (!account?.accountId) return api.toast.error('Link this bank account to a Wealthfolio account first');
    try {
      const checked = await api.activities.checkImport(mapTransactions(account.accountId, [item.raw]));
      const { summary } = await api.activities.import(checked);
      api.toast.success(summary.imported ? 'Entry imported' : 'Already in Wealthfolio');
    } catch (e) {
      fail(e);
    }
  };

  const warningFor = (accountId?: string) => (accountId ? spendingWarning(spending, accountId) : null);
  const wfAccountName = (accountId?: string) => accounts.find((a) => a.id === accountId)?.name;

  return {
    api,
    view,
    setView,
    dialog,
    setDialog,
    connections,
    accounts,
    settings,
    updateSettings,
    log,
    lastAutoRun,
    configured,
    redirectUrl,
    stats,
    busy,
    authUrl,
    now,
    spending,
    saveCredentials,
    listBanks,
    connect,
    saveAccount,
    setColor,
    removeBank,
    sync,
    reimport,
    fetchEntries,
    importEntry,
    warningFor,
    wfAccountName,
    reload,
  };
}

export type BankSync = ReturnType<typeof useBankSync>;
