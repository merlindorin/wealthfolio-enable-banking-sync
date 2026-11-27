import { useState } from 'react';
import { applyRewrites, isValidPattern, type Rewrite } from '../lib/rewrite';

const EXAMPLES = [
  'LA BOULANGERIE DU MARCHE — PAIEMENT PAR CARTE X3480 25/11',
  'SUPERMARCHE CENTRAL — PAIEMENT PAR CARTE X3480 24/11 PARIS',
  'Atelier Martin — VIREMENT EN VOTRE FAVEUR Loyer novembre',
];

export function RewriteRulesCard({ rules, onSave }: { rules: Rewrite[]; onSave: (rules: Rewrite[]) => Promise<void> }) {
  const [draft, setDraft] = useState(rules);
  const dirty = JSON.stringify(draft) !== JSON.stringify(rules);

  const change = (index: number, patch: Partial<Rewrite>) =>
    setDraft(draft.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));

  return (
    <div className="ebs-card" style={{ maxWidth: 760 }}>
      <div className="ebs-row ebs-between">
        <div className="ebs-col" style={{ gap: 2 }}>
          <strong style={{ fontSize: 15 }}>Description rewrite</strong>
          <span className="ebs-muted ebs-small">
            Find and replace in each transaction text before it is imported. Rules run top to bottom.
          </span>
        </div>
        <span className="ebs-pill">
          {draft.length} rule{draft.length === 1 ? '' : 's'}
        </span>
      </div>

      {draft.map((rule, i) => {
        const invalid = rule.pattern !== '' && !isValidPattern(rule.pattern);
        return (
          <div key={i} className="ebs-col" style={{ gap: 4 }}>
            <div className="ebs-row" style={{ flexWrap: 'nowrap', gap: 8 }}>
              <input
                className="ebs-input"
                aria-label={`Rule ${i + 1} pattern`}
                aria-invalid={invalid}
                placeholder="Text to find"
                value={rule.pattern}
                onChange={(e) => change(i, { pattern: e.target.value })}
                style={invalid ? { borderColor: 'var(--warn)' } : undefined}
              />
              <span className="ebs-muted">→</span>
              <input
                className="ebs-input"
                aria-label={`Rule ${i + 1} replacement`}
                placeholder="Replace with (empty removes it)"
                value={rule.replacement}
                onChange={(e) => change(i, { replacement: e.target.value })}
              />
              <button
                className="ebs-btn"
                aria-label={`Remove rule ${i + 1}`}
                onClick={() => setDraft(draft.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
            {invalid && (
              <span className="ebs-small" style={{ color: 'var(--warn)' }}>
                Not a valid pattern, this rule is skipped.
              </span>
            )}
          </div>
        );
      })}
      {!draft.length && <span className="ebs-muted ebs-small">No rule yet. Imports keep the bank text as is.</span>}

      <div className="ebs-row ebs-between">
        <button className="ebs-btn" onClick={() => setDraft([...draft, { pattern: '', replacement: '' }])}>
          + Add a rule
        </button>
        <span className="ebs-muted ebs-small">
          Regular expressions, case-insensitive. Use $1 to keep a captured part.
        </span>
      </div>

      {draft.some((rule) => rule.pattern) && (
        <div className="ebs-col" style={{ gap: 6, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <span className="ebs-label">Preview</span>
          {EXAMPLES.map((example) => {
            const after = applyRewrites(example, draft);
            return (
              <div key={example} className="ebs-row" style={{ gap: 10 }}>
                <span className="ebs-small" style={{ flex: '1 1 240px' }}>
                  {example}
                </span>
                <span className="ebs-small" style={{ flex: '1 1 240px', fontWeight: 600 }}>
                  {after === example ? 'unchanged' : after}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <span className="ebs-muted ebs-small">
        Applies to new imports only. Entries already in Wealthfolio keep their text, and the bank's original text stays
        in the entry details.
      </span>
      <button
        className="ebs-btn ebs-btn-primary"
        style={{ alignSelf: 'flex-end' }}
        disabled={!dirty}
        onClick={() => onSave(draft.filter((rule) => rule.pattern))}
      >
        Save rules
      </button>
    </div>
  );
}
