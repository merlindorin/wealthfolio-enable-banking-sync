import { useState } from 'react';
import type { BankSync } from '../hooks/useBankSync';
import { Note } from '../components/ui';
import { applicationIdFromFileName, normalizePrivateKey } from '../lib/pem';
import { RewriteRulesCard } from '../components/RewriteRulesCard';

export function SettingsView({ app }: { app: BankSync }) {
  const [appId, setAppId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [redirect, setRedirect] = useState(app.redirectUrl);

  const key = privateKey.trim() ? normalizePrivateKey(privateKey) : null;
  const keyError = key && 'error' in key ? key.error : null;
  const validKey = key && 'pem' in key ? key : null;

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setPrivateKey(await file.text());
    const id = applicationIdFromFileName(file.name);
    if (id && !appId) setAppId(id);
  };

  return (
    <>
      <div className="ebs-row ebs-between">
        <div className="ebs-col" style={{ gap: 4 }}>
          <h1>Settings</h1>
          <span className="ebs-muted">Your Enable Banking credentials and how descriptions are rewritten.</span>
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

        <div className="ebs-col" style={{ gap: 8 }}>
          <div className="ebs-row ebs-between">
            <span className="ebs-label">Private key</span>
            <label className="ebs-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              Choose a .pem file…
              <input
                type="file"
                accept=".pem,.key,.txt,text/plain"
                style={{ display: 'none' }}
                onChange={(e) => {
                  void readFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          <textarea
            className="ebs-textarea"
            placeholder="Choose the .pem file Enable Banking gave you, or paste its content here"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            spellCheck={false}
          />
          {keyError && <Note tone="bad">{keyError}</Note>}
          {validKey && (
            <Note tone="ok">
              {validKey.converted ? 'Key is valid, converted from the RSA format.' : 'Key is valid.'}
            </Note>
          )}
        </div>

        <input
          className="ebs-input"
          placeholder="Redirect URL registered at Enable Banking, e.g. https://wealthfolio.example.com/addons/enable-banking-sync"
          value={redirect}
          onChange={(e) => setRedirect(e.target.value)}
        />
        <button
          className="ebs-btn ebs-btn-primary"
          style={{ alignSelf: 'flex-start' }}
          disabled={!appId || !validKey || !redirect}
          onClick={async () => {
            if (!validKey) return;
            await app.saveCredentials(appId, validKey.pem, redirect);
            setPrivateKey('');
          }}
        >
          Save credentials
        </button>
        <span className="ebs-muted ebs-small">
          The key is kept in Wealthfolio's secrets vault and never shown again. The file is read in your browser and
          only its content is stored.
        </span>
      </div>

      <RewriteRulesCard rules={app.settings.rewrites} onSave={(rewrites) => app.updateSettings({ rewrites })} />
    </>
  );
}
