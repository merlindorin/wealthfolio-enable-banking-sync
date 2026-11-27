const CONNECTIONS_KEY = 'eb-connections';

export interface LinkedAccount {
  uid: string;
  name: string;
  currency: string;
  iban?: string;
  accountId?: string;
  lastSyncedOn?: string;
  lastSyncedAt?: number;
  syncEnabled?: boolean;
}

export interface Connection {
  sessionId: string;
  aspsp: { name: string; country: string };
  validUntil: string;
  color?: string;
  accounts: LinkedAccount[];
}

interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export async function loadConnections(store: KeyValueStore): Promise<Connection[]> {
  const raw = await store.get(CONNECTIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Connection[];
  } catch {
    return [];
  }
}

export function saveConnections(store: KeyValueStore, connections: Connection[]) {
  return store.set(CONNECTIONS_KEY, JSON.stringify(connections));
}

export function linkAccount(connection: Connection, uid: string, accountId: string): Connection {
  return {
    ...connection,
    accounts: connection.accounts.map((a) => (a.uid === uid ? { ...a, accountId } : a)),
  };
}
