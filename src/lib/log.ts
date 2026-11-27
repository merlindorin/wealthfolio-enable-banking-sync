const LOG_KEY = 'eb-sync-log';
const MAX_ENTRIES = 20;

export interface LogEntry {
  at: number;
  kind: 'auto' | 'manual' | 'bank';
  ok: boolean;
  title: string;
  detail: string;
}

interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export async function loadLog(store: Store): Promise<LogEntry[]> {
  const raw = await store.get(LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
}

export async function appendLog(store: Store, entry: LogEntry) {
  const log = await loadLog(store);
  await store.set(LOG_KEY, JSON.stringify([entry, ...log].slice(0, MAX_ENTRIES)));
}

export function minutesUntilNextSync(lastRunAt: number | undefined, now: number, intervalHours: number): number {
  if (lastRunAt === undefined) return 0;
  return Math.max(0, Math.ceil((lastRunAt + intervalHours * 3_600_000 - now) / 60_000));
}
