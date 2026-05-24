import { createHash, createHmac } from 'node:crypto';

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function signingKey(
  secret: string,
  date: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmac('AWS4' + secret, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

/**
 * Signs a PUT request using AWS Signature V4 and returns the signed headers.
 *
 * This matches how RustFS expects S3-compatible requests — HMAC-SHA256
 * signed with the canonical request, not a plain AWS accessKey:secretKey
 * header.
 */
export function signS3Put(
  endpoint: string,
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
  accessKey: string,
  secretKey: string,
  region: string,
): Record<string, string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const url = new URL(endpoint);
  const pathname = `/${bucket}/${encodeS3Key(key)}`;
  const payloadHash = sha256Hex(body);

  const headers: Record<string, string> = {
    host: url.host,
    'content-type': contentType,
    'content-length': String(body.length),
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };

  const sortedKeys = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort();
  const canonicalHeaders = sortedKeys
    .map(
      (k) =>
        `${k}:${headers[Object.keys(headers).find((h) => h.toLowerCase() === k)!].trim().replace(/\s+/g, ' ')}\n`,
    )
    .join('');
  const signedHeaders = sortedKeys.join(';');

  const canonicalRequest = [
    'PUT',
    pathname,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signature = hmac(
    signingKey(secretKey, dateStamp, region, 's3'),
    stringToSign,
  ).toString('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    ...headers,
    Authorization: authorization,
  };
}

function encodeS3Key(key: string): string {
  return key
    .split('/')
    .map((seg) =>
      encodeURIComponent(seg).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    )
    .join('/');
}
