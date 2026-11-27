import { useState } from 'react';
import type { BankSync } from '../hooks/useBankSync';

export function SettingsView({ app }: { app: BankSync }) {
  const [appId, setAppId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [redirect, setRedirect] = useState(app.redirectUrl);

  return (
    <>
      <div className="ebs-row ebs-between">
        <div className="ebs-col" style={{ gap: 4 }}>
          <h1>Settings</h1>
          <span className="ebs-muted">Your Enable Banking credentials.</span>
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
    </>
  );
}
