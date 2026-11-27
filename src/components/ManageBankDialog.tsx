import { useState } from 'react';
import { BANK_COLORS, bankInitials, consentTone, daysLeft, syncLabel } from '../lib/bank';
import type { BankSync } from '../hooks/useBankSync';
import { Modal } from './ui';

export function ManageBankDialog({ app, sessionId }: { app: BankSync; sessionId: string }) {
  const connection = app.connections.find((c) => c.sessionId === sessionId);
  const [confirming, setConfirming] = useState(false);
  if (!connection) return null;

  const close = () => app.setDialog(null);
  const days = daysLeft(connection.validUntil, app.now);
  const tone = consentTone(days);
  const color = connection.color ?? BANK_COLORS[0];
  const imported = connection.accounts.reduce((n, a) => n + (app.stats[a.uid]?.imported ?? 0), 0);

  return (
    <Modal label="Manage bank" onClose={close}>
      <div className="ebs-row ebs-between" style={{ flexWrap: 'nowrap' }}>
        <div className="ebs-row" style={{ flexWrap: 'nowrap', gap: 12 }}>
          <svg width="40" height="40" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="14" fill={color} />
            <text x="14" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fffcf0">
              {bankInitials(connection.aspsp.name)}
            </text>
          </svg>
          <div className="ebs-col" style={{ gap: 2 }}>
            <strong style={{ fontSize: 17 }}>{connection.aspsp.name}</strong>
            <span className="ebs-muted ebs-small">
              Bank connection · applies to all {connection.accounts.length} account
              {connection.accounts.length > 1 ? 's' : ''} below
            </span>
          </div>
        </div>
        <button className="ebs-btn" aria-label="Close" onClick={close}>
          ×
        </button>
      </div>

      <div className="ebs-card" style={{ padding: 16, gap: 10 }}>
        <div className="ebs-row ebs-between ebs-small">
          <span className="ebs-muted">Status</span>
          <strong style={{ color: tone === 'ok' ? 'var(--ok)' : tone === 'soon' ? 'var(--warn)' : 'var(--bad)' }}>
            {tone === 'ok' ? 'Active' : tone === 'soon' ? 'Ending soon' : 'Expired'}
          </strong>
        </div>
        <div className="ebs-row ebs-between ebs-small">
          <span className="ebs-muted">Consent ends</span>
          <span>{connection.validUntil.slice(0, 10)}</span>
        </div>
        <div className="ebs-row ebs-between ebs-small">
          <span className="ebs-muted">Days left</span>
          <span>{days}</span>
        </div>
        <div className="ebs-row ebs-between ebs-small">
          <span className="ebs-muted">Last sync</span>
          <span>{syncLabel(connection.accounts, app.now)}</span>
        </div>
        <button
          className="ebs-btn ebs-btn-primary"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => app.connect(connection.aspsp)}
        >
          Renew consent
        </button>
        {app.authUrl && (
          <a href={app.authUrl} target="_blank" rel="noreferrer" className="ebs-small">
            Continue at your bank →
          </a>
        )}
      </div>

      <div className="ebs-col" style={{ gap: 10 }}>
        <span className="ebs-label">Bank color</span>
        <div className="ebs-row" style={{ gap: 12, padding: 4 }}>
          {BANK_COLORS.map((c) => (
            <button
              key={c}
              className="ebs-swatch"
              aria-label={`Color ${c}`}
              aria-pressed={c === color}
              style={{ background: c }}
              onClick={() => app.setColor(sessionId, c)}
            />
          ))}
        </div>
      </div>

      <div className="ebs-col" style={{ gap: 10 }}>
        <span className="ebs-label">Accounts at this bank</span>
        {connection.accounts.map((a) => (
          <div
            key={a.uid}
            className="ebs-row ebs-between"
            style={{
              border: '1px solid var(--line2)',
              background: 'var(--card)',
              borderRadius: 12,
              padding: '12px 14px',
            }}
          >
            <div className="ebs-col" style={{ gap: 2, minWidth: 0 }}>
              <strong className="ebs-small">{a.name}</strong>
              <span className="ebs-muted" style={{ fontSize: 11 }}>
                {a.accountId ? `feeds ${app.wfAccountName(a.accountId) ?? 'a Wealthfolio account'}` : 'not linked'}
              </span>
            </div>
            <button className="ebs-btn" onClick={() => app.setDialog({ kind: 'account', sessionId, uid: a.uid })}>
              Edit account
            </button>
          </div>
        ))}
      </div>

      <div className="ebs-note ebs-bad" style={{ flexDirection: 'column' }}>
        <strong>Remove this bank</strong>
        <span>
          Stops syncing {connection.accounts.length === 1 ? 'its account' : 'all its accounts'} and forgets the
          connection. The {imported} imported transactions stay in Wealthfolio. You can reconnect the bank later.
        </span>
        {confirming ? (
          <div className="ebs-row">
            <button className="ebs-btn ebs-btn-danger" onClick={() => app.removeBank(sessionId)}>
              Yes, remove {connection.aspsp.name}
            </button>
            <button className="ebs-btn" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <button
            className="ebs-btn ebs-btn-danger"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setConfirming(true)}
          >
            Remove {connection.aspsp.name}…
          </button>
        )}
      </div>

      <div
        className="ebs-row"
        style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: 18 }}
      >
        <button className="ebs-btn" onClick={close}>
          Close
        </button>
      </div>
    </Modal>
  );
}
