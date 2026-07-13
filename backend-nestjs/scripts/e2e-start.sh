#!/usr/bin/env node
const { spawn, execSync } = require('child_process')
const net = require('net')
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

async function main() {
  const cwd = path.resolve(__dirname, '..')
  console.log('Starting dependencies (PostgreSQL + RustFS)...')
  execSync(`docker compose -f "${COMPOSE_FILE}" up -d`, { stdio: 'inherit' })
  console.log('Waiting for PostgreSQL...')
  await waitForPort(5432, '127.0.0.1')
  await waitForPgReady('127.0.0.1', 'greenalgeria')
  console.log('Waiting for RustFS...')
  await waitForPort(9000, '127.0.0.1')

  console.log('Creating schema and bucket...')
  execSync("docker exec green-algeria-db psql -U greenalgeria -d greenalgeria -c 'CREATE SCHEMA IF NOT EXISTS nestjs'", { stdio: 'inherit' })
  const bucket = spawn(process.execPath, ['scripts/create-bucket.mjs'], {
    cwd, stdio: 'inherit', shell: true,
    env: {
      OO_OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:9000',
      OO_OBJECT_STORAGE_BUCKET: 'e2e-test',
      OO_OBJECT_STORAGE_ACCESS_KEY: 'greenalgeria-access',
      OO_OBJECT_STORAGE_SECRET_KEY: 'greenalgeria-secret-change-me',
    },
  })
  await new Promise((resolve, reject) => {
    bucket.on('exit', code => code === 0 ? resolve() : reject(new Error(`Bucket creation failed with code ${code}`)))
    bucket.on('error', err => reject(err))
  })

  const safeEnv = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => !k.startsWith('npm_') && !k.startsWith('pnpm_'))
  )

  console.log('Running migrations...')
  const migration = spawn('pnpm migration:run', { cwd, stdio: 'inherit', shell: true, env: safeEnv })
  await new Promise((resolve, reject) => {
    migration.on('exit', code => code === 0 ? resolve() : reject(new Error(`Migration failed with code ${code}`)))
    migration.on('error', err => reject(err))
  })

  console.log('Seeding demo zones...')
  const seed = spawn('pnpm seed', { cwd, stdio: 'inherit', shell: true, env: safeEnv })
  await new Promise((resolve, reject) => {
    seed.on('exit', code => code === 0 ? resolve() : reject(new Error(`Seed failed with code ${code}`)))
    seed.on('error', err => reject(err))
  })

  console.log('Starting backend...')
  const server = spawn('pnpm start', {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: {
      ...safeEnv,
      CLIENT_URL: 'http://localhost:4173',
      OO_OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:9000',
      OO_OBJECT_STORAGE_BUCKET: 'e2e-test',
      OO_OBJECT_STORAGE_ACCESS_KEY: 'greenalgeria-access',
      OO_OBJECT_STORAGE_SECRET_KEY: 'greenalgeria-secret-change-me',
    },
  })
  server.on('exit', code => process.exit(code ?? 0))
}

main().catch(err => { console.error(err); process.exit(1) })
