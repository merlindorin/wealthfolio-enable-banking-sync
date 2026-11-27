import { useState } from 'react';
import { filterAspsps } from '../lib/aspsps';
import type { Aspsp } from '../lib/client';
import { bankInitials } from '../lib/bank';
import type { BankSync } from '../hooks/useBankSync';
import { Note } from '../components/ui';

const COUNTRIES = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IS',
  'IE',
  'IT',
  'LV',
  'LI',
  'LT',
  'LU',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'GB',
];

export function AddBankView({ app }: { app: BankSync }) {
  const [country, setCountry] = useState('FR');
  const [query, setQuery] = useState('');
  const [banks, setBanks] = useState<Aspsp[]>([]);
  const [loading, setLoading] = useState(false);
  const unlinked = app.connections.filter((c) => c.accounts.some((a) => !a.accountId));

  const load = async () => {
    setLoading(true);
    setBanks(await app.listBanks(country));
    setLoading(false);
  };

  return (
    <>
      <div className="ebs-row ebs-between">
        <div className="ebs-col" style={{ gap: 4 }}>
          <h1>Connect a bank</h1>
          <span className="ebs-muted">
            Any bank Enable Banking supports, across 30 countries. Repeat for each bank you use.
          </span>
        </div>
        <button className="ebs-btn" onClick={() => app.setView('overview')}>
          Back to overview
        </button>
      </div>

      {!app.configured && (
        <Note tone="warn">
          <span>
            Enable Banking credentials are missing.{' '}
            <button className="ebs-btn" onClick={() => app.setView('settings')}>
              Open settings
            </button>
          </span>
        </Note>
      )}

      <div className="ebs-card" style={{ maxWidth: 820 }}>
        <strong style={{ fontSize: 15 }}>Choose a bank</strong>
        <div className="ebs-row">
          <select
            className="ebs-input"
            style={{ width: 110 }}
            aria-label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            className="ebs-input"
            style={{ flex: '1 1 200px', width: 'auto' }}
            placeholder="Search a bank…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="ebs-btn ebs-btn-primary" disabled={!app.configured || loading} onClick={load}>
            {loading ? 'Loading…' : 'List banks'}
          </button>
        </div>
        <div className="ebs-row" style={{ maxHeight: 260, overflow: 'auto' }}>
          {filterAspsps(banks, query).map((b) => (
            <button key={b.name} className="ebs-chip" style={{ cursor: 'pointer' }} onClick={() => app.connect(b)}>
              <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                <circle cx="14" cy="14" r="14" fill="#234e78" />
                <text x="14" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fffcf0">
                  {bankInitials(b.name)}
                </text>
              </svg>
              <span className="ebs-col" style={{ gap: 1, alignItems: 'flex-start' }}>
                <strong>{b.name}</strong>
                <span className="ebs-muted" style={{ fontSize: 11 }}>
                  {b.maximum_consent_validity
                    ? `consent up to ${Math.round(b.maximum_consent_validity / 86_400)} days`
                    : 'consent 90 days'}
                </span>
              </span>
            </button>
          ))}
        </div>
        {app.authUrl && (
          <Note tone="info">
            <span>
              Authorise access at your bank, then you come back here.{' '}
              <a href={app.authUrl} target="_blank" rel="noreferrer">
                Continue at your bank →
              </a>
            </span>
          </Note>
        )}
        <span className="ebs-muted ebs-small">
          Consent length follows each bank's own limit, never more than 90 days.
        </span>
      </div>

      {unlinked.length > 0 && (
        <div className="ebs-card ebs-card-strong" style={{ maxWidth: 820 }}>
          <strong style={{ fontSize: 15 }}>Link your accounts</strong>
          <span className="ebs-muted ebs-small">
            Pick the Wealthfolio account each bank account feeds. New accounts are created as cash accounts, which is
            what Spending reads.
          </span>
          {unlinked.flatMap((c) =>
            c.accounts.map((a) => (
              <div key={a.uid} className="ebs-card" style={{ background: '#fffcf0', padding: 16, gap: 12 }}>
                <div className="ebs-row ebs-between">
                  <div className="ebs-col" style={{ gap: 2, minWidth: 0 }}>
                    <strong>{a.name}</strong>
                    <span className="ebs-muted ebs-small">
                      {c.aspsp.name} · {a.currency}
                    </span>
                  </div>
                  <select
                    className="ebs-input"
                    style={{ width: 260 }}
                    aria-label="Wealthfolio account"
                    value={a.accountId ?? ''}
                    onChange={(e) =>
                      e.target.value && app.saveAccount(c.sessionId, a.uid, { accountId: e.target.value })
                    }
                  >
                    <option value="">Link to account…</option>
                    <option value="new">+ Create cash account</option>
                    {app.accounts
                      .filter((w) => w.isActive && !w.isArchived)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                  </select>
                </div>
                {app.warningFor(a.accountId) && <Note tone="warn">{app.warningFor(a.accountId)}</Note>}
              </div>
            )),
          )}
        </div>
      )}

      {app.connections.length > 0 && unlinked.length === 0 && (
        <div className="ebs-row">
          <button className="ebs-btn ebs-btn-primary" onClick={() => app.setView('overview')}>
            Done, go to overview
          </button>
        </div>
      )}
    </>
  );
}
