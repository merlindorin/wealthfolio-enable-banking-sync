import { describe, expect, it, vi } from 'vitest';
import { syncConnection, type SyncDeps } from './sync';
import type { Connection } from './state';

const connection: Connection = {
  sessionId: 's1',
  aspsp: { name: 'Bank', country: 'FR' },
  validUntil: '2027-06-01T00:00:00Z',
  accounts: [
    { uid: 'u1', name: 'Checking', currency: 'EUR', accountId: 'wf-1', lastSyncedOn: '2026-11-20' },
    { uid: 'u2', name: 'Savings', currency: 'EUR' },
  ],
};

const tx = (ref: string) => ({
  entry_reference: ref,
  transaction_amount: { amount: '1.00', currency: 'EUR' },
  credit_debit_indicator: 'DBIT' as const,
  booking_date: '2026-11-25',
});

function deps(overrides: Partial<SyncDeps> = {}): SyncDeps {
  return {
    getTransactions: vi.fn(async () => [tx('a'), tx('b')]),
    checkImport: vi.fn(async (rows) => rows),
    importActivities: vi.fn(async (rows) => ({ summary: { imported: rows.length, duplicates: 0, skipped: 0 } })),
    today: () => '2026-11-27',
    ...overrides,
  };
}

describe('syncConnection', () => {
  it('imports only linked accounts', async () => {
    const d = deps();
    await syncConnection(connection, d);

    expect(d.getTransactions).toHaveBeenCalledTimes(1);
    expect(d.getTransactions).toHaveBeenCalledWith('u1', expect.anything());
  });

  it('always asks the bank for its longest history, on the first sync and on every later one', async () => {
    const d = deps();
    const fresh = { ...connection, accounts: [{ ...connection.accounts[0], lastSyncedOn: undefined }] };
    await syncConnection(fresh, d);
    await syncConnection(connection, d);

    expect(d.getTransactions).toHaveBeenNthCalledWith(1, 'u1', { strategy: 'longest' });
    expect(d.getTransactions).toHaveBeenNthCalledWith(2, 'u1', { strategy: 'longest' });
  });

  it('validates rows before importing and reports counts', async () => {
    const d = deps();
    const result = await syncConnection(connection, d);

    expect(d.checkImport).toHaveBeenCalledOnce();
    expect(d.importActivities).toHaveBeenCalledOnce();
    expect(result.updated.accounts[0].lastSyncedOn).toBe('2026-11-27');
    expect(result.reports).toEqual([{ uid: 'u1', fetched: 2, imported: 2, duplicates: 0 }]);
  });

  it('does not advance lastSyncedOn when the import fails and keeps syncing other accounts', async () => {
    const twoLinked = { ...connection, accounts: connection.accounts.map((a) => ({ ...a, accountId: `wf-${a.uid}` })) };
    const d = deps({
      getTransactions: vi.fn(async (uid) => {
        if (uid === 'u1') throw new Error('boom');
        return [tx('x')];
      }),
    });

    const result = await syncConnection(twoLinked, d);

    expect(result.updated.accounts[0].lastSyncedOn).toBe('2026-11-20');
    expect(result.updated.accounts[1].lastSyncedOn).toBe('2026-11-27');
    expect(result.reports[0]).toMatchObject({ uid: 'u1', error: 'boom' });
  });

  it('refuses to sync an expired consent', async () => {
    const expired = { ...connection, validUntil: '2026-11-01T00:00:00Z' };
    await expect(syncConnection(expired, deps())).rejects.toThrow(/expired/i);
  });
});
