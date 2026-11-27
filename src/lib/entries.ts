import { resolveEntry, type BankTransaction } from './mapping';

const SOURCE_PREFIX = 'addon:enable-banking-sync:';

export type EntryStatus = 'imported' | 'not-imported';

export interface EntryRow {
  ref: string;
  accountUid: string;
  date: string;
  text: string;
  amount: number;
  currency: string;
  status: EntryStatus;
  raw: BankTransaction;
}

export function importedRefs(activities: Array<{ sourceRecordId?: string }>): Set<string> {
  const refs = new Set<string>();
  for (const { sourceRecordId } of activities) {
    if (sourceRecordId?.startsWith(SOURCE_PREFIX)) refs.add(sourceRecordId.slice(SOURCE_PREFIX.length));
  }
  return refs;
}

export function toEntryRows(accountUid: string, transactions: BankTransaction[], imported: Set<string>): EntryRow[] {
  const seen = new Map<string, number>();
  const rows: EntryRow[] = [];

  for (const raw of transactions) {
    const entry = resolveEntry(raw, seen);
    if (!entry) continue;
    const amount = Math.abs(Number(raw.transaction_amount.amount));
    rows.push({
      ref: entry.id,
      accountUid,
      date: entry.date,
      text: [entry.counterparty, entry.remittance].filter(Boolean).join(' — '),
      amount: entry.isCredit ? amount : -amount,
      currency: raw.transaction_amount.currency,
      status: imported.has(entry.id) ? 'imported' : 'not-imported',
      raw,
    });
  }
  return rows;
}

export function summarizeEntries(rows: EntryRow[]): Record<'all' | EntryStatus, number> {
  const summary = { all: rows.length, imported: 0, 'not-imported': 0 };
  for (const row of rows) summary[row.status]++;
  return summary;
}
