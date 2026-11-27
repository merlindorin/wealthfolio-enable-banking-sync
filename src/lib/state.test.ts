import { describe, expect, it } from 'vitest';
import { loadConnections, saveConnections, linkAccount, resetSyncDates, type Connection } from './state';

const memory = () => {
  const m = new Map<string, string>();
  return { get: async (k: string) => m.get(k) ?? null, set: async (k: string, v: string) => void m.set(k, v) };
};

const conn: Connection = {
  sessionId: 's',
  aspsp: { name: 'B', country: 'FR' },
  validUntil: '2027-01-01T00:00:00Z',
  accounts: [{ uid: 'u1', name: 'A', currency: 'EUR' }],
};

describe('connection state', () => {
  it('round-trips connections and defaults to empty', async () => {
    const s = memory();
    expect(await loadConnections(s)).toEqual([]);
    await saveConnections(s, [conn]);
    expect(await loadConnections(s)).toEqual([conn]);
  });

  it('survives corrupt stored data', async () => {
    const s = memory();
    await s.set('eb-connections', '{not json');
    expect(await loadConnections(s)).toEqual([]);
  });

  it('links a bank account to a Wealthfolio account immutably', () => {
    const next = linkAccount(conn, 'u1', 'wf-9');
    expect(next.accounts[0].accountId).toBe('wf-9');
    expect(conn.accounts[0].accountId).toBeUndefined();
  });

  it('resets sync dates so the next sync uses the history settings', () => {
    const synced = { ...conn, accounts: [{ ...conn.accounts[0], lastSyncedOn: '2026-11-27' }] };
    expect(resetSyncDates(synced).accounts[0].lastSyncedOn).toBeUndefined();
    expect(synced.accounts[0].lastSyncedOn).toBe('2026-11-27');
  });
});
