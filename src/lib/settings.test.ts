import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, isSyncDue, loadSettings, saveSettings } from './settings';

const memory = () => {
  const m = new Map<string, string>();
  return { get: async (k: string) => m.get(k) ?? null, set: async (k: string, v: string) => void m.set(k, v) };
};

describe('settings', () => {
  it('defaults to manual sync with no history override', async () => {
    expect(await loadSettings(memory())).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toMatchObject({ autoSync: false, longestHistory: false });
  });

  it('round-trips and merges stored values over defaults', async () => {
    const s = memory();
    await saveSettings(s, { ...DEFAULT_SETTINGS, autoSync: true, intervalHours: 12 });
    expect(await loadSettings(s)).toMatchObject({ autoSync: true, intervalHours: 12 });
  });

  it('falls back to defaults on corrupt data', async () => {
    const s = memory();
    await s.set('eb-settings', 'nope');
    expect(await loadSettings(s)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('isSyncDue', () => {
  const now = Date.parse('2026-11-27T12:00:00Z');
  it('is due when never run', () => expect(isSyncDue(undefined, now, 6)).toBe(true));
  it('is due once the interval elapsed', () => expect(isSyncDue(now - 6 * 3_600_000, now, 6)).toBe(true));
  it('is not due before the interval', () => expect(isSyncDue(now - 5 * 3_600_000, now, 6)).toBe(false));
});
