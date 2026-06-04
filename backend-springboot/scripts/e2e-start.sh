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

  console.log('Starting Spring Boot backend...')
  const server = spawn('make', ['dev', '-s'], {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      SERVER_PORT: '8081',
      APP_CORS_ALLOWED_ORIGINS: process.env.APP_CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:4173',
      SPRING_PROFILES_ACTIVE: process.env.SPRING_PROFILES_ACTIVE ?? 'e2e',
    },
  })
  server.on('exit', code => process.exit(code ?? 0))
}

main().catch(err => { console.error(err); process.exit(1) })
