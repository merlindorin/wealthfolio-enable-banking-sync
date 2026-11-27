import { describe, expect, it, vi } from 'vitest';
import { autoSyncIfDue, type AutoSyncDeps } from './auto-sync';
import { DEFAULT_SETTINGS } from './settings';
import type { Connection } from './state';

const conn = (id: string, validUntil = '2027-06-01T00:00:00Z'): Connection => ({
  sessionId: id,
  aspsp: { name: id, country: 'FR' },
  validUntil,
  accounts: [{ uid: `${id}-u`, name: 'A', currency: 'EUR', accountId: `wf-${id}` }],
});

function setup(
  opts: { settings?: Partial<typeof DEFAULT_SETTINGS>; connections?: Connection[]; lastRun?: number } = {},
) {
  const store = new Map<string, string>();
  store.set('eb-settings', JSON.stringify({ ...DEFAULT_SETTINGS, autoSync: true, intervalHours: 6, ...opts.settings }));
  store.set('eb-connections', JSON.stringify(opts.connections ?? [conn('a')]));
  if (opts.lastRun !== undefined) store.set('eb-last-auto-sync', String(opts.lastRun));

  const syncDeps = {
    getTransactions: vi.fn(async () => []),
    checkImport: vi.fn(async (r: never[]) => r),
    importActivities: vi.fn(async () => ({ summary: { imported: 0, duplicates: 0, skipped: 0 } })),
    today: () => '2026-11-27',
  };
  const deps: AutoSyncDeps = {
    storage: { get: async (k) => store.get(k) ?? null, set: async (k, v) => void store.set(k, v) },
    createSyncDeps: vi.fn(async () => syncDeps as never),
    now: () => Date.parse('2026-11-27T12:00:00Z'),
    log: vi.fn(),
  };
  return { deps, store, syncDeps };
}

describe('autoSyncIfDue', () => {
  it('does nothing when auto sync is disabled', async () => {
    const { deps, syncDeps } = setup({ settings: { autoSync: false } });
    expect(await autoSyncIfDue(deps)).toBe(false);
    expect(syncDeps.getTransactions).not.toHaveBeenCalled();
  });

  it('does nothing when the last run is recent', async () => {
    const { deps, syncDeps } = setup({ lastRun: Date.parse('2026-11-27T10:00:00Z') });
    expect(await autoSyncIfDue(deps)).toBe(false);
    expect(syncDeps.getTransactions).not.toHaveBeenCalled();
  });

  it('syncs every linked connection when due and records the run time', async () => {
    const { deps, store, syncDeps } = setup({
      connections: [conn('a'), conn('b')],
      lastRun: Date.parse('2026-11-26T00:00:00Z'),
    });
    expect(await autoSyncIfDue(deps)).toBe(true);
    expect(syncDeps.getTransactions).toHaveBeenCalledTimes(2);
    expect(store.get('eb-last-auto-sync')).toBe(String(Date.parse('2026-11-27T12:00:00Z')));
    const saved = JSON.parse(store.get('eb-connections')!) as Connection[];
    expect(saved[0].accounts[0].lastSyncedOn).toBe('2026-11-27');
  });

  it('skips expired connections but still syncs the others', async () => {
    const { deps, syncDeps } = setup({ connections: [conn('old', '2026-01-01T00:00:00Z'), conn('ok')] });
    await autoSyncIfDue(deps);
    expect(syncDeps.getTransactions).toHaveBeenCalledTimes(1);
    expect(deps.log).toHaveBeenCalledWith(expect.stringMatching(/expired/i));
  });

  it('does not run concurrently with itself', async () => {
    const { deps, syncDeps } = setup();
    await Promise.all([autoSyncIfDue(deps), autoSyncIfDue(deps)]);
    expect(syncDeps.getTransactions).toHaveBeenCalledTimes(1);
  });

  it('records the run in the sync log with totals', async () => {
    const { deps, store, syncDeps } = setup();
    syncDeps.getTransactions.mockResolvedValue([
      {
        entry_reference: 'a',
        transaction_amount: { amount: '1', currency: 'EUR' },
        credit_debit_indicator: 'DBIT',
        booking_date: '2026-11-25',
      },
    ] as never);
    syncDeps.importActivities.mockResolvedValue({ summary: { imported: 1, duplicates: 4, skipped: 0 } });

    await autoSyncIfDue(deps);

    const log = JSON.parse(store.get('eb-sync-log')!);
    expect(log[0]).toMatchObject({ kind: 'auto', ok: true, title: 'Auto sync', detail: '1 new, 4 already known' });
  });

  it('puts the error messages in the log entry so a failure can be diagnosed', async () => {
    const { deps, store, syncDeps } = setup();
    syncDeps.getTransactions.mockRejectedValue(new Error('Enable Banking GET /accounts failed (429): rate limited'));

    await autoSyncIfDue(deps);

    const [entry] = JSON.parse(store.get('eb-sync-log')!);
    expect(entry.ok).toBe(false);
    expect(entry.detail).toContain('rate limited');
  });
});
