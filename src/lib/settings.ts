import { parseRewrites, type Rewrite } from './rewrite';

const SETTINGS_KEY = 'eb-settings';

export interface Settings {
  autoSync: boolean;
  intervalHours: number;
  rewrites: Rewrite[];
}

export const DEFAULT_SETTINGS: Settings = {
  autoSync: false,
  intervalHours: 6,
  rewrites: [],
};

interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export async function loadSettings(store: KeyValueStore): Promise<Settings> {
  const raw = await store.get(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const stored = JSON.parse(raw);
    return {
      autoSync: stored.autoSync ?? DEFAULT_SETTINGS.autoSync,
      intervalHours: stored.intervalHours ?? DEFAULT_SETTINGS.intervalHours,
      rewrites: parseRewrites(stored.rewrites),
    };
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
