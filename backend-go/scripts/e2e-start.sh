#!/usr/bin/env node
const { spawn, execSync } = require('child_process')
const net = require('net')
const path = require('path')
const fs = require('fs')

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
  const binaryPath = path.join(cwd, 'backend-go')

  if (!fs.existsSync(binaryPath)) {
    console.log('Building Go backend...')
    execSync('go build -ldflags="-s -w" -o backend-go ./cmd/api', { cwd, stdio: 'inherit' })
  }

  console.log('Starting Go backend on :8082...')
  const server = spawn(binaryPath, [], {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '8082' },
  })
  server.on('exit', code => process.exit(code ?? 0))
}

main().catch(err => { console.error(err); process.exit(1) })
