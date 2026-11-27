const SETTINGS_KEY = 'eb-settings';

export interface Settings {
  autoSync: boolean;
  intervalHours: number;
  historyDays: number | null;
  longestHistory: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  autoSync: false,
  intervalHours: 6,
  historyDays: null,
  longestHistory: false,
};

interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export async function loadSettings(store: KeyValueStore): Promise<Settings> {
  const raw = await store.get(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(store: KeyValueStore, settings: Settings) {
  return store.set(SETTINGS_KEY, JSON.stringify(settings));
}

export function isSyncDue(lastRunAt: number | undefined, now: number, intervalHours: number) {
  return lastRunAt === undefined || now - lastRunAt >= intervalHours * 3_600_000;
}
