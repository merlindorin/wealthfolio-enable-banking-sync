import { describe, expect, it, vi } from 'vitest';
import { TransactionsPeriodError } from './client';
import type { Connection } from './state';
import { syncConnection, type SyncDeps } from './sync';

const connection = (account: Partial<Connection['accounts'][number]> = {}): Connection => ({
  sessionId: 's',
  aspsp: { name: 'Bank', country: 'FR' },
  validUntil: '2027-06-01T00:00:00Z',
  accounts: [{ uid: 'u', name: 'A', currency: 'EUR', accountId: 'wf', importFrom: '2026-07-01', ...account }],
});

const deps = (getTransactions: SyncDeps['getTransactions']): SyncDeps => ({
  getTransactions,
  checkImport: vi.fn(async (rows) => rows),
  importActivities: vi.fn(async () => ({ summary: { imported: 0, duplicates: 0, skipped: 0 } })),
  today: () => '2026-11-27',
});

const periodError = () => new TransactionsPeriodError('Wrong transactions period requested');

describe('a bank that refuses the requested period', () => {
  it('retries with the longest strategy, keeping the requested start date', async () => {
    const getTransactions = vi.fn().mockRejectedValueOnce(periodError()).mockResolvedValueOnce([]);
    const result = await syncConnection(connection(), deps(getTransactions));

    expect(getTransactions).toHaveBeenNthCalledWith(1, 'u', { dateFrom: '2026-07-01' });
    expect(getTransactions).toHaveBeenNthCalledWith(2, 'u', { dateFrom: '2026-07-01', strategy: 'longest' });
    expect(result.reports[0]).toMatchObject({ uid: 'u', limited: true });
    expect(result.reports[0].error).toBeUndefined();
    expect(result.updated.accounts[0].lastSyncedOn).toBe('2026-11-27');
  });

  it('then falls back to the period the bank picks itself', async () => {
    const getTransactions = vi
      .fn()
      .mockRejectedValueOnce(periodError())
      .mockRejectedValueOnce(periodError())
      .mockResolvedValueOnce([]);
    const result = await syncConnection(connection(), deps(getTransactions));

    expect(getTransactions).toHaveBeenNthCalledWith(3, 'u', {});
    expect(result.reports[0].limited).toBe(true);
  });

  it('does not retry the longest strategy twice when it was already requested', async () => {
    const getTransactions = vi.fn().mockRejectedValueOnce(periodError()).mockResolvedValueOnce([]);
    await syncConnection(connection({ longestHistory: true }), deps(getTransactions));

    expect(getTransactions).toHaveBeenNthCalledWith(1, 'u', { dateFrom: '2026-07-01', strategy: 'longest' });
    expect(getTransactions).toHaveBeenNthCalledWith(2, 'u', {});
  });

  it('reports the error when even the bank default is refused', async () => {
    const getTransactions = vi.fn().mockRejectedValue(periodError());
    const result = await syncConnection(connection(), deps(getTransactions));

    expect(getTransactions).toHaveBeenCalledTimes(3);
    expect(result.reports[0].error).toMatch(/period/i);
    expect(result.updated.accounts[0].lastSyncedOn).toBeUndefined();
  });

  it('does not retry other failures', async () => {
    const getTransactions = vi.fn().mockRejectedValue(new Error('Enable Banking GET failed (500): boom'));
    const result = await syncConnection(connection(), deps(getTransactions));

    expect(getTransactions).toHaveBeenCalledTimes(1);
    expect(result.reports[0].error).toMatch(/boom/);
    expect(result.reports[0].limited).toBeUndefined();
  });

  it('does not flag an account that was fine the first time', async () => {
    const getTransactions = vi.fn().mockResolvedValue([]);
    const result = await syncConnection(connection(), deps(getTransactions));
    expect(result.reports[0].limited).toBeUndefined();
  });
});
