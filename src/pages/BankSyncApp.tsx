import type { AddonContext } from '@wealthfolio/addon-sdk';
import { EditAccountDialog } from '../components/EditAccountDialog';
import { ManageBankDialog } from '../components/ManageBankDialog';
import { useBankSync } from '../hooks/useBankSync';
import { STYLES } from '../styles';
import { AddBankView } from './AddBankView';
import { EntriesView } from './EntriesView';
import { OverviewView } from './OverviewView';
import { SettingsView } from './SettingsView';

export function BankSyncApp({ ctx, search }: { ctx: AddonContext; search: string }) {
  const app = useBankSync(ctx, search);
  const { dialog } = app;

  return (
    <div className="ebs">
      <style>{STYLES}</style>
      {app.view === 'overview' && <OverviewView app={app} />}
      {app.view === 'add' && <AddBankView app={app} />}
      {app.view === 'entries' && <EntriesView app={app} />}
      {app.view === 'settings' && <SettingsView app={app} />}
      {dialog?.kind === 'account' && (
        <EditAccountDialog
          key={`${dialog.sessionId}:${dialog.uid}`}
          app={app}
          sessionId={dialog.sessionId}
          uid={dialog.uid}
        />
      )}
      {dialog?.kind === 'bank' && <ManageBankDialog key={dialog.sessionId} app={app} sessionId={dialog.sessionId} />}
    </div>
  );
}
