const MAX_TTL_SECONDS = 86_400;

export interface SignJwtOptions {
  applicationId: string;
  privateKeyPem: string;
  now: number;
  ttlSeconds: number;
}

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const encodeJson = (value: unknown) => toBase64Url(encoder.encode(JSON.stringify(value)));

function pemToDer(pem: string): Uint8Array<ArrayBuffer> {
  const match = pem.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
  if (!match) throw new Error('Private key must be a PKCS#8 PEM ("BEGIN PRIVATE KEY")');
  return Uint8Array.from(atob(match[1].replace(/\s+/g, '')), (c) => c.charCodeAt(0));
}

export async function signJwt({ applicationId, privateKeyPem, now, ttlSeconds }: SignJwtOptions) {
  if (ttlSeconds > MAX_TTL_SECONDS) throw new Error(`JWT ttl cannot exceed ${MAX_TTL_SECONDS} seconds`);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const header = encodeJson({ typ: 'JWT', alg: 'RS256', kid: applicationId });
  const claims = encodeJson({
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat: now,
    exp: now + ttlSeconds,
  });
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(`${header}.${claims}`));

  return `${header}.${claims}.${toBase64Url(new Uint8Array(signature))}`;
}
