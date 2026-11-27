import { describe, expect, it } from 'vitest';
import { mapTransactions, type BankTransaction } from './mapping';

const tx = (remittance: string): BankTransaction => ({
  entry_reference: 'ref-1',
  transaction_amount: { amount: '12.50', currency: 'EUR' },
  credit_debit_indicator: 'DBIT',
  booking_date: '2026-11-25',
  creditor: { name: 'BOULANGERIE' },
  remittance_information: [remittance],
});

describe('mapTransactions with rewrite rules', () => {
  it('rewrites the comment with the rules', () => {
    const [row] = mapTransactions(
      'wf',
      [tx('PAIEMENT PAR CARTE X3480 25/11')],
      [
        { pattern: 'PAIEMENT PAR CARTE', replacement: '' },
        { pattern: 'X\\d{4}', replacement: '' },
        { pattern: '\\d{2}/\\d{2}', replacement: '' },
      ],
    );
    expect(row.comment).toBe('BOULANGERIE');
  });

  it('keeps the original text in the metadata and the record id unchanged', () => {
    const rules = [{ pattern: 'CARTE', replacement: 'CB' }];
    const [plain] = mapTransactions('wf', [tx('PAIEMENT PAR CARTE')]);
    const [rewritten] = mapTransactions('wf', [tx('PAIEMENT PAR CARTE')], rules);

    expect(rewritten.comment).toBe('BOULANGERIE — PAIEMENT PAR CB');
    expect(rewritten.sourceRecordId).toBe(plain.sourceRecordId);
    expect(rewritten.metadata?.raw).toEqual(plain.metadata?.raw);
  });

  it('changes nothing without rules', () => {
    const [row] = mapTransactions('wf', [tx('PAIEMENT PAR CARTE')]);
    expect(row.comment).toBe('BOULANGERIE — PAIEMENT PAR CARTE');
  });
});
