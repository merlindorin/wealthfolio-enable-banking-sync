import type { AddonContext } from '@wealthfolio/addon-sdk';
import { EnableBankingClient } from './client';
import { signJwt } from './jwt';
import { loadSettings } from './settings';
import type { SyncDeps } from './sync';
import { ensureToken } from './token';

type Api = AddonContext['api'];

export async function createClient(api: Api) {
  const secretKey = await ensureToken({
    secrets: api.secrets,
    storage: api.storage,
    sign: signJwt,
    now: () => Math.floor(Date.now() / 1000),
  });
  return new EnableBankingClient(api.network, secretKey);
}

export async function createSyncDeps(api: Api): Promise<SyncDeps> {
  const [client, settings] = await Promise.all([createClient(api), loadSettings(api.storage)]);
  return {
    getTransactions: (uid, options) => client.getTransactions(uid, options),
    checkImport: (rows) => api.activities.checkImport(rows),
    importActivities: (rows) => api.activities.import(rows),
    today: () => new Date().toISOString().slice(0, 10),
    rewrites: settings.rewrites,
  };
}
