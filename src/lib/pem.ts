const KEY_BLOCK = /-----BEGIN (RSA )?PRIVATE KEY-----([\s\S]+?)-----END (?:RSA )?PRIVATE KEY-----/;
const FILE_NAME = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.pem$/i;
const RSA_ALGORITHM = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
const NOT_A_PEM = 'This is not a PEM private key. It should start with "-----BEGIN PRIVATE KEY-----".';

export type NormalizedKey = { pem: string; converted: boolean } | { error: string };

function derLength(length: number): number[] {
  if (length < 0x80) return [length];
  if (length < 0x100) return [0x81, length];
  return [0x82, length >> 8, length & 0xff];
}

function der(tag: number, content: number[]): number[] {
  return [tag, ...derLength(content.length), ...content];
}

function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  const version = [0x02, 0x01, 0x00];
  return Uint8Array.from(der(0x30, [...version, ...RSA_ALGORITHM, ...der(0x04, [...pkcs1])]));
}

const toPem = (bytes: Uint8Array) =>
  `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...bytes))
    .match(/.{1,64}/g)!
    .join('\n')}\n-----END PRIVATE KEY-----`;

/** Accepts PKCS#8 as is and converts a traditional RSA key, since Web Crypto only imports PKCS#8. */
export function normalizePrivateKey(input: string): NormalizedKey {
  const text = input.replace(/\r\n/g, '\n').trim();
  if (!text) return { error: 'The private key is empty.' };
  if (/BEGIN CERTIFICATE/.test(text)) {
    return {
      error:
        'This is a certificate, not the private key. Use the .pem file downloaded when you registered the application.',
    };
  }
  if (/ENCRYPTED/.test(text)) {
    return { error: 'This key is encrypted with a passphrase. Remove the passphrase first, then use it here.' };
  }

  const match = KEY_BLOCK.exec(text);
  if (!match) return { error: NOT_A_PEM };

  const body = match[2].replace(/\s+/g, '');
  let bytes: Uint8Array;
  try {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body)) throw new Error('not base64');
    bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  } catch {
    return { error: NOT_A_PEM };
  }

  const isRsa = Boolean(match[1]);
  return { pem: toPem(isRsa ? pkcs1ToPkcs8(bytes) : bytes), converted: isRsa };
}

export function applicationIdFromFileName(fileName: string): string | null {
  return FILE_NAME.exec(fileName)?.[1] ?? null;
}
