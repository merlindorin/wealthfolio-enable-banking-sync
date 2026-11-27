import type { ActivityImport } from '@wealthfolio/addon-sdk';

export interface BankTransaction {
  entry_reference?: string | null;
  transaction_id?: string | null;
  transaction_amount: { amount: string; currency: string };
  credit_debit_indicator: 'CRDT' | 'DBIT';
  booking_date?: string | null;
  value_date?: string | null;
  transaction_date?: string | null;
  creditor?: { name?: string } | null;
  debtor?: { name?: string } | null;
  remittance_information?: string[] | null;
  merchant_category_code?: string | null;
  creditor_account?: { iban?: string | null } | null;
  debtor_account?: { iban?: string | null } | null;
  bank_transaction_code?: { code?: string | null; description?: string | null } | null;
  reference_number?: string | null;
}

export interface ResolvedEntry {
  date: string;
  isCredit: boolean;
  counterparty: string;
  remittance: string;
  id: string;
}

/** Shared by the importer and the entries view so both derive the same record id. */
export function resolveEntry(tx: BankTransaction, seen: Map<string, number>): ResolvedEntry | null {
  const date = tx.booking_date ?? tx.value_date ?? tx.transaction_date;
  if (!date) return null;

  const isCredit = tx.credit_debit_indicator === 'CRDT';
  const counterparty = (isCredit ? tx.debtor?.name : tx.creditor?.name) ?? '';
  const remittance = (tx.remittance_information ?? []).join(' ');
  return { date, isCredit, counterparty, remittance, id: sourceRecordId(tx, date, counterparty, remittance, seen) };
}

export function mapTransactions(accountId: string, transactions: BankTransaction[]): ActivityImport[] {
  const seen = new Map<string, number>();
  const rows: ActivityImport[] = [];

  for (const tx of transactions) {
    const entry = resolveEntry(tx, seen);
    if (!entry) continue;

    rows.push({
      accountId,
      activityType: entry.isCredit ? 'DEPOSIT' : 'WITHDRAWAL',
      date: entry.date,
      symbol: '',
      amount: Math.abs(Number(tx.transaction_amount.amount)),
      currency: tx.transaction_amount.currency,
      comment: [entry.counterparty, entry.remittance].filter(Boolean).join(' — '),
      sourceRecordId: entry.id,
      metadata: {
        source: 'enable-banking',
        merchantCategoryCode: tx.merchant_category_code ?? undefined,
        creditorIban: tx.creditor_account?.iban ?? undefined,
        debtorIban: tx.debtor_account?.iban ?? undefined,
        bankTransactionCode: tx.bank_transaction_code?.code ?? undefined,
        referenceNumber: tx.reference_number ?? undefined,
        raw: tx,
      },
      isValid: true,
      isDraft: false,
    });
  }
  return rows;
}

function sourceRecordId(
  tx: BankTransaction,
  date: string,
  counterparty: string,
  remittance: string,
  seen: Map<string, number>,
) {
  const reference = tx.entry_reference ?? tx.transaction_id;
  if (reference) return reference;

  const key = [
    date,
    tx.credit_debit_indicator,
    tx.transaction_amount.amount,
    tx.transaction_amount.currency,
    counterparty,
    remittance,
  ].join('|');
  const occurrence = seen.get(key) ?? 0;
  seen.set(key, occurrence + 1);
  return `h:${key}#${occurrence}`;
}
