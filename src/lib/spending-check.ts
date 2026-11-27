export interface SpendingContextLike {
  enabled: boolean;
  accountIds: string[];
}

export function spendingWarning(context: SpendingContextLike | null, accountId: string): string | null {
  if (!context) return null;
  if (!context.enabled) return 'Spending is disabled: enable it in Settings → Suivi des dépenses.';
  if (!context.accountIds.includes(accountId)) {
    return 'This account is not tracked by Spending, so its transactions show under Investments. Turn it on in Settings → Suivi des dépenses.';
  }
  return null;
}
