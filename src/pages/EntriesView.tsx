import { useCallback, useEffect, useMemo, useState } from 'react';
import { summarizeEntries, type EntryStatus } from '../lib/entries';
import type { BankSync, EntryItem } from '../hooks/useBankSync';

const PERIODS = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 365, label: 'Last year' },
];
const eur = (n: number, currency: string) =>
  `${n < 0 ? '−' : '+'}${Math.abs(n).toFixed(2).replace('.', ',')} ${currency === 'EUR' ? '€' : currency}`;
const keyOf = (e: EntryItem) => `${e.accountUid}:${e.ref}`;

export function EntriesView({ app }: { app: BankSync }) {
  const [items, setItems] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [status, setStatus] = useState<'all' | EntryStatus>('all');
  const [account, setAccount] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const { fetchEntries, api } = app;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchEntries(days));
    } catch (e) {
      api.toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [fetchEntries, days, api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the bank on mount, setState runs after awaiting it
    void load();
  }, [load]);

  const scoped = useMemo(() => items.filter((i) => !account || i.accountUid === account), [items, account]);
  const counts = summarizeEntries(scoped);
  const shown = scoped.filter(
    (i) =>
      (status === 'all' || i.status === status) &&
      (!query || `${i.text} ${i.ref}`.toLowerCase().includes(query.toLowerCase())),
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      api.toast.success('Copied');
    } catch {
      api.toast.error('Copy is blocked here; select the text instead');
    }
  };

  const tabs: Array<[typeof status, string]> = [
    ['all', 'All'],
    ['imported', 'Imported'],
    ['not-imported', 'Not imported'],
  ];

  return (
    <>
      <div className="ebs-row ebs-between">
        <div className="ebs-col" style={{ gap: 4, maxWidth: 720 }}>
          <h1>Entries</h1>
          <span className="ebs-muted" style={{ lineHeight: 1.5 }}>
            Everything your banks return, next to what is already in Wealthfolio. Open any row to see the raw data, for
            debugging.
          </span>
        </div>
        <div className="ebs-row">
          <button
            className="ebs-btn"
            onClick={() =>
              copy(
                JSON.stringify(
                  shown.map((s) => s.raw),
                  null,
                  2,
                ),
              )
            }
          >
            Copy visible as JSON
          </button>
          <button className="ebs-btn" onClick={() => app.setView('overview')}>
            Back to overview
          </button>
          <button className="ebs-btn ebs-btn-primary" disabled={loading} onClick={load}>
            {loading ? 'Loading…' : 'Reload from banks'}
          </button>
        </div>
      </div>

      <div className="ebs-tabs" role="tablist" aria-label="Status">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            className="ebs-tab"
            aria-selected={status === key}
            onClick={() => setStatus(key)}
          >
            {label} <strong style={{ marginLeft: 6 }}>{counts[key]}</strong>
          </button>
        ))}
      </div>

      <div className="ebs-row">
        <input
          className="ebs-input"
          style={{ flex: '2 1 280px', width: 'auto' }}
          placeholder="Search description or bank reference…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="ebs-input"
          style={{ flex: '0 1 260px', width: 'auto' }}
          aria-label="Account"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          <option value="">All accounts</option>
          {app.connections.flatMap((c) =>
            c.accounts.map((a) => <option key={a.uid} value={a.uid}>{`${c.aspsp.name} · ${a.name}`}</option>),
          )}
        </select>
        <select
          className="ebs-input"
          style={{ flex: '0 1 190px', width: 'auto' }}
          aria-label="Period"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {PERIODS.map((p) => (
            <option key={p.days} value={p.days}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ebs-card" style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        {!shown.length && (
          <div style={{ padding: 20 }} className="ebs-muted">
            {loading ? 'Loading entries from your banks…' : 'No entries.'}
          </div>
        )}
        {shown.map((e) => {
          const expanded = open === keyOf(e);
          return (
            <div key={keyOf(e)} className="ebs-table-row" style={{ background: expanded ? '#f3efd9' : 'transparent' }}>
              <div className="ebs-entry">
                <span style={{ flex: '0 0 118px' }}>
                  <span className={`ebs-pill ${e.status === 'imported' ? 'ebs-ok' : 'ebs-warn'}`}>
                    {e.status === 'imported' ? 'Imported' : 'Not imported'}
                  </span>
                </span>
                <span style={{ flex: '0 0 84px' }} className="ebs-muted">
                  {e.date}
                </span>
                <span
                  style={{ flex: '0 0 130px' }}
                  className="ebs-muted ebs-ellipsis"
                  title={`${e.bank} · ${e.accountName}`}
                >
                  {e.bank}
                </span>
                <span style={{ flex: '1 1 200px', minWidth: 0 }} className="ebs-ellipsis" title={e.text}>
                  {e.text}
                </span>
                <strong
                  style={{ flex: '0 0 110px', textAlign: 'right', color: e.amount < 0 ? 'var(--bad)' : 'var(--ok)' }}
                >
                  {eur(e.amount, e.currency)}
                </strong>
                <button
                  className="ebs-btn"
                  aria-expanded={expanded}
                  style={{ flex: '0 0 96px', padding: 0 }}
                  onClick={() => setOpen(expanded ? null : keyOf(e))}
                >
                  {expanded ? 'Hide' : 'Details'}
                </button>
              </div>
              {expanded && (
                <div className="ebs-row" style={{ alignItems: 'flex-start', gap: 16, padding: '4px 16px 18px' }}>
                  <div className="ebs-col" style={{ flex: '1 1 380px', minWidth: 0, gap: 8 }}>
                    <span className="ebs-label">From the bank (raw)</span>
                    <pre className="ebs-pre">{JSON.stringify(e.raw, null, 2)}</pre>
                  </div>
                  <div className="ebs-col" style={{ flex: '1 1 320px', minWidth: 0, gap: 8 }}>
                    <span className="ebs-label">In Wealthfolio</span>
                    <div className="ebs-pre ebs-col" style={{ gap: 8 }}>
                      {(e.activity
                        ? [
                            ['Activity type', e.activity.activityType],
                            ['Amount', `${e.activity.amount} ${e.activity.currency}`],
                            ['Date', new Date(e.activity.date).toISOString().slice(0, 10)],
                            ['Account', e.activity.accountName],
                            ['Source record id', e.activity.sourceRecordId ?? ''],
                            ['Activity id', e.activity.id],
                            ['Import run', e.activity.importRunId ?? '—'],
                          ]
                        : [
                            ['Status', 'Not imported yet'],
                            ['Would be', e.amount < 0 ? 'WITHDRAWAL' : 'DEPOSIT'],
                            ['Source record id', `addon:enable-banking-sync:${e.ref}`],
                          ]
                      ).map(([k, v]) => (
                        <div
                          key={k}
                          className="ebs-row ebs-between"
                          style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}
                        >
                          <span className="ebs-muted" style={{ flex: '0 0 120px' }}>
                            {k}
                          </span>
                          <span style={{ flex: 1, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ebs-row">
                      <button className="ebs-btn" onClick={() => copy(JSON.stringify(e.raw, null, 2))}>
                        Copy raw JSON
                      </button>
                      {e.activity ? (
                        <button
                          className="ebs-btn ebs-btn-primary"
                          onClick={() => api.navigation.navigate('/activities')}
                        >
                          Open activities
                        </button>
                      ) : (
                        <button
                          className="ebs-btn ebs-btn-primary"
                          onClick={async () => {
                            await app.importEntry(e);
                            await load();
                          }}
                        >
                          Import this entry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
