import { describe, expect, it } from 'vitest';
import {
  bankInitials,
  BANK_COLORS,
  consentTone,
  daysLeft,
  defaultBankColor,
  removeConnection,
  renewConnection,
  resetAccountSync,
  setBankColor,
  syncLabel,
  timeAgo,
  updateAccount,
} from './bank';
import type { Connection } from './state';

const conn = (id: string): Connection => ({
  sessionId: id,
  aspsp: { name: 'Crédit Agricole de Centre-Est', country: 'FR' },
  validUntil: '2027-02-25T00:00:00Z',
  accounts: [
    { uid: 'u1', name: 'A', currency: 'EUR', accountId: 'wf-1', lastSyncedOn: '2026-11-20' },
    { uid: 'u2', name: 'B', currency: 'EUR' },
  ],
});

describe('bankInitials', () => {
  it('uses the first letters of the first two significant words', () => {
    expect(bankInitials('Crédit Agricole de Centre-Est')).toBe('CA');
    expect(bankInitials('Société Générale')).toBe('SG');
  });
  it('uses the first two letters of a single word', () => {
    expect(bankInitials('Boursorama')).toBe('BO');
    expect(bankInitials('N26')).toBe('N2');
  });
});

describe('colors', () => {
  it('cycles the default palette by position', () => {
    expect(defaultBankColor(0)).toBe(BANK_COLORS[0]);
    expect(defaultBankColor(BANK_COLORS.length)).toBe(BANK_COLORS[0]);
  });

  it('sets the color of one connection only', () => {
    const next = setBankColor([conn('a'), conn('b')], 'b', '#234e78');
    expect(next[0].color).toBeUndefined();
    expect(next[1].color).toBe('#234e78');
  });
});

describe('updateAccount', () => {
  it('patches one bank account and leaves the others and the input untouched', () => {
    const list = [conn('a')];
    const next = updateAccount(list, 'a', 'u2', {
      accountId: 'wf-2',
      syncEnabled: false,
    });

    expect(next[0].accounts[1]).toMatchObject({
      accountId: 'wf-2',
      syncEnabled: false,
    });
    expect(next[0].accounts[0].accountId).toBe('wf-1');
    expect(list[0].accounts[1].accountId).toBeUndefined();
  });
});

describe('removeConnection', () => {
  it('drops the connection with that session id', () => {
    expect(removeConnection([conn('a'), conn('b')], 'a').map((c) => c.sessionId)).toEqual(['b']);
  });
});

describe('consent', () => {
  const now = Date.parse('2026-11-27T12:00:00Z');
  it('counts whole days left, never below zero', () => {
    expect(daysLeft('2027-02-25T00:00:00Z', now)).toBe(89);
    expect(daysLeft('2026-11-01T00:00:00Z', now)).toBe(0);
  });
  it('flags soon below 15 days and expired at zero', () => {
    expect(consentTone(89)).toBe('ok');
    expect(consentTone(14)).toBe('soon');
    expect(consentTone(0)).toBe('expired');
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-11-27T12:00:00Z');
  it('formats short relative times', () => {
    expect(timeAgo(undefined, now)).toBe('never');
    expect(timeAgo(now - 20_000, now)).toBe('just now');
    expect(timeAgo(now - 2 * 60_000, now)).toBe('2 min ago');
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe('3 h ago');
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe('2 d ago');
  });
});

describe('resetAccountSync', () => {
  it('clears the sync dates of one account only', () => {
    const c = conn('a');
    c.accounts[1] = { ...c.accounts[1], lastSyncedOn: '2026-11-21', lastSyncedAt: 5 };
    const next = resetAccountSync([c], 'a', 'u1');
    expect(next[0].accounts[0].lastSyncedOn).toBeUndefined();
    expect(next[0].accounts[1].lastSyncedOn).toBe('2026-11-21');
  });
});

describe('renewConnection', () => {
  const existing = (): Connection => ({
    sessionId: 'old',
    aspsp: { name: 'Bank', country: 'FR' },
    validUntil: '2026-12-01T00:00:00Z',
    color: '#234e78',
    accounts: [
      {
        uid: 'o1',
        name: 'Courant',
        currency: 'EUR',
        iban: 'FR76A',
        accountId: 'wf-1',
        syncEnabled: false,
        lastSyncedOn: '2026-11-26',
        lastSyncedAt: 9,
      },
      { uid: 'o2', name: 'Livret', currency: 'EUR', iban: 'FR76B', accountId: 'wf-2' },
    ],
  });
  const fresh = (): Connection => ({
    sessionId: 'new',
    aspsp: { name: 'Bank', country: 'FR' },
    validUntil: '2027-03-01T00:00:00Z',
    accounts: [
      { uid: 'n2', name: 'Livret', currency: 'EUR', iban: 'FR76B' },
      { uid: 'n1', name: 'Courant', currency: 'EUR', iban: 'FR76A' },
    ],
  });

  it('appends a bank that is not connected yet', () => {
    const other = { ...fresh(), aspsp: { name: 'Other', country: 'DE' } };
    expect(renewConnection([existing()], other)).toHaveLength(2);
  });

  it('replaces the session of the same bank and carries over links, settings and color by IBAN', () => {
    const [merged, ...rest] = renewConnection([existing()], fresh());
    expect(rest).toEqual([]);
    expect(merged).toMatchObject({ sessionId: 'new', validUntil: '2027-03-01T00:00:00Z', color: '#234e78' });
    const courant = merged.accounts.find((a) => a.uid === 'n1')!;
    expect(courant).toMatchObject({
      accountId: 'wf-1',
      syncEnabled: false,
      lastSyncedOn: '2026-11-26',
      lastSyncedAt: 9,
    });
    expect(merged.accounts.find((a) => a.uid === 'n2')!.accountId).toBe('wf-2');
  });

  it('falls back to the account name when the bank gives no IBAN', () => {
    const e = existing();
    e.accounts.forEach((a) => delete a.iban);
    const f = fresh();
    f.accounts.forEach((a) => delete a.iban);
    expect(renewConnection([e], f)[0].accounts.find((a) => a.uid === 'n1')!.accountId).toBe('wf-1');
  });
});

describe('syncLabel', () => {
  const now = Date.parse('2026-11-27T12:00:00Z');
  it('uses the most recent timestamp when there is one', () => {
    expect(syncLabel([{ lastSyncedAt: now - 3 * 60_000 }, { lastSyncedAt: now - 3_600_000 }], now)).toBe('3 min ago');
  });
  it('falls back to the sync date for data saved by older versions', () => {
    expect(syncLabel([{ lastSyncedOn: '2026-11-20' }, { lastSyncedOn: '2026-11-27' }], now)).toBe('on 2026-11-27');
  });
  it('says never when nothing was synced', () => {
    expect(syncLabel([{}, {}], now)).toBe('never');
  });
});
