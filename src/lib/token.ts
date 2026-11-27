import type { SignJwtOptions } from './jwt';

export const APP_ID_SECRET = 'eb-app-id';
export const PRIVATE_KEY_SECRET = 'eb-private-key';
const TOKEN_SECRET = 'eb-jwt';
const TOKEN_EXP_KEY = 'eb-jwt-exp';
const TTL_SECONDS = 3600;
const REFRESH_MARGIN_SECONDS = 300;

export interface TokenDeps {
  secrets: { get(k: string): Promise<string | null>; set(k: string, v: string): Promise<void> };
  storage: { get(k: string): Promise<string | null>; set(k: string, v: string): Promise<void> };
  sign(options: SignJwtOptions): Promise<string>;
  now(): number;
}

/** Returns the secret key holding a valid JWT, for use as `auth.secretKey` in brokered requests. */
export async function ensureToken({ secrets, storage, sign, now }: TokenDeps) {
  const current = now();
  const exp = Number(await storage.get(TOKEN_EXP_KEY));
  if (exp - current > REFRESH_MARGIN_SECONDS) return TOKEN_SECRET;

  const [applicationId, privateKeyPem] = await Promise.all([
    secrets.get(APP_ID_SECRET),
    secrets.get(PRIVATE_KEY_SECRET),
  ]);
  if (!applicationId || !privateKeyPem) throw new Error('Enable Banking credentials are not configured');

  await secrets.set(TOKEN_SECRET, await sign({ applicationId, privateKeyPem, now: current, ttlSeconds: TTL_SECONDS }));
  await storage.set(TOKEN_EXP_KEY, String(current + TTL_SECONDS));
  return TOKEN_SECRET;
}
