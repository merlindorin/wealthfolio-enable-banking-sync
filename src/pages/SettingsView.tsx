import { useState } from 'react';
import type { BankSync } from '../hooks/useBankSync';
import { Switch } from '../components/ui';

export function SettingsView({ app }: { app: BankSync }) {
  const [appId, setAppId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [redirect, setRedirect] = useState(app.redirectUrl);
  const { settings } = app;

  return (
    <>
      <div className="ebs-row ebs-between">
        <div className="ebs-col" style={{ gap: 4 }}>
          <h1>Settings</h1>
          <span className="ebs-muted">Enable Banking credentials and sync behaviour.</span>
        </div>
        <button className="ebs-btn" onClick={() => app.setView('overview')}>
          Back to overview
        </button>
      </div>

      <div className="ebs-card" style={{ maxWidth: 760 }}>
        <strong style={{ fontSize: 15 }}>Enable Banking credentials {app.configured && '✓'}</strong>
        <input
          className="ebs-input"
          placeholder="Application ID"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
        />
        <textarea
          className="ebs-textarea"
          placeholder="Private key (PKCS#8 PEM, 'BEGIN PRIVATE KEY')"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
        <input
          className="ebs-input"
          placeholder="Redirect URL registered at Enable Banking, e.g. https://wealthfolio.example.com/addons/enable-banking-sync"
          value={redirect}
          onChange={(e) => setRedirect(e.target.value)}
        />
        <button
          className="ebs-btn ebs-btn-primary"
          style={{ alignSelf: 'flex-start' }}
          disabled={!appId || !privateKey || !redirect}
          onClick={async () => {
            await app.saveCredentials(appId, privateKey, redirect);
            setPrivateKey('');
          }}
        >
          Save credentials
        </button>
        <span className="ebs-muted ebs-small">
          The key is kept in Wealthfolio's secrets vault and never shown again.
        </span>
      </div>

      <div className="ebs-card" style={{ maxWidth: 760 }}>
        <strong style={{ fontSize: 15 }}>Sync</strong>
        <label className="ebs-row" style={{ gap: 12 }}>
          <Switch on={settings.autoSync} label="Auto sync" onChange={(v) => app.updateSettings({ autoSync: v })} />
          Auto sync while Wealthfolio is open, every
          <input
            className="ebs-input"
            style={{ width: 80 }}
            type="number"
            min={1}
            value={settings.intervalHours}
            onChange={(e) => app.updateSettings({ intervalHours: Math.max(1, Number(e.target.value) || 1) })}
          />
          hours
        </label>
        <label className="ebs-row" style={{ gap: 12 }}>
          First sync history (days)
          <input
            className="ebs-input"
            style={{ width: 120 }}
            type="number"
            min={1}
            placeholder="bank default"
            value={settings.historyDays ?? ''}
            onChange={(e) =>
              app.updateSettings({ historyDays: e.target.value ? Math.max(1, Number(e.target.value)) : null })
            }
          />
        </label>
        <label className="ebs-row" style={{ gap: 12 }}>
          <Switch
            on={settings.longestHistory}
            label="Longest history"
            onChange={(v) => app.updateSettings({ longestHistory: v })}
          />
          Fetch the longest history the bank allows on the first sync
        </label>
        <span className="ebs-muted ebs-small">
          History options apply to accounts that were never synced, or after "Re-import history". An account's own
          "Import from" date takes precedence.
        </span>
      </div>
    </>
  );
}
