#!/usr/bin/env node
const { spawn, execSync } = require('child_process')
const net = require('net')
const http = require('http')
const path = require('path')

const COMPOSE_FILE = path.resolve(__dirname, '..', '..', 'config', 'docker-compose.dev.yml')

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

async function retryBucket(script, retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const out = spawn(process.execPath, [script], {
        stdio: 'inherit', shell: true,
        env: {
          OO_OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:9000',
          OO_OBJECT_STORAGE_BUCKET: 'green-algeria',
          OO_OBJECT_STORAGE_ACCESS_KEY: 'greenalgeria-access',
          OO_OBJECT_STORAGE_SECRET_KEY: 'greenalgeria-secret-change-me',
        },
      })
      await new Promise((resolve, reject) => {
        out.on('exit', code => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)))
        out.on('error', reject)
      })
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
  execSync(`docker compose -f "${COMPOSE_FILE}" up -d`, { stdio: 'inherit' })
  log('Waiting for PostgreSQL...')
  await waitForPort(5432, '127.0.0.1')
  await waitForPgReady('127.0.0.1', 'greenalgeria')
  log('Waiting for RustFS TCP...')
  await waitForPort(9000, '127.0.0.1')

  log('Waiting for RustFS HTTP...')
  await waitForRustfsHttp()
  log('Creating bucket...')
  const bucketScript = path.resolve(cwd, '..', 'backend-nestjs', 'scripts', 'create-bucket.mjs')
  await retryBucket(bucketScript)

  console.log('Starting Spring Boot backend...')
  const fs = require('fs')
  const jarDir = path.join(cwd, 'target')
  const jarFiles = fs.readdirSync(jarDir).filter(f => f.endsWith('.jar') && !f.includes('sources') && !f.includes('javadoc'))
  if (jarFiles.length === 0) {
    console.error('No JAR found in target/. Build the project first with: make build')
    process.exit(1)
  }
  console.log(`Found JAR: ${jarFiles[0]}`)
  const jarPath = path.join(jarDir, jarFiles[0])
  const server = spawn('java', ['-jar', jarPath, '--server.port=8081', '--app.cors.allowed-origins=http://localhost:3000,http://localhost:4173'], {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env },
  })
  server.on('exit', code => process.exit(code ?? 0))
}

main().catch(err => { console.error(err); process.exit(1) })
