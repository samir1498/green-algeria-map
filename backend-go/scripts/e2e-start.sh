#!/usr/bin/env node
const { spawn, execSync } = require('child_process')
const net = require('net')
const path = require('path')
const fs = require('fs')

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

async function main() {
  const cwd = path.resolve(__dirname, '..')
  const binaryPath = path.join(cwd, 'backend-go')

  console.log('Starting dependencies (PostgreSQL + RustFS)...')
  execSync(`docker compose -f "${COMPOSE_FILE}" up -d`, { stdio: 'inherit' })

  console.log('Waiting for PostgreSQL...')
  await waitForPort(5432, '127.0.0.1')
  await waitForPgReady('127.0.0.1', 'greenalgeria')

  console.log('Waiting for RustFS...')
  await waitForPort(9000, '127.0.0.1')

  console.log('Creating bucket...')
  const bucketScript = path.resolve(cwd, '..', 'backend-nestjs', 'scripts', 'create-bucket.mjs')
  const bucket = spawn(process.execPath, [bucketScript], {
    stdio: 'inherit',
    shell: true,
    env: {
      OO_OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
      OO_OBJECT_STORAGE_BUCKET: 'green-algeria',
      OO_OBJECT_STORAGE_ACCESS_KEY: 'greenalgeria-access',
      OO_OBJECT_STORAGE_SECRET_KEY: 'greenalgeria-secret-change-me',
    },
  })
  await new Promise((resolve, reject) => {
    bucket.on('exit', code => code === 0 ? resolve() : reject(new Error(`Bucket creation failed with code ${code}`)))
    bucket.on('error', err => reject(err))
  })

  const DATABASE_NAME = 'greenalgeria_go'
  const PG_ENV = { ...process.env, PGPASSWORD: 'greenalgeria' }
  const databaseURL = `postgresql://greenalgeria:greenalgeria@localhost:5432/${DATABASE_NAME}`

  console.log('Creating database...')
  execSync(`psql -h localhost -U greenalgeria -d postgres -c "CREATE DATABASE ${DATABASE_NAME}" 2>/dev/null; true`, { env: PG_ENV })

  console.log('Running schema...')
  execSync(`psql -h localhost -U greenalgeria -d ${DATABASE_NAME} -f scripts/schema.go.sql`, { cwd, stdio: 'inherit', env: PG_ENV })

  console.log('Building Go backend...')
  execSync('go build -ldflags="-s -w" -o backend-go ./cmd/api', { cwd, stdio: 'inherit' })

  console.log('Starting Go backend on :8082...')
  const server = spawn(binaryPath, [], {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '8082',
      STORE_TYPE: 'postgres',
      DATABASE_URL: databaseURL,
      AUTH_SECRET: 'e2e-test-secret-do-not-use-in-production',
      DISABLE_RATE_LIMIT: 'true',
    },
  })
  server.on('exit', code => process.exit(code ?? 0))
}

main().catch(err => { console.error(err); process.exit(1) })