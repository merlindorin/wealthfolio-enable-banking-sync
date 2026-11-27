import { describe, expect, it } from 'vitest';
import { signJwt } from './jwt';

const b64urlToBytes = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const decode = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

const toPem = (der: ArrayBuffer) => {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(der)));
  return `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----\n`;
};

async function keyPair() {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const pem = toPem(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  return { pem, publicKey: pair.publicKey };
}

describe('signJwt', () => {
  it('builds the header and claims Enable Banking expects', async () => {
    const { pem } = await keyPair();
    const token = await signJwt({ applicationId: 'app-1', privateKeyPem: pem, now: 1_700_000_000, ttlSeconds: 3600 });
    const [h, p] = token.split('.');

    expect(decode(h)).toEqual({ typ: 'JWT', alg: 'RS256', kid: 'app-1' });
    expect(decode(p)).toEqual({
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
  });

  it('produces a signature verifiable with the public key', async () => {
    const { pem, publicKey } = await keyPair();
    const token = await signJwt({ applicationId: 'a', privateKeyPem: pem, now: 1, ttlSeconds: 10 });
    const [h, p, s] = token.split('.');

    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      b64urlToBytes(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    expect(ok).toBe(true);
  });

  it('rejects a ttl above the 24h maximum', async () => {
    const { pem } = await keyPair();
    await expect(signJwt({ applicationId: 'a', privateKeyPem: pem, now: 1, ttlSeconds: 86_401 })).rejects.toThrow(
      /86400/,
    );
  });

  it('rejects a PEM that is not a PKCS#8 private key', async () => {
    await expect(
      signJwt({
        applicationId: 'a',
        privateKeyPem: '-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----',
        now: 1,
        ttlSeconds: 10,
      }),
    ).rejects.toThrow(/PKCS#8/);
  });
});
