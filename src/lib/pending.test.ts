import { describe, expect, it } from 'vitest';
import { consumePending, savePending } from './pending';

const memory = () => {
  const m = new Map<string, string>();
  return {
    get: async (k: string) => m.get(k) ?? null,
    set: async (k: string, v: string) => void m.set(k, v),
    delete: async (k: string) => void m.delete(k),
    keys: () => [...m.keys()],
  };
};

describe('pending authorisations', () => {
  it('keeps several banks pending at once, keyed by state', async () => {
    const s = memory();
    await savePending(s, 'st-1', { name: 'Bank A', country: 'FR' });
    await savePending(s, 'st-2', { name: 'Bank B', country: 'DE' });

    expect(await consumePending(s, 'st-1')).toEqual({ name: 'Bank A', country: 'FR' });
    expect(await consumePending(s, 'st-2')).toEqual({ name: 'Bank B', country: 'DE' });
  });

  it('returns null for an unknown state and removes a consumed one', async () => {
    const s = memory();
    await savePending(s, 'st-1', { name: 'Bank A', country: 'FR' });
    await consumePending(s, 'st-1');

    expect(await consumePending(s, 'st-1')).toBeNull();
    expect(await consumePending(s, 'nope')).toBeNull();
    expect(s.keys()).toEqual([]);
  });

  it('survives corrupt stored data', async () => {
    const s = memory();
    await s.set('eb-pending:bad', '{oops');
    expect(await consumePending(s, 'bad')).toBeNull();
  });
});
