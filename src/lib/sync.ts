import type { ActivityImport } from '@wealthfolio/addon-sdk';
import { mapTransactions, type BankTransaction } from './mapping';
import { TransactionsPeriodError, type TransactionsOptions } from './client';
import type { Connection } from './state';

const OVERLAP_DAYS = 7;
const DAY_MS = 86_400_000;

export interface SyncDeps {
  getTransactions(uid: string, options: TransactionsOptions): Promise<BankTransaction[]>;
  checkImport(rows: ActivityImport[]): Promise<ActivityImport[]>;
  importActivities(
    rows: ActivityImport[],
  ): Promise<{ summary: { imported: number; duplicates: number; skipped: number } }>;
  today(): string;
  now?(): number;
}

export interface AccountReport {
  uid: string;
  fetched?: number;
  imported?: number;
  duplicates?: number;
  limited?: boolean;
  error?: string;
}

export interface SyncResult {
  updated: Connection;
  reports: AccountReport[];
}

async function fetchWithFallback(deps: SyncDeps, uid: string, options: TransactionsOptions) {
  const attempts: TransactionsOptions[] = [options];
  if (options.dateFrom && options.strategy !== 'longest')
    attempts.push({ dateFrom: options.dateFrom, strategy: 'longest' });
  attempts.push({});

  for (const [index, attempt] of attempts.entries()) {
    try {
      return { transactions: await deps.getTransactions(uid, attempt), limited: index > 0 };
    } catch (error) {
      if (!(error instanceof TransactionsPeriodError) || index === attempts.length - 1) throw error;
    }
  }
  throw new Error('unreachable');
}

const daysBefore = (date: string, days: number) =>
  new Date(Date.parse(date) - days * DAY_MS).toISOString().slice(0, 10);

export async function syncConnection(connection: Connection, deps: SyncDeps): Promise<SyncResult> {
  const today = deps.today();
  if (Date.parse(connection.validUntil) < Date.parse(today)) {
    throw new Error(
      `Bank consent for ${connection.aspsp.name} expired on ${connection.validUntil.slice(0, 10)}; reconnect it`,
    );
  }

  const reports: AccountReport[] = [];
  const accounts = [];

  for (const account of connection.accounts) {
    if (!account.accountId || account.syncEnabled === false) {
      accounts.push(account);
      continue;
    }
    try {
      const options: TransactionsOptions = account.lastSyncedOn
        ? { dateFrom: daysBefore(account.lastSyncedOn, OVERLAP_DAYS) }
        : { dateFrom: account.importFrom, ...(account.longestHistory && { strategy: 'longest' as const }) };
      const { transactions, limited } = await fetchWithFallback(deps, account.uid, options);
      const checked = await deps.checkImport(mapTransactions(account.accountId, transactions));
      const { summary } = await deps.importActivities(checked);

      reports.push({
        uid: account.uid,
        fetched: transactions.length,
        imported: summary.imported,
        duplicates: summary.duplicates,
        ...(limited && { limited }),
      });
      accounts.push({ ...account, lastSyncedOn: today, lastSyncedAt: (deps.now ?? Date.now)() });
    } catch (error) {
      reports.push({ uid: account.uid, error: error instanceof Error ? error.message : String(error) });
      accounts.push(account);
    }
  }

  return { updated: { ...connection, accounts }, reports };
}
