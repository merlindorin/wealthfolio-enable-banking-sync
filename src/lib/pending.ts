const KEY_PREFIX = 'eb-pending:';

export interface PendingAspsp {
  name: string;
  country: string;
}

interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export function savePending(store: Store, state: string, aspsp: PendingAspsp) {
  return store.set(KEY_PREFIX + state, JSON.stringify(aspsp));
}

export async function consumePending(store: Store, state: string): Promise<PendingAspsp | null> {
  const key = KEY_PREFIX + state;
  const raw = await store.get(key);
  if (!raw) return null;
  await store.delete(key);
  try {
    return JSON.parse(raw) as PendingAspsp;
  } catch {
    return null;
  }
}
