import type { ReactNode } from 'react';

const stroke = { fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const SyncIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 10a7 7 0 0 1 12-4.9L17 7M17 3v4h-4M17 10a7 7 0 0 1-12 4.9L3 13M3 17v-4h4" stroke={color} {...stroke} />
  </svg>
);

export const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 10a7 7 0 1 0 2.1-5L3 7M3 3v4h4M10 6v4l3 2" stroke="currentColor" {...stroke} />
  </svg>
);

const PENCIL = 'M2.5 13.5l.7-3L10.6 3.1a1.4 1.4 0 0 1 2 0l.3.3a1.4 1.4 0 0 1 0 2L5.5 12.8l-3 .7Z';

export const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
    <path d={PENCIL} stroke="currentColor" {...stroke} strokeWidth={1.5} />
  </svg>
);

export function IconButton({
  label,
  onClick,
  variant = 'default',
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'outline';
  disabled?: boolean;
  children: ReactNode;
}) {
  const cls = variant === 'primary' ? 'ebs-btn-primary' : variant === 'outline' ? 'ebs-btn-outline' : '';
  return (
    <button
      className={`ebs-btn ebs-btn-icon ebs-tip ${cls}`}
      data-tip={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Avatar({
  initials,
  color,
  label,
  onClick,
}: {
  initials: string;
  color: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button className="ebs-avatar ebs-tip" data-tip={label} aria-label={label} onClick={onClick}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="14" fill={color} />
        <text className="ini" x="14" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fffcf0">
          {initials}
        </text>
        <path
          className="pen"
          transform="translate(7 7) scale(0.875)"
          d={PENCIL}
          fill="none"
          stroke="#fffcf0"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className="ebs-switch" onClick={() => onChange(!on)} />
  );
}

export function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="ebs-overlay" onClick={onClose}>
      <div
        className="ebs-modal"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export const Note = ({ tone, children }: { tone: 'ok' | 'warn' | 'info'; children: ReactNode }) => (
  <div className={`ebs-note ebs-${tone}`}>{children}</div>
);
