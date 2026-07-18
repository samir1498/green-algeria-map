#!/usr/bin/env node
const { spawn, execSync } = require('child_process')
const crypto = require('crypto')
const net = require('net')
const http = require('http')
const path = require('path')

const COMPOSE_FILE = path.resolve(__dirname, '..', '..', 'config', 'docker-compose.dev.yml')

function sha256(str) { return crypto.createHash('sha256').update(str).digest('hex') }
function hmac(key, str, encoding) { return crypto.createHmac('sha256', key).update(str).digest(encoding) }

async function s3CreateBucket(endpointUrl, bucket, accessKey, secretKey, region) {
  const url = new URL(endpointUrl)
  const service = 's3'
  const algorithm = 'AWS4-HMAC-SHA256'
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const canonicalUri = `/${bucket}`
  const canonicalQuerystring = ''
  const payloadHash = sha256('')
  const defaultPort = 80
  const port = url.port || defaultPort
  const hostHeader = port === defaultPort ? url.hostname : `${url.hostname}:${port}`
  const canonicalHeaders = `host:${hostHeader}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = [ 'PUT', canonicalUri, canonicalQuerystring, canonicalHeaders, signedHeaders, payloadHash ].join('\n')
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [ algorithm, amzDate, credentialScope, sha256(canonicalRequest) ].join('\n')
  const kDate = hmac(`AWS4${secretKey}`, dateStamp, 'buffer')
  const kRegion = hmac(kDate, region, 'buffer')
  const kService = hmac(kRegion, service, 'buffer')
  const kSigning = hmac(kService, 'aws4_request', 'buffer')
  const signature = hmac(kSigning, stringToSign, 'hex')
  const authHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  return new Promise((resolve, reject) => {
    let settled = false
    const opts = {
      hostname: url.hostname, port, path: canonicalUri, method: 'PUT',
      headers: { 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate, 'Authorization': authHeader, 'Content-Length': '0' },
    }
    const req = http.request(opts, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        if (settled) return
        settled = true
        if (res.statusCode === 200 || res.statusCode === 409) resolve()
        else reject(new Error(`Bucket creation failed: ${res.statusCode} ${body}`))
      })
    })
    req.setTimeout(10000, () => { if (settled) return; settled = true; req.destroy(); reject(new Error('timeout')) })
    req.on('error', err => { if (settled) return; settled = true; reject(err) })
    req.end()
  })
}

async function waitForPort(port, host, timeout = 120000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({ port, host }, resolve)
        socket.on('error', reject)
        socket.setTimeout(2000, () => { socket.destroy(); reject(new Error('timeout')) })
      })
      return
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error(`Timed out waiting for ${host}:${port}`)
}

function waitForPgReady(host, user, timeout = 120000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      execSync(`pg_isready -h ${host} -U ${user}`, { stdio: 'ignore' })
      return
    } catch {
      // not ready yet — wait then retry
    }
  }
  throw new Error(`Timed out waiting for PostgreSQL to accept connections`)
}

function log(msg) { process.stderr.write(msg + '\n') }

async function waitForRustfsHttp() {
  const start = Date.now()
  while (Date.now() - start < 30000) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:9000/', (res) => { res.resume(); resolve() })
        req.on('error', reject)
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')) })
      })
      return
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error('Timed out waiting for RustFS HTTP')
}

async function createBucketWithRetry(retries = 20, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await s3CreateBucket('http://127.0.0.1:9000', 'green-algeria', 'greenalgeria-access', 'greenalgeria-secret-change-me', 'us-east-1')
      log('Bucket "green-algeria" ready')
      return
    } catch (err) {
      if (i < retries - 1) {
        log(`Bucket creation attempt ${i + 1}/${retries} failed: ${err.message}, retrying...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
}

async function main() {
  const cwd = path.resolve(__dirname, '..')
  log('Starting dependencies (PostgreSQL + RustFS)...')
  execSync(`docker rm -f green-algeria-db green-algeria-rustfs 2>/dev/null; true`, { stdio: 'ignore' })
  execSync(`docker compose -f "${COMPOSE_FILE}" up -d`, { stdio: 'inherit' })
  log('Waiting for PostgreSQL...')
  await waitForPort(5432, '127.0.0.1')
  await waitForPgReady('127.0.0.1', 'greenalgeria')
  log('Waiting for RustFS TCP...')
  await waitForPort(9000, '127.0.0.1')

  log('Waiting for RustFS HTTP...')
  await waitForRustfsHttp()
  log('Creating bucket...')
  await createBucketWithRetry()

  log('Starting Spring Boot backend...')
  const fs = require('fs')
  const jarDir = path.join(cwd, 'target')
  const jarFiles = fs.readdirSync(jarDir).filter(f => f.endsWith('.jar') && !f.includes('sources') && !f.includes('javadoc'))
  if (jarFiles.length === 0) {
    log('No JAR found in target/. Build the project first with: make build')
    process.exit(1)
  }
  log(`Found JAR: ${jarFiles[0]}`)
  const jarPath = path.join(jarDir, jarFiles[0])
  const server = spawn('java', ['-jar', jarPath, '--server.port=8081', '--app.cors.allowed-origins=http://localhost:3000,http://localhost:4173'], {
    cwd, stdio: ['pipe', 'inherit', 'inherit'],
    env: { ...process.env, SPRING_FLYWAY_ENABLED: 'true', APP_REQUIRE_EMAIL_VERIFICATION: 'false' },
  })
  server.stdout?.on('data', d => process.stderr.write(d))
  server.on('exit', code => {
    log(`Java exited with code ${code}`)
    process.exit(code ?? 0)
  })
}

main().catch(err => { console.error(err); process.exit(1) })
