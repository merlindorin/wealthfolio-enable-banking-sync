import { useState } from 'react';
import type { BankSync } from '../hooks/useBankSync';
import { Modal, Note, Switch } from './ui';

export function EditAccountDialog({ app, sessionId, uid }: { app: BankSync; sessionId: string; uid: string }) {
  const connection = app.connections.find((c) => c.sessionId === sessionId);
  const account = connection?.accounts.find((a) => a.uid === uid);
  const [target, setTarget] = useState(account?.accountId ?? '');
  const [syncEnabled, setSyncEnabled] = useState(account?.syncEnabled !== false);
  if (!connection || !account) return null;

  const close = () => app.setDialog(null);
  const warning = app.warningFor(account.accountId);
  const others = connection.accounts.length - 1;

  const save = async () => {
    await app.saveAccount(sessionId, uid, { accountId: target || undefined, syncEnabled });
    close();
  };

  return (
    <Modal label="Edit account" onClose={close}>
      <div className="ebs-row ebs-between">
        <div className="ebs-col">
          <strong style={{ fontSize: 17 }}>Edit account {account.name}</strong>
          <span className="ebs-muted ebs-small">
            {account.currency} · these settings apply to this account only, from the next sync
          </span>
        </div>
      </div>

      <label className="ebs-col">
        <span className="ebs-label">Feeds this Wealthfolio account</span>
        <select className="ebs-input" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Not linked</option>
          {app.accounts
            .filter((a) => a.isActive && !a.isArchived)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          <option value="new">Create a new cash account…</option>
        </select>
      </label>

      {account.accountId && warning && <Note tone="warn">{warning}</Note>}
      {account.accountId && !warning && app.spending && (
        <Note tone="ok">Spending tracking is on for this account.</Note>
      )}

      <label className="ebs-row" style={{ gap: 12 }}>
        <Switch on={syncEnabled} label="Sync this account" onChange={setSyncEnabled} />
        Sync this account
      </label>
      <span className="ebs-small ebs-muted">
        The first sync, and Re-import history, fetch as far back as the bank allows. Changing the linked account only
        affects future imports: transactions already imported stay where they are.
      </span>

      <div className="ebs-row ebs-between" style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
        <div className="ebs-col">
          <span className="ebs-label">Bank</span>
          <span className="ebs-small">
            {connection.aspsp.name}
            {others > 0 ? ` · shared with ${others} other account${others > 1 ? 's' : ''}` : ''}
          </span>
        </div>
        <button className="ebs-btn ebs-btn-outline" onClick={() => app.setDialog({ kind: 'bank', sessionId })}>
          Manage {connection.aspsp.name}…
        </button>
      </div>

      <div
        className="ebs-row"
        style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: 18 }}
      >
        <button className="ebs-btn" onClick={close}>
          Cancel
        </button>
        <button className="ebs-btn ebs-btn-primary" onClick={save}>
          Save changes
        </button>
      </div>
    </Modal>
  );
}
