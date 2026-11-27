export function buildAccountPayload(bankName: string, source: { name: string; currency: string; iban?: string }) {
  return {
    name: `${bankName} ${source.name}`,
    accountType: 'CASH',
    currency: source.currency,
    isDefault: false,
    isActive: true,
    trackingMode: 'TRANSACTIONS',
    ...(source.iban && { accountNumber: source.iban }),
  };
}
