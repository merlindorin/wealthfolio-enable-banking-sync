import { describe, expect, it } from 'vitest';
import { summarizeFields } from './fields';

describe('summarizeFields', () => {
  it('counts populated leaf fields by dotted path across transactions', () => {
    const summary = summarizeFields([
      {
        entry_reference: 'a',
        creditor: { name: 'X' },
        creditor_account: { iban: 'FR76' },
        remittance_information: ['one', 'two'],
      },
      { entry_reference: 'b', creditor: { name: 'Y' }, debtor_account: null, merchant_category_code: '' },
    ]);

    expect(summary).toEqual({
      entry_reference: 2,
      'creditor.name': 2,
      'creditor_account.iban': 1,
      remittance_information: 1,
    });
  });

  it('ignores empty values, nulls and empty arrays', () => {
    expect(summarizeFields([{ a: null, b: '', c: [], d: {}, e: { f: undefined } }])).toEqual({});
  });

  it('returns an empty summary for no transactions', () => {
    expect(summarizeFields([])).toEqual({});
  });
});
