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
  const fs = require('fs')
  const jarDir = path.join(cwd, 'target')
  const jarFiles = fs.readdirSync(jarDir).filter(f => f.endsWith('.jar') && !f.includes('sources') && !f.includes('javadoc'))
  if (jarFiles.length === 0) {
    console.error('No JAR found in target/. Build the project first with: make build')
    process.exit(1)
  }
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
