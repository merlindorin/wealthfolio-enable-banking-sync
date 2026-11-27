import { describe, expect, it, vi } from 'vitest';
import { EnableBankingClient, type NetworkLike } from './client';

const json = (body: unknown, status = 200) => ({ status, headers: {}, body: JSON.stringify(body) });

function setup(responses: Array<ReturnType<typeof json>>) {
  const request = vi.fn<NetworkLike['request']>();
  responses.forEach((r) => request.mockResolvedValueOnce(r));
  return { request, client: new EnableBankingClient({ request }, 'jwt-secret') };
}

describe('EnableBankingClient', () => {
  it('lists ASPSPs for a country with bearer auth from the secret store', async () => {
    const { client, request } = setup([json({ aspsps: [{ name: 'Boursorama', country: 'FR' }] })]);

    const result = await client.listAspsps('FR');

    expect(result).toEqual([{ name: 'Boursorama', country: 'FR' }]);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.enablebanking.com/aspsps?country=FR',
        method: 'GET',
        auth: { type: 'bearer', secretKey: 'jwt-secret' },
      }),
    );
  });

  it('starts an authorisation with access validity, state and redirect url', async () => {
    const { client, request } = setup([json({ url: 'https://bank/auth', authorization_id: 'az' })]);

    const out = await client.startAuth({
      aspsp: { name: 'Boursorama', country: 'FR' },
      redirectUrl: 'https://wf.example.com/addons/enable-banking-sync',
      state: 'st-1',
      validUntil: new Date('2027-01-01T00:00:00Z'),
    });

    expect(out.url).toBe('https://bank/auth');
    const call = request.mock.calls[0][0];
    expect(call.method).toBe('POST');
    expect(call.url).toBe('https://api.enablebanking.com/auth');
    expect(JSON.parse(call.body!)).toEqual({
      access: { valid_until: '2027-01-01T00:00:00.000Z' },
      aspsp: { name: 'Boursorama', country: 'FR' },
      state: 'st-1',
      redirect_url: 'https://wf.example.com/addons/enable-banking-sync',
      psu_type: 'personal',
    });
  });

  it('creates a session from an authorisation code', async () => {
    const session = { session_id: 's1', accounts: [{ uid: 'u1' }], access: { valid_until: '2027-01-01T00:00:00Z' } };
    const { client, request } = setup([json(session)]);

    expect(await client.createSession('code-1')).toEqual(session);
    expect(JSON.parse(request.mock.calls[0][0].body!)).toEqual({ code: 'code-1' });
  });

  it('follows continuation keys and only asks for booked transactions', async () => {
    const { client, request } = setup([
      json({ transactions: [{ entry_reference: 'a' }], continuation_key: 'k1' }),
      json({ transactions: [{ entry_reference: 'b' }], continuation_key: null }),
    ]);

    const txs = await client.getTransactions('acc-1', { dateFrom: '2026-11-01' });

    expect(txs.map((t) => t.entry_reference)).toEqual(['a', 'b']);
    expect(request.mock.calls[0][0].url).toBe(
      'https://api.enablebanking.com/accounts/acc-1/transactions?transaction_status=BOOK&date_from=2026-11-01',
    );
    expect(request.mock.calls[1][0].url).toContain('continuation_key=k1');
  });

  it('passes the fetch strategy when requested', async () => {
    const { client, request } = setup([json({ transactions: [], continuation_key: null })]);
    await client.getTransactions('acc-1', { strategy: 'longest' });
    expect(request.mock.calls[0][0].url).toContain('strategy=longest');
  });

  it('throws a descriptive error on non-2xx responses', async () => {
    const { client } = setup([json({ message: 'Unauthorized', error: 'UNAUTHORIZED' }, 401)]);
    await expect(client.listAspsps('FR')).rejects.toThrow(/401.*Unauthorized/);
  });

  it('stops after a maximum number of pages to avoid endless loops', async () => {
    const request = vi.fn().mockResolvedValue(json({ transactions: [], continuation_key: 'same' }));
    const client = new EnableBankingClient({ request }, 's');
    await expect(client.getTransactions('a', {})).rejects.toThrow(/pages/);
  });
});
