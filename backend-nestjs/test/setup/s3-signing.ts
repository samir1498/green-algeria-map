import { createHash, createHmac } from 'node:crypto';

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function signingKey(secret: string, date: string, region: string, service: string): Buffer {
  const kDate = hmac('AWS4' + secret, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function encodeS3Key(key: string): string {
  return key
    .split('/')
    .map((seg) =>
      encodeURIComponent(seg).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`),
    )
    .join('/');
}

function signS3Request(
  method: string,
  pathname: string,
  headers: Record<string, string>,
  body: Buffer,
  accessKey: string,
  secretKey: string,
  region: string,
): Record<string, string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body.length > 0 ? body : '');

  const allHeaders: Record<string, string> = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...headers,
  };

  const sortedKeys = Object.keys(allHeaders)
    .map((k) => k.toLowerCase())
    .sort();
  const canonicalHeaders = sortedKeys
    .map(
      (k) =>
        `${k}:${allHeaders[Object.keys(allHeaders).find((h) => h.toLowerCase() === k)!].trim().replace(/\s+/g, ' ')}\n`,
    )
    .join('');
  const signedHeaders = sortedKeys.join(';');

  const canonicalRequest = [method, pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');

  const signature = hmac(signingKey(secretKey, dateStamp, region, 's3'), stringToSign).toString('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { ...allHeaders, Authorization: authorization };
}

export function signS3Get(
  endpoint: string,
  bucket: string,
  key: string,
  accessKey: string,
  secretKey: string,
  region: string,
): Record<string, string> {
  const url = new URL(endpoint);
  return signS3Request('GET', `/${bucket}/${encodeS3Key(key)}`, { host: url.host }, Buffer.alloc(0), accessKey, secretKey, region);
}

export function signS3CreateBucket(
  endpoint: string,
  bucket: string,
  accessKey: string,
  secretKey: string,
  region: string,
): Record<string, string> {
  const url = new URL(endpoint);
  return signS3Request('PUT', `/${bucket}`, { host: url.host }, Buffer.alloc(0), accessKey, secretKey, region);
}
