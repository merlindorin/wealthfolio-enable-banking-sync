import type { LogEntry } from './log';

export interface RunTotals {
  imported: number;
  duplicates: number;
  limited: boolean;
  errors: string[];
}

export function summarizeRun(kind: LogEntry['kind'], totals: RunTotals): Pick<LogEntry, 'ok' | 'title' | 'detail'> {
  const ok = totals.errors.length === 0;
  const title =
    kind === 'history'
      ? ok
        ? 'History re-imported'
        : 'History re-import failed'
      : ok
        ? 'Manual sync'
        : 'Manual sync failed';

  if (!ok) return { ok, title, detail: totals.errors.join('; ') };

  const counts = `${totals.imported} new, ${totals.duplicates} already known`;
  const limit = totals.limited ? '. The bank limits how far back it goes, so the oldest entries were not fetched.' : '';
  return { ok, title, detail: `${counts}${limit}` };
}
