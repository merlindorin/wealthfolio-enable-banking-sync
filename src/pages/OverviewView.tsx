import { bankInitials, consentTone, daysLeft, defaultBankColor, syncLabel, timeAgo } from '../lib/bank';
import { minutesUntilNextSync } from '../lib/log';
import type { BankSync } from '../hooks/useBankSync';
import { Avatar, HistoryIcon, IconButton, PencilIcon, Switch, SyncIcon } from '../components/ui';

const INTERVALS = [1, 6, 24];
const CONSENT_SPAN_DAYS = 90;
const TONE_COLOR = { ok: '#5e8a1f', soon: '#c98a1b', expired: '#b3261e' };

export function OverviewView({ app }: { app: BankSync }) {
  const { connections, stats, settings, now } = app;
  const accountCount = connections.reduce((n, c) => n + c.accounts.length, 0);
  const linked = connections.flatMap((c) => c.accounts).filter((a) => a.accountId);
  const tracked = linked.filter((a) => !app.warningFor(a.accountId)).length;
  const synced = Object.values(stats).reduce((n, s) => n + s.imported, 0);
  const recent = Object.values(stats).reduce((n, s) => n + s.recent, 0);
  const soon = connections.filter((c) => consentTone(daysLeft(c.validUntil, now)) !== 'ok');
  const next = minutesUntilNextSync(app.lastAutoRun, now, settings.intervalHours);

  const kpis = [
    { label: 'Transactions synced', value: synced.toLocaleString('fr-FR'), hint: 'Imported by this addon' },
    { label: 'Last 30 days', value: String(recent), hint: 'Across all accounts' },
    {
      label: 'Spending tracked',
      value: `${tracked} of ${linked.length}`,
      hint: tracked < linked.length ? 'Some accounts are not tracked yet' : 'All linked accounts',
    },
    {
      label: 'Consents ending soon',
      value: String(soon.length),
      hint: soon.length
        ? soon.map((c) => `${c.aspsp.name} in ${daysLeft(c.validUntil, now)} d`).join(', ')
        : 'Nothing to renew',
    },
  ];

  const tag = (accountId?: string) => {
    if (!accountId) return { cls: 'ebs-warn', text: 'Not linked' };
    if (app.warningFor(accountId)) return { cls: 'ebs-warn', text: 'Not tracked by Spending' };
    return app.spending ? { cls: 'ebs-ok', text: 'Spending tracked' } : { cls: 'ebs-info', text: 'Linked' };
  };

  return (
    <>
      <div className="ebs-row ebs-between" style={{ gap: 16 }}>
        <div className="ebs-col" style={{ gap: 4 }}>
          <h1>Bank Sync</h1>
          <span className="ebs-muted">
            {connections.length} bank{connections.length === 1 ? '' : 's'} · {accountCount} account
            {accountCount === 1 ? '' : 's'} · read-only access via Enable Banking
          </span>
        </div>
        <div className="ebs-row">
          <span className="ebs-chip" style={{ minHeight: 0, padding: '8px 14px' }}>
            <svg width="10" height="10" aria-hidden="true">
              <circle cx="5" cy="5" r="5" fill={settings.autoSync ? '#4d6b14' : '#8d8a78'} />
            </svg>
            {settings.autoSync
              ? `Auto sync on · every ${settings.intervalHours} h${app.lastAutoRun ? ` · next in ${next} min` : ''}`
              : 'Auto sync off'}
          </span>
          <button className="ebs-btn" onClick={() => app.setView('entries')}>
            All entries
          </button>
          <button className="ebs-btn" onClick={() => app.setView('settings')}>
            Settings
          </button>
          <button
            className="ebs-btn ebs-btn-primary"
            disabled={app.busy !== null || !connections.length}
            onClick={() => app.sync({}, 'manual')}
          >
            {app.busy === 'all' ? 'Syncing…' : 'Sync all now'}
          </button>
        </div>
      </div>

      <div className="ebs-row" role="group" aria-label="Banks">
        {connections.map((c, i) => {
          const days = daysLeft(c.validUntil, now);
          const tone = consentTone(days);
          const status =
            tone === 'ok'
              ? `synced ${syncLabel(c.accounts, now)}`
              : tone === 'soon'
                ? `consent ends in ${days} d`
                : 'consent expired';
          return (
            <div key={c.sessionId} className={`ebs-chip ${tone === 'ok' ? '' : 'ebs-chip-warn'}`}>
              <Avatar
                initials={bankInitials(c.aspsp.name)}
                color={c.color ?? defaultBankColor(i)}
                label={`Edit ${c.aspsp.name}`}
                onClick={() => app.setDialog({ kind: 'bank', sessionId: c.sessionId })}
              />
              <span className="ebs-col" style={{ gap: 1, alignItems: 'flex-start' }}>
                <strong>{c.aspsp.name}</strong>
                <span style={{ fontSize: 11, opacity: 0.75 }}>
                  {c.aspsp.country} · {c.accounts.length} account{c.accounts.length === 1 ? '' : 's'} · {status}
                </span>
              </span>
            </div>
          );
        })}
        <button
          className="ebs-btn"
          style={{ borderStyle: 'dashed', borderColor: 'var(--ink)', borderRadius: 999, background: 'transparent' }}
          onClick={() => app.setView('add')}
        >
          + Add a bank
        </button>
      </div>

      <div className="ebs-kpis">
        {kpis.map((k) => (
          <div key={k.label} className="ebs-kpi">
            <span className="ebs-label">{k.label}</span>
            <strong>{k.value}</strong>
            <span className="ebs-muted ebs-small">{k.hint}</span>
          </div>
        ))}
      </div>

      <div className="ebs-grid">
        <div className="ebs-main">
          <div className="ebs-row ebs-between">
            <strong style={{ fontSize: 15 }}>Accounts</strong>
            <span className="ebs-muted ebs-small">each one feeds a Wealthfolio account</span>
          </div>
          {!connections.length && (
            <div className="ebs-card">
              <strong>No bank connected yet</strong>
              <span className="ebs-muted">Add your first bank to start importing transactions.</span>
              <button
                className="ebs-btn ebs-btn-primary"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => app.setView('add')}
              >
                Add a bank
              </button>
            </div>
          )}
          {connections.flatMap((c) =>
            c.accounts.map((a) => {
              const t = tag(a.accountId);
              const st = app.stats[a.uid];
              return (
                <div key={a.uid} className="ebs-account">
                  <div className="ebs-name">
                    <strong className="ebs-ellipsis" title={a.name} style={{ fontSize: 14 }}>
                      {a.name}
                    </strong>
                    <span className="ebs-muted ebs-small ebs-ellipsis">
                      {c.aspsp.name} ·{' '}
                      {a.accountId
                        ? `feeds ${app.wfAccountName(a.accountId) ?? 'a Wealthfolio account'}`
                        : 'not linked'}
                      {a.syncEnabled === false ? ' · paused' : ''}
                    </span>
                  </div>
                  <span className={`ebs-pill ${t.cls}`}>{t.text}</span>
                  <div className="ebs-col ebs-small" style={{ gap: 2, width: 170, flex: 'none', whiteSpace: 'nowrap' }}>
                    <span>{st ? `${st.recent} tx · 30 days` : '—'}</span>
                    <span className="ebs-muted">synced {syncLabel([a], now)}</span>
                  </div>
                  <div className="ebs-row" style={{ gap: 8, flex: 'none', flexWrap: 'nowrap' }}>
                    <IconButton
                      label="Sync this account"
                      variant="primary"
                      disabled={app.busy !== null || !a.accountId}
                      onClick={() => app.sync({ sessionId: c.sessionId, uid: a.uid }, 'manual')}
                    >
                      <SyncIcon color="#fffcf0" />
                    </IconButton>
                    <IconButton
                      label="Re-import history (duplicates are skipped)"
                      disabled={app.busy !== null || !a.accountId}
                      onClick={() => app.reimport(c.sessionId, a.uid)}
                    >
                      <HistoryIcon />
                    </IconButton>
                    <IconButton
                      label="Edit this account"
                      variant="outline"
                      onClick={() => app.setDialog({ kind: 'account', sessionId: c.sessionId, uid: a.uid })}
                    >
                      <PencilIcon />
                    </IconButton>
                  </div>
                </div>
              );
            }),
          )}
        </div>

        <div className="ebs-side">
          <div className="ebs-card">
            <strong style={{ fontSize: 15 }}>Sync schedule</strong>
            <label className="ebs-row ebs-between">
              <span>Auto sync while Wealthfolio is open</span>
              <Switch on={settings.autoSync} label="Auto sync" onChange={(v) => app.updateSettings({ autoSync: v })} />
            </label>
            <div className="ebs-row" style={{ gap: 6 }} role="group" aria-label="Interval">
              {INTERVALS.map((h) => (
                <button
                  key={h}
                  className={`ebs-btn ${settings.intervalHours === h ? 'ebs-btn-primary' : ''}`}
                  style={{ flex: 1, padding: 0 }}
                  onClick={() => app.updateSettings({ intervalHours: h })}
                >
                  {h} h
                </button>
              ))}
            </div>
            <span className="ebs-muted ebs-small" style={{ lineHeight: 1.5 }}>
              Runs only while a browser tab with Wealthfolio is open. Your server never calls a bank on its own.
            </span>
          </div>

          <div className="ebs-card">
            <strong style={{ fontSize: 15 }}>Sync activity</strong>
            {!app.log.length && <span className="ebs-muted ebs-small">Nothing yet.</span>}
            {app.log.slice(0, 6).map((l) => (
              <div
                key={`${l.at}-${l.title}`}
                className="ebs-row"
                style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: 12 }}
              >
                <svg width="12" height="12" style={{ marginTop: 4, flex: 'none' }} aria-hidden="true">
                  <circle cx="6" cy="6" r="5" fill={l.ok ? '#5e8a1f' : '#b3261e'} />
                </svg>
                <div className="ebs-col" style={{ flex: 1, gap: 2 }}>
                  <span style={{ fontWeight: 500 }}>{l.title}</span>
                  <span className="ebs-muted ebs-small">{l.detail}</span>
                </div>
                <span className="ebs-muted ebs-small" style={{ whiteSpace: 'nowrap' }}>
                  {timeAgo(l.at, now)}
                </span>
              </div>
            ))}
          </div>

          {!!connections.length && (
            <div className="ebs-card">
              <strong style={{ fontSize: 15 }}>Bank consents</strong>
              {connections.map((c) => {
                const days = daysLeft(c.validUntil, now);
                const tone = consentTone(days);
                return (
                  <div key={c.sessionId} className="ebs-col">
                    <div className="ebs-row ebs-between ebs-small">
                      <strong>{c.aspsp.name}</strong>
                      <span style={{ color: tone === 'ok' ? 'var(--ok)' : 'var(--warn)' }}>{days} days left</span>
                    </div>
                    <div className="ebs-bar">
                      <div
                        style={{
                          width: `${Math.min(100, (days / CONSENT_SPAN_DAYS) * 100)}%`,
                          background: TONE_COLOR[tone],
                        }}
                      />
                    </div>
                    <span className="ebs-muted" style={{ fontSize: 11 }}>
                      Expires {c.validUntil.slice(0, 10)}
                    </span>
                  </div>
                );
              })}
              {soon.length > 0 && (
                <button
                  className="ebs-btn"
                  onClick={() => app.setDialog({ kind: 'bank', sessionId: soon[0].sessionId })}
                >
                  Renew {soon[0].aspsp.name} now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
