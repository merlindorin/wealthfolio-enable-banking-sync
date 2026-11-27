import { describe, expect, it } from 'vitest';
import { importedRefs, summarizeEntries, toEntryRows } from './entries';
import type { BankTransaction } from './mapping';

const tx = (ref: string | undefined, amount: string, indicator: 'DBIT' | 'CRDT' = 'DBIT'): BankTransaction => ({
  entry_reference: ref,
  transaction_amount: { amount, currency: 'EUR' },
  credit_debit_indicator: indicator,
  booking_date: '2026-11-26',
  remittance_information: ['CARD PAYMENT 1234 COFFEE SHOP'],
});

describe('importedRefs', () => {
  it('collects the bank references of activities this addon imported, without the host prefix', () => {
    const refs = importedRefs([
      { sourceRecordId: 'addon:enable-banking-sync:111' },
      { sourceRecordId: 'addon:other-addon:222' },
      { sourceRecordId: undefined },
      { sourceRecordId: 'csv:333' },
    ]);
    expect([...refs]).toEqual(['111']);
  });
});

describe('toEntryRows', () => {
  it('marks entries imported or not by their bank reference and signs the amount', () => {
    const rows = toEntryRows('u1', [tx('111', '43.60'), tx('222', '157.35', 'CRDT')], new Set(['111']));

    expect(rows.map((r) => [r.ref, r.status, r.amount])).toEqual([
      ['111', 'imported', -43.6],
      ['222', 'not-imported', 157.35],
    ]);
  });

  it('keeps the untouched raw entry for the debug view', () => {
    const t = tx('111', '1.00');
    expect(toEntryRows('u1', [t], new Set())[0].raw).toBe(t);
  });

  it('uses the same fallback id as the importer for entries without a reference', () => {
    const rows = toEntryRows('u1', [tx(undefined, '5.00'), tx(undefined, '5.00')], new Set());
    expect(rows[0].ref).not.toBe(rows[1].ref);
    expect(rows[0].ref.startsWith('h:')).toBe(true);
  });

  it('skips entries with no usable date, as the importer does', () => {
    expect(toEntryRows('u1', [{ ...tx('1', '1.00'), booking_date: undefined }], new Set())).toEqual([]);
  });
});

describe('summarizeEntries', () => {
  it('counts per status', () => {
    const rows = toEntryRows('u', [tx('1', '1.00'), tx('2', '1.00'), tx('3', '1.00')], new Set(['1', '2']));
    expect(summarizeEntries(rows)).toEqual({ all: 3, imported: 2, 'not-imported': 1 });
  });
});
