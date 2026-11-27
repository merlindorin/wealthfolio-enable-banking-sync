import { describe, expect, it } from 'vitest';
import { spendingWarning } from './spending-check';

describe('spendingWarning', () => {
  it('warns when Spending is disabled', () => {
    expect(spendingWarning({ enabled: false, accountIds: [] }, 'a1')).toMatch(/disabled/i);
  });

  it('warns when the account is not tracked by Spending', () => {
    expect(spendingWarning({ enabled: true, accountIds: ['a2'] }, 'a1')).toMatch(/Suivi des dépenses|Spending tracker/);
  });

  it('is silent when the account is tracked', () => {
    expect(spendingWarning({ enabled: true, accountIds: ['a1'] }, 'a1')).toBeNull();
  });

  it('is silent when context is unavailable (older Wealthfolio)', () => {
    expect(spendingWarning(null, 'a1')).toBeNull();
  });
});
