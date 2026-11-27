import { describe, expect, it, vi } from 'vitest';
import { ensureToken, type TokenDeps } from './token';

function deps(overrides: Partial<TokenDeps> = {}) {
  const secrets = new Map<string, string>([
    ['eb-app-id', 'app-1'],
    ['eb-private-key', 'PEM'],
  ]);
  const storage = new Map<string, string>();
  const d: TokenDeps = {
    secrets: {
      get: async (k) => secrets.get(k) ?? null,
      set: async (k, v) => void secrets.set(k, v),
    },
    storage: {
      get: async (k) => storage.get(k) ?? null,
      set: async (k, v) => void storage.set(k, v),
    },
    sign: vi.fn(async () => 'signed-jwt'),
    now: () => 1_000,
    ...overrides,
  };
  return { d, secrets, storage };
}

describe('ensureToken', () => {
  it('signs a new token, stores it as a secret and returns its key', async () => {
    const { d, secrets } = deps();
    const key = await ensureToken(d);

    expect(key).toBe('eb-jwt');
    expect(secrets.get('eb-jwt')).toBe('signed-jwt');
    expect(d.sign).toHaveBeenCalledWith({ applicationId: 'app-1', privateKeyPem: 'PEM', now: 1_000, ttlSeconds: 3600 });
  });

  it('reuses a token that is still valid for more than 5 minutes', async () => {
    const { d, storage } = deps();
    storage.set('eb-jwt-exp', String(1_000 + 301));
    await ensureToken(d);
    expect(d.sign).not.toHaveBeenCalled();
  });

  it('re-signs when the token is about to expire', async () => {
    const { d, storage } = deps();
    storage.set('eb-jwt-exp', String(1_000 + 299));
    await ensureToken(d);
    expect(d.sign).toHaveBeenCalledOnce();
  });

  it('fails clearly when credentials are not configured', async () => {
    const { d, secrets } = deps();
    secrets.delete('eb-private-key');
    await expect(ensureToken(d)).rejects.toThrow(/not configured/i);
  });
});
