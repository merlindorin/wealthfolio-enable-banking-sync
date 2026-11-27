import { describe, expect, it, vi } from 'vitest';
import { syncConnection, type SyncDeps } from './sync';
import type { Connection } from './state';

const connection = (accounts: Connection['accounts']): Connection => ({
  sessionId: 's',
  aspsp: { name: 'Bank', country: 'FR' },
  validUntil: '2027-06-01T00:00:00Z',
  accounts,
});

const deps = (): SyncDeps => ({
  getTransactions: vi.fn(async () => []),
  checkImport: vi.fn(async (rows) => rows),
  importActivities: vi.fn(async () => ({ summary: { imported: 0, duplicates: 0, skipped: 0 } })),
  today: () => '2026-11-27',
  now: () => 1_700_000_000_000,
});

describe('per-account sync options', () => {
  it('skips accounts that have syncing turned off', async () => {
    const d = deps();
    const result = await syncConnection(
      connection([
        { uid: 'on', name: 'On', currency: 'EUR', accountId: 'wf-1' },
        { uid: 'off', name: 'Off', currency: 'EUR', accountId: 'wf-2', syncEnabled: false },
      ]),
      d,
    );
    expect(d.getTransactions).toHaveBeenCalledTimes(1);
    expect(d.getTransactions).toHaveBeenCalledWith('on', expect.anything());
    expect(result.reports.map((r) => r.uid)).toEqual(['on']);
  });

  it('starts the first sync at the account import date', async () => {
    const d = deps();
    await syncConnection(
      connection([{ uid: 'u', name: 'A', currency: 'EUR', accountId: 'wf', importFrom: '2025-11-03' }]),
      d,
    );
    expect(d.getTransactions).toHaveBeenCalledWith('u', { dateFrom: '2025-11-03' });
  });

  it('combines the import date with the longest history', async () => {
    const d = deps();
    await syncConnection(
      connection([
        { uid: 'u', name: 'A', currency: 'EUR', accountId: 'wf', importFrom: '2025-11-03', longestHistory: true },
      ]),
      d,
    );
    expect(d.getTransactions).toHaveBeenCalledWith('u', { dateFrom: '2025-11-03', strategy: 'longest' });
  });

  it('ignores the import date once the account was synced', async () => {
    const d = deps();
    await syncConnection(
      connection([
        { uid: 'u', name: 'A', currency: 'EUR', accountId: 'wf', importFrom: '2025-11-03', lastSyncedOn: '2026-11-20' },
      ]),
      d,
    );
    expect(d.getTransactions).toHaveBeenCalledWith('u', { dateFrom: '2026-11-13' });
  });

  it('records when each synced account was last synced', async () => {
    const result = await syncConnection(
      connection([{ uid: 'u', name: 'A', currency: 'EUR', accountId: 'wf' }]),
      deps(),
    );
    expect(result.updated.accounts[0].lastSyncedAt).toBe(1_700_000_000_000);
  });
});
