import { describe, expect, it } from 'vitest';
import { buildAccountPayload } from './accounts';

describe('buildAccountPayload', () => {
  it('creates a cash account tracked by transactions, the type Spending can follow', () => {
    expect(buildAccountPayload('Crédit Agricole', { name: 'JOHN DOE', currency: 'EUR', iban: 'FR76123' })).toEqual({
      name: 'Crédit Agricole JOHN DOE',
      accountType: 'CASH',
      currency: 'EUR',
      isDefault: false,
      isActive: true,
      trackingMode: 'TRANSACTIONS',
      accountNumber: 'FR76123',
    });
  });

  it('omits the account number when the bank does not provide an IBAN', () => {
    expect(buildAccountPayload('B', { name: 'A', currency: 'EUR' })).not.toHaveProperty('accountNumber');
  });
});
