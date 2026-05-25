#!/usr/bin/env node
const { spawn } = require('child_process')
const net = require('net')
const path = require('path')

async function waitForPort(port, host, timeout = 60000) {
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

async function main() {
  const cwd = path.resolve(__dirname, '..')
  console.log('Waiting for PostgreSQL...')
  await waitForPort(5432, 'localhost')

  console.log('Running migrations...')
  const migration = spawn('pnpm', ['migration:run'], { cwd, stdio: 'inherit', shell: true })
  await new Promise((resolve, reject) => {
    migration.on('exit', code => code === 0 ? resolve() : reject(new Error(`Migration failed with code ${code}`)))
    migration.on('error', err => reject(err))
  })

  console.log('Starting backend...')
  const server = spawn('pnpm', ['start'], {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, CLIENT_URL: 'http://localhost:4173' },
  })
  server.on('exit', code => process.exit(code ?? 0))
}

main().catch(err => { console.error(err); process.exit(1) })
