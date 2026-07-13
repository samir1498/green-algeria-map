import crypto from 'node:crypto'
import http from 'node:http'
import https from 'node:https'

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

function hmac(key, str, encoding) {
  return crypto.createHmac('sha256', key).update(str).digest(encoding)
}

async function createBucket(endpointUrl, bucket, accessKey, secretKey, region) {
  const url = new URL(endpointUrl)
  const service = 's3'
  const algorithm = 'AWS4-HMAC-SHA256'
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const canonicalUri = `/${bucket}`
  const canonicalQuerystring = ''
  const payloadHash = sha256('')
  const defaultPort = url.protocol === 'https:' ? 443 : 80
  const port = url.port || defaultPort
  const hostHeader = port === defaultPort ? url.hostname : `${url.hostname}:${port}`
  const canonicalHeaders = `host:${hostHeader}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join('\n')

  const kDate = hmac(`AWS4${secretKey}`, dateStamp, 'buffer')
  const kRegion = hmac(kDate, region, 'buffer')
  const kService = hmac(kRegion, service, 'buffer')
  const kSigning = hmac(kService, 'aws4_request', 'buffer')
  const signature = hmac(kSigning, stringToSign, 'hex')

  const authHeader =
    `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return new Promise((resolve, reject) => {
    let settled = false
    const opts = {
      hostname: url.hostname,
      port,
      path: canonicalUri,
      method: 'PUT',
      headers: {
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authHeader,
        'Content-Length': '0',
      },
    }
    const mod = url.protocol === 'https:' ? https : http
    const req = mod.request(opts, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (settled) return
        settled = true
        if (res.statusCode === 200 || res.statusCode === 409) {
          resolve()
        } else {
          reject(new Error(`Bucket creation failed: ${res.statusCode} ${body}`))
        }
      })
    })
    req.setTimeout(10000, () => {
      if (settled) return
      settled = true
      req.destroy()
      reject(new Error('Bucket creation request timed out'))
    })
    req.on('error', (err) => {
      if (settled) return
      settled = true
      reject(err)
    })
    req.end()
  })
}

const endpoint = process.env.OO_OBJECT_STORAGE_ENDPOINT
const bucket = process.env.OO_OBJECT_STORAGE_BUCKET
const accessKey = process.env.OO_OBJECT_STORAGE_ACCESS_KEY
const secretKey = process.env.OO_OBJECT_STORAGE_SECRET_KEY
const region = process.env.OO_OBJECT_STORAGE_REGION || 'us-east-1'

if (!endpoint || !bucket || !accessKey || !secretKey) {
  console.error(
    'Missing required env vars: OO_OBJECT_STORAGE_ENDPOINT, OO_OBJECT_STORAGE_BUCKET, OO_OBJECT_STORAGE_ACCESS_KEY, OO_OBJECT_STORAGE_SECRET_KEY'
  )
  process.exit(1)
}

async function createBucketWithRetry(maxRetries = 10, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await createBucket(endpoint, bucket, accessKey, secretKey, region)
      console.log(`Bucket "${bucket}" ready`)
      process.exit(0)
    } catch (err) {
      if (i < maxRetries - 1) {
        const msg = err.message.toLowerCase()
        const isTransient = msg.includes('503') || msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('socket') || msg.includes('hang')
        if (isTransient) {
          console.log(`RustFS not ready (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`)
          await new Promise(r => setTimeout(r, delay))
          continue
        }
      }
      console.error(err.message)
      process.exit(1)
    }
  }
}

createBucketWithRetry()
