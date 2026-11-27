import { describe, expect, it } from 'vitest';
import { summarizeRun } from './run-summary';

const totals = { imported: 3, duplicates: 40, limited: false, errors: [] as string[] };

describe('summarizeRun', () => {
  it('describes a clean manual sync', () => {
    expect(summarizeRun('manual', totals)).toEqual({
      ok: true,
      title: 'Manual sync',
      detail: '3 new, 40 already known',
    });
  });

  it('says so in the title when it failed, and lists the errors', () => {
    expect(summarizeRun('manual', { ...totals, errors: ['a', 'b'] })).toEqual({
      ok: false,
      title: 'Manual sync failed',
      detail: 'a; b',
    });
    expect(summarizeRun('manual', { ...totals, errors: ['x'] })).toMatchObject({
      ok: false,
      title: 'Manual sync failed',
    });
  });

  it('tells when the bank limited how far back it went', () => {
    expect(summarizeRun('manual', { ...totals, limited: true }).detail).toBe(
      '3 new, 40 already known. The bank limits how far back it goes, so the oldest entries were not fetched.',
    );
  });
});
