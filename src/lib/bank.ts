import type { Connection, LinkedAccount } from './state';

export const BANK_COLORS = ['#35500a', '#234e78', '#7a4a00', '#8a1c14', '#5a3a7a', '#151515'];

const DAY_MS = 86_400_000;
const FILLER_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'of', 'the', 'and', 'et']);
const SOON_DAYS = 15;

export function bankInitials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w && !FILLER_WORDS.has(w.toLowerCase()));
  const initials = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? name).slice(0, 2);
  return initials.toUpperCase();
}

export const defaultBankColor = (index: number) => BANK_COLORS[index % BANK_COLORS.length];

export function setBankColor(connections: Connection[], sessionId: string, color: string): Connection[] {
  return connections.map((c) => (c.sessionId === sessionId ? { ...c, color } : c));
}

export function updateAccount(
  connections: Connection[],
  sessionId: string,
  uid: string,
  patch: Partial<Pick<LinkedAccount, 'accountId' | 'syncEnabled'>>,
): Connection[] {
  return connections.map((c) =>
    c.sessionId === sessionId ? { ...c, accounts: c.accounts.map((a) => (a.uid === uid ? { ...a, ...patch } : a)) } : c,
  );
}

export const removeConnection = (connections: Connection[], sessionId: string) =>
  connections.filter((c) => c.sessionId !== sessionId);

export const daysLeft = (validUntil: string, now: number) =>
  Math.max(0, Math.floor((Date.parse(validUntil) - now) / DAY_MS));

export function consentTone(days: number): 'ok' | 'soon' | 'expired' {
  if (days <= 0) return 'expired';
  return days < SOON_DAYS ? 'soon' : 'ok';
}

export function timeAgo(timestamp: number | undefined, now: number): string {
  if (timestamp === undefined) return 'never';
  const seconds = (now - timestamp) / 1000;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86_400)} d ago`;
}

const CARRIED = ['accountId', 'syncEnabled', 'lastSyncedOn', 'lastSyncedAt'] as const;

export function renewConnection(connections: Connection[], fresh: Connection): Connection[] {
  const index = connections.findIndex(
    (c) => c.aspsp.name === fresh.aspsp.name && c.aspsp.country === fresh.aspsp.country,
  );
  if (index < 0) return [...connections, fresh];

  const old = connections[index];
  const findOld = (a: LinkedAccount) =>
    old.accounts.find((o) => (a.iban && o.iban ? a.iban === o.iban : o.name === a.name));
  const merged: Connection = {
    ...fresh,
    color: old.color ?? fresh.color,
    accounts: fresh.accounts.map((a) => {
      const previous = findOld(a);
      if (!previous) return a;
      const carried: Partial<LinkedAccount> = {};
      CARRIED.forEach((key) => {
        if (previous[key] !== undefined) Object.assign(carried, { [key]: previous[key] });
      });
      return { ...a, ...carried };
    }),
  };
  return connections.map((c, i) => (i === index ? merged : c));
}

export function syncLabel(accounts: Array<Pick<LinkedAccount, 'lastSyncedAt' | 'lastSyncedOn'>>, now: number): string {
  const at = Math.max(0, ...accounts.map((a) => a.lastSyncedAt ?? 0));
  if (at) return timeAgo(at, now);
  const on = accounts
    .map((a) => a.lastSyncedOn)
    .filter(Boolean)
    .sort()
    .pop();
  return on ? `on ${on}` : 'never';
}
