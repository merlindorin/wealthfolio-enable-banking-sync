import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AddonContext, AddonEnableFunction } from '@wealthfolio/addon-sdk';
import { createSyncDeps } from './lib/api-deps';
import { autoSyncIfDue } from './lib/auto-sync';
import { BankSyncApp } from './pages/BankSyncApp';

const AUTO_SYNC_CHECK_MS = 15 * 60_000;

let addonCtx: AddonContext | undefined;

const AddonRoute = ({ location }: { location?: { search?: string } }) => (
  <QueryClientProvider client={addonCtx!.api.query.getClient() as QueryClient}>
    <BankSyncApp ctx={addonCtx!} search={location?.search ?? ''} />
  </QueryClientProvider>
);

const enable: AddonEnableFunction = (ctx) => {
  addonCtx = ctx;

  ctx.router.add({
    id: 'enable-banking-sync',
    path: '/addons/enable-banking-sync',
    component: AddonRoute,
  });

  const runAutoSync = () =>
    autoSyncIfDue({
      storage: ctx.api.storage,
      createSyncDeps: () => createSyncDeps(ctx.api),
      now: Date.now,
      log: (message) => ctx.api.logger.warn(message),
    }).catch((error) => ctx.api.logger.error(`Auto sync failed: ${error instanceof Error ? error.message : error}`));

  void runAutoSync();
  const timer = setInterval(runAutoSync, AUTO_SYNC_CHECK_MS);

  ctx.onDisable(() => {
    clearInterval(timer);
    addonCtx = undefined;
  });
};

export default enable;
