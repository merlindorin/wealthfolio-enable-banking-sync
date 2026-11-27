import { describe, expect, it } from 'vitest';
import { mapTransactions, type BankTransaction } from './mapping';

const base: BankTransaction = {
  entry_reference: 'ref-1',
  transaction_amount: { amount: '12.50', currency: 'EUR' },
  credit_debit_indicator: 'DBIT',
  booking_date: '2026-11-20',
  creditor: { name: 'Boulangerie' },
  remittance_information: ['CB BOULANGERIE', '20/11'],
};

describe('mapTransactions', () => {
  it('maps a debit to a WITHDRAWAL with the counterparty and remittance as comment', () => {
    const [row] = mapTransactions('wf-1', [base]);

    expect(row).toMatchObject({
      accountId: 'wf-1',
      activityType: 'WITHDRAWAL',
      amount: 12.5,
      currency: 'EUR',
      date: '2026-11-20',
      sourceRecordId: 'ref-1',
      comment: 'Boulangerie — CB BOULANGERIE 20/11',
      isValid: true,
      isDraft: false,
    });
  });

  it('always sends an empty symbol because the server requires the field on cash rows', () => {
    const [row] = mapTransactions('wf-1', [base]);
    expect(row).toHaveProperty('symbol', '');
  });

  it('maps a credit to a DEPOSIT, the type Spending treats as categorizable income on a cash account, using the debtor as counterparty', () => {
    const [row] = mapTransactions('wf-1', [
      {
        ...base,
        credit_debit_indicator: 'CRDT',
        creditor: undefined,
        debtor: { name: 'Employer' },
        remittance_information: [],
      },
    ]);
    expect(row.activityType).toBe('DEPOSIT');
    expect(row.comment).toBe('Employer');
  });

  it('does not send flow flags; the host classifies cash flows by type', () => {
    const [credit] = mapTransactions('w', [{ ...base, credit_debit_indicator: 'CRDT' }]);
    expect(credit).not.toHaveProperty('isExternal');
  });

  it('always sends a positive amount, whatever the sign in the payload', () => {
    const [row] = mapTransactions('w', [{ ...base, transaction_amount: { amount: '-3.00', currency: 'EUR' } }]);
    expect(row.amount).toBe(3);
  });

  it('falls back to transaction_id, then to value_date when booking_date is missing', () => {
    const [a] = mapTransactions('w', [{ ...base, entry_reference: undefined, transaction_id: 'tid' }]);
    const [b] = mapTransactions('w', [{ ...base, booking_date: undefined, value_date: '2026-11-19' }]);
    expect(a.sourceRecordId).toBe('tid');
    expect(b.date).toBe('2026-11-19');
  });

  it('builds a deterministic id for transactions without references, distinguishing identical ones', () => {
    const noRef = { ...base, entry_reference: undefined };
    const first = mapTransactions('w', [noRef, noRef]);
    const again = mapTransactions('w', [noRef, noRef]);

    expect(first[0].sourceRecordId).not.toBe(first[1].sourceRecordId);
    expect(again.map((r) => r.sourceRecordId)).toEqual(first.map((r) => r.sourceRecordId));
  });

  it('skips transactions without any usable date and reports them', () => {
    const result = mapTransactions('w', [{ ...base, booking_date: undefined }]);
    expect(result).toEqual([]);
  });

  it('keeps counterparty IBANs and the bank transaction code in metadata when the bank provides them', () => {
    const [row] = mapTransactions('w', [
      {
        ...base,
        creditor_account: { iban: 'FR7611111' },
        debtor_account: { iban: 'FR7622222' },
        bank_transaction_code: { code: 'PMNT', description: 'Card payment' },
        reference_number: 'RF18',
      },
    ]);
    expect(row.metadata).toMatchObject({
      creditorIban: 'FR7611111',
      debtorIban: 'FR7622222',
      bankTransactionCode: 'PMNT',
      referenceNumber: 'RF18',
    });
  });

  it('keeps the raw bank reference data in metadata', () => {
    const [row] = mapTransactions('w', [{ ...base, merchant_category_code: '5462' }]);
    expect(row.metadata).toMatchObject({ source: 'enable-banking', merchantCategoryCode: '5462' });
  });

  it('keeps the full bank entry in metadata for debugging and for external agents', () => {
    const [row] = mapTransactions('w', [base]);
    expect(row.metadata).toMatchObject({ raw: base });
  });
});
