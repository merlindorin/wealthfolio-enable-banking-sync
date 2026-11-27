import { describe, expect, it } from 'vitest';
import { appendLog, loadLog, minutesUntilNextSync, type LogEntry } from './log';

const memory = () => {
  const m = new Map<string, string>();
  return { get: async (k: string) => m.get(k) ?? null, set: async (k: string, v: string) => void m.set(k, v) };
};

const entry = (n: number): LogEntry => ({ at: n, kind: 'auto', ok: true, title: `run ${n}`, detail: 'd' });

describe('sync log', () => {
  it('defaults to empty and survives corrupt data', async () => {
    const s = memory();
    expect(await loadLog(s)).toEqual([]);
    await s.set('eb-sync-log', '{oops');
    expect(await loadLog(s)).toEqual([]);
  });

  it('keeps the newest entries first and caps the length', async () => {
    const s = memory();
    for (let i = 1; i <= 25; i++) await appendLog(s, entry(i));
    const log = await loadLog(s);
    expect(log).toHaveLength(20);
    expect(log[0].at).toBe(25);
    expect(log[19].at).toBe(6);
  });
});

describe('minutesUntilNextSync', () => {
  const now = Date.parse('2026-11-27T12:00:00Z');
  it('counts the minutes left in the interval', () => {
    expect(minutesUntilNextSync(now - 26 * 60_000, now, 1)).toBe(34);
  });
  it('is zero when due or never run', () => {
    expect(minutesUntilNextSync(now - 2 * 3_600_000, now, 1)).toBe(0);
    expect(minutesUntilNextSync(undefined, now, 1)).toBe(0);
  });
});
