import type { BankTransaction as Transaction } from './mapping';

const BASE_URL = 'https://api.enablebanking.com';
const MAX_PAGES = 50;

export interface NetworkLike {
  request(req: {
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    auth?: { type: 'bearer'; secretKey: string };
    timeoutSecs?: number;
  }): Promise<{ status: number; headers: Record<string, string>; body: string }>;
}

export interface Aspsp {
  name: string;
  country: string;
  logo?: string;
  maximum_consent_validity?: number;
}

export interface SessionAccount {
  uid: string;
  account_id?: { iban?: string };
  name?: string;
  details?: string;
  currency?: string;
}

export interface Session {
  session_id: string;
  accounts: SessionAccount[];
  aspsp?: Aspsp;
  access: { valid_until: string };
}

export interface TransactionsOptions {
  dateFrom?: string;
  strategy?: 'default' | 'longest';
}

export interface StartAuthOptions {
  aspsp: Pick<Aspsp, 'name' | 'country'>;
  redirectUrl: string;
  state: string;
  validUntil: Date;
}

export class TransactionsPeriodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionsPeriodError';
  }
}

export class EnableBankingClient {
  constructor(
    private readonly network: NetworkLike,
    private readonly tokenSecretKey: string,
  ) {}

  async listAspsps(country: string): Promise<Aspsp[]> {
    const data = await this.call<{ aspsps: Aspsp[] }>('GET', `/aspsps?country=${encodeURIComponent(country)}`);
    return data.aspsps;
  }

  startAuth({ aspsp, redirectUrl, state, validUntil }: StartAuthOptions) {
    return this.call<{ url: string; authorization_id: string }>('POST', '/auth', {
      access: { valid_until: validUntil.toISOString() },
      aspsp: { name: aspsp.name, country: aspsp.country },
      state,
      redirect_url: redirectUrl,
      psu_type: 'personal',
    });
  }

  createSession(code: string) {
    return this.call<Session>('POST', '/sessions', { code });
  }

  async getTransactions(accountUid: string, { dateFrom, strategy }: TransactionsOptions): Promise<Transaction[]> {
    const all: Transaction[] = [];
    let continuationKey: string | null | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({ transaction_status: 'BOOK' });
      if (dateFrom) params.set('date_from', dateFrom);
      if (strategy) params.set('strategy', strategy);
      if (continuationKey) params.set('continuation_key', continuationKey);

      const data = await this.call<{ transactions: Transaction[]; continuation_key?: string | null }>(
        'GET',
        `/accounts/${accountUid}/transactions?${params}`,
      );
      all.push(...data.transactions);

      if (!data.continuation_key) return all;
      continuationKey = data.continuation_key;
    }
    throw new Error(`Transactions exceeded ${MAX_PAGES} pages for account ${accountUid}`);
  }

  private async call<R>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<R> {
    const response = await this.network.request({
      url: `${BASE_URL}${path}`,
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      auth: { type: 'bearer', secretKey: this.tokenSecretKey },
      timeoutSecs: 60,
    });

    if (response.status < 200 || response.status >= 300) {
      const message = `Enable Banking ${method} ${path} failed (${response.status}): ${errorMessage(response.body)}`;
      throw response.status === 422 && /transactions period/i.test(response.body)
        ? new TransactionsPeriodError(message)
        : new Error(message);
    }
    return JSON.parse(response.body) as R;
  }
}

function errorMessage(body: string) {
  try {
    const parsed = JSON.parse(body);
    return parsed.message ?? parsed.error ?? body;
  } catch {
    return body;
  }
}
