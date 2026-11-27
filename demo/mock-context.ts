import type { AddonContext } from '@wealthfolio/addon-sdk';
import type { BankTransaction } from '../src/lib/mapping';
import type { Connection } from '../src/lib/state';

const DAY = 86_400_000;
const SOURCE_PREFIX = 'addon:enable-banking-sync:';

const WF_ACCOUNTS = [
  {
    id: 'wf-checking',
    name: 'Example Bank · Checking',
    accountType: 'CASH',
    currency: 'EUR',
    isActive: true,
    isArchived: false,
  },
  {
    id: 'wf-joint',
    name: 'Example Bank · Joint',
    accountType: 'CASH',
    currency: 'EUR',
    isActive: true,
    isArchived: false,
  },
];

const MERCHANTS = [
  ['CARD PAYMENT 1234 BAKERY CORNER', '3.80'],
  ['CARD PAYMENT 1234 CITY TRANSIT', '2.10'],
  ['CARD PAYMENT 1234 GROCERY MARKET', '28.47'],
  ['CARD PAYMENT 1234 PHARMACY CENTRAL', '11.99'],
  ['DIRECT DEBIT STREAMING SERVICE', '10.99'],
  ['CARD PAYMENT 1234 TRAIN TICKETS', '36.00'],
  ['CARD PAYMENT 1234 COFFEE SHOP', '4.50'],
];

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * DAY).toISOString().slice(0, 10);
}

function fakeTransactions(prefix: string, count: number): BankTransaction[] {
  return Array.from({ length: count }, (_, i) => {
    const credit = i % 9 === 0;
    const [text, amount] = credit ? ['TRANSFER FROM EMPLOYER SALARY', '2450.00'] : MERCHANTS[i % MERCHANTS.length];
    const date = isoDaysAgo(Math.floor(i * 0.7));
    return {
      entry_reference: `${prefix}${String(1000 + i)}`,
      transaction_amount: { amount, currency: 'EUR' },
      credit_debit_indicator: credit ? 'CRDT' : 'DBIT',
      booking_date: date,
      value_date: date,
      remittance_information: [text],
    } as BankTransaction;
  });
}

async function demoPrivateKey() {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign'],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const b64 = btoa(String.fromCharCode(...der))
    .match(/.{1,64}/g)!
    .join('\n');
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
}

export async function createDemoContext({ empty = false } = {}): Promise<AddonContext> {
  const storage = new Map<string, string>();
  const secrets = new Map<string, string>([
    ['eb-app-id', '00000000-0000-0000-0000-000000000000'],
    ['eb-private-key', await demoPrivateKey()],
  ]);
  storage.set('eb-redirect-url', 'https://wealthfolio.example.com/addons/enable-banking-sync');

  const transactions: Record<string, BankTransaction[]> = {
    'uid-checking': fakeTransactions('9100', 42),
    'uid-joint': fakeTransactions('9200', 28),
  };
  const notImportedYet: Record<string, number> = { 'uid-checking': 2, 'uid-joint': 0 };

  const activities = Object.entries(transactions).flatMap(([uid, txs]) =>
    txs.slice(notImportedYet[uid]).map((tx, i) => ({
      id: `${uid}-activity-${i}`,
      accountId: uid === 'uid-checking' ? 'wf-checking' : 'wf-joint',
      accountName: uid === 'uid-checking' ? 'Example Bank · Checking' : 'Example Bank · Joint',
      activityType: tx.credit_debit_indicator === 'CRDT' ? 'DEPOSIT' : 'WITHDRAWAL',
      amount: tx.transaction_amount.amount,
      currency: 'EUR',
      date: new Date(tx.booking_date as string),
      sourceRecordId: `${SOURCE_PREFIX}${tx.entry_reference}`,
      importRunId: '3f1c9a52-0000-4000-8000-000000000001',
    })),
  );

  if (!empty) {
    const connection: Connection = {
      sessionId: 'demo-session',
      aspsp: { name: 'Example Bank', country: 'FR' },
      validUntil: new Date(Date.now() + 76 * DAY).toISOString(),
      color: '#234e78',
      accounts: [
        {
          uid: 'uid-checking',
          name: 'JANE DOE',
          currency: 'EUR',
          accountId: 'wf-checking',
          lastSyncedOn: isoDaysAgo(0),
          lastSyncedAt: Date.now() - 2 * 60_000,
        },
        {
          uid: 'uid-joint',
          name: 'JANE AND JOHN DOE',
          currency: 'EUR',
          accountId: 'wf-joint',
          lastSyncedOn: isoDaysAgo(0),
          lastSyncedAt: Date.now() - 2 * 60_000,
        },
      ],
    };
    storage.set('eb-connections', JSON.stringify([connection]));
    storage.set('eb-settings', JSON.stringify({ autoSync: true, intervalHours: 1 }));
    storage.set('eb-last-auto-sync', String(Date.now() - 26 * 60_000));
    storage.set(
      'eb-sync-log',
      JSON.stringify([
        { at: Date.now() - 2 * 60_000, kind: 'auto', ok: true, title: 'Auto sync', detail: '2 new, 68 already known' },
        { at: Date.now() - 3_600_000, kind: 'auto', ok: true, title: 'Auto sync', detail: '0 new, 66 already known' },
        {
          at: Date.now() - 3 * 3_600_000,
          kind: 'manual',
          ok: true,
          title: 'Manual sync',
          detail: '19 new, 47 already known',
        },
        { at: Date.now() - 86_400_000, kind: 'bank', ok: true, title: 'Bank connected', detail: 'Example Bank' },
      ]),
    );
  }

  const json = (status: number, body: unknown) => ({ status, headers: {}, body: JSON.stringify(body) });

  const api = {
    storage: {
      get: async (k: string) => storage.get(k) ?? null,
      set: async (k: string, v: string) => void storage.set(k, v),
      delete: async (k: string) => void storage.delete(k),
    },
    secrets: {
      get: async (k: string) => secrets.get(k) ?? null,
      set: async (k: string, v: string) => void secrets.set(k, v),
      delete: async (k: string) => void secrets.delete(k),
    },
    accounts: {
      getAll: async () => WF_ACCOUNTS,
      create: async () => WF_ACCOUNTS[0],
    },
    activities: {
      getAll: async (accountId?: string) => activities.filter((a) => !accountId || a.accountId === accountId),
      checkImport: async (rows: unknown[]) => rows,
      import: async () => ({ summary: { imported: 0, duplicates: 0, skipped: 0 } }),
    },
    spending: {
      getContext: async () => ({ enabled: true, accountIds: ['wf-checking', 'wf-joint'], excludedCategoryIds: [] }),
    },
    network: {
      request: async ({ url }: { url: string }) => {
        const { pathname } = new URL(url);
        if (pathname === '/aspsps') {
          return json(200, {
            aspsps: [
              { name: 'Example Bank', country: 'FR', maximum_consent_validity: 7_776_000 },
              { name: 'Example Savings', country: 'FR', maximum_consent_validity: 7_776_000 },
              { name: 'Demo Credit Union', country: 'FR', maximum_consent_validity: 2_592_000 },
              { name: 'Sample Online Bank', country: 'FR' },
            ],
          });
        }
        const match = pathname.match(/^\/accounts\/([^/]+)\/transactions$/);
        if (match) return json(200, { transactions: transactions[match[1]] ?? [], continuation_key: null });
        return json(404, { message: 'not found' });
      },
    },
    toast: { success: console.info, error: console.error, warning: console.warn, info: console.info },
    logger: {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
      trace: console.debug,
    },
    navigation: { navigate: async () => undefined },
  };

  return { api } as unknown as AddonContext;
}
