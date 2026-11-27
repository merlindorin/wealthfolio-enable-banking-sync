import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applicationIdFromFileName, normalizePrivateKey } from './pem';

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pkcs8 = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const pkcs1 = keys.privateKey.export({ type: 'pkcs1', format: 'pem' }) as string;

const importable = async (pem: string) => {
  const body = pem.replace(/-----[A-Z ]+-----|\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
};

describe('normalizePrivateKey', () => {
  it('accepts a PKCS#8 key as is', () => {
    const result = normalizePrivateKey(pkcs8);
    expect(result).toEqual({ pem: pkcs8.trim(), converted: false });
  });

  it('tolerates surrounding whitespace and Windows line endings', () => {
    const result = normalizePrivateKey(`\n  ${pkcs8.replace(/\n/g, '\r\n')}  \n`);
    expect(result).toEqual({ pem: pkcs8.trim(), converted: false });
  });

  it('converts a PKCS#1 key to a PKCS#8 key that Web Crypto can import', async () => {
    const result = normalizePrivateKey(pkcs1);
    if ('error' in result) throw new Error(result.error);

    expect(result.converted).toBe(true);
    expect(result.pem.startsWith('-----BEGIN PRIVATE KEY-----')).toBe(true);
    await expect(importable(result.pem)).resolves.toBeDefined();
  });

  it('produces a key that signs the same as the original', async () => {
    const result = normalizePrivateKey(pkcs1);
    if ('error' in result) throw new Error(result.error);
    const data = new TextEncoder().encode('hello');
    const sign = async (pem: string) =>
      new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', await importable(pem), data));

    expect(await sign(result.pem)).toEqual(await sign(pkcs8));
  });

  it('explains what is wrong with a certificate', () => {
    expect(normalizePrivateKey('-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----')).toEqual({
      error: expect.stringMatching(/certificate.*private key/i),
    });
  });

  it('refuses an encrypted key', () => {
    expect(
      normalizePrivateKey('-----BEGIN ENCRYPTED PRIVATE KEY-----\nAAAA\n-----END ENCRYPTED PRIVATE KEY-----'),
    ).toEqual({
      error: expect.stringMatching(/encrypted/i),
    });
  });

  it('refuses anything else, and an empty value', () => {
    expect(normalizePrivateKey('hello')).toEqual({ error: expect.stringMatching(/PEM/) });
    expect(normalizePrivateKey('   ')).toEqual({ error: expect.stringMatching(/empty/i) });
  });

  it('refuses a key whose body is not base64', () => {
    expect(normalizePrivateKey('-----BEGIN PRIVATE KEY-----\n!!!!\n-----END PRIVATE KEY-----')).toEqual({
      error: expect.stringMatching(/PEM/),
    });
  });
});

describe('applicationIdFromFileName', () => {
  it('reads the application id from the file Enable Banking downloads', () => {
    expect(applicationIdFromFileName('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pem')).toBe(
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    );
  });

  it('is case-insensitive about the extension and ignores other names', () => {
    expect(applicationIdFromFileName('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE.PEM')).toBe(
      'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
    );
    expect(applicationIdFromFileName('key.pem')).toBeNull();
    expect(applicationIdFromFileName('private.key')).toBeNull();
  });
});
