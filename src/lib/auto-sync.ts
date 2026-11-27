import { appendLog } from './log';
import { isSyncDue, loadSettings } from './settings';
import { loadConnections, saveConnections } from './state';
import { syncConnection, type SyncDeps } from './sync';

const LAST_RUN_KEY = 'eb-last-auto-sync';

export interface AutoSyncDeps {
  storage: { get(k: string): Promise<string | null>; set(k: string, v: string): Promise<void> };
  createSyncDeps(): Promise<SyncDeps>;
  now(): number;
  log(message: string): void;
}

let running = false;

/** Returns true when a sync pass ran. */
export async function autoSyncIfDue({ storage, createSyncDeps, now, log }: AutoSyncDeps): Promise<boolean> {
  if (running) return false;
  running = true;
  try {
    const settings = await loadSettings(storage);
    const lastRaw = await storage.get(LAST_RUN_KEY);
    if (!settings.autoSync || !isSyncDue(lastRaw ? Number(lastRaw) : undefined, now(), settings.intervalHours))
      return false;

    const syncDeps = await createSyncDeps();
    const connections = await loadConnections(storage);
    const updated = [];
    const totals = { imported: 0, duplicates: 0, errors: 0 };

    for (const connection of connections) {
      try {
        const result = await syncConnection(connection, syncDeps, settings);
        result.reports.forEach((r) => {
          totals.imported += r.imported ?? 0;
          totals.duplicates += r.duplicates ?? 0;
          if (r.error) {
            totals.errors++;
            log(`Auto sync failed for ${connection.aspsp.name}: ${r.error}`);
          }
        });
        updated.push(result.updated);
      } catch (error) {
        totals.errors++;
        log(`Auto sync skipped ${connection.aspsp.name}: ${error instanceof Error ? error.message : error}`);
        updated.push(connection);
      }
    }

    await saveConnections(storage, updated);
    await storage.set(LAST_RUN_KEY, String(now()));
    await appendLog(storage, {
      at: now(),
      kind: 'auto',
      ok: totals.errors === 0,
      title: 'Auto sync',
      detail: totals.errors
        ? `${totals.errors} error(s), ${totals.imported} new`
        : `${totals.imported} new, ${totals.duplicates} already known`,
    });
    return true;
  } finally {
    running = false;
  }
}
