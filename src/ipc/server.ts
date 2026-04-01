import { createServer, type Socket } from 'node:net'
import { existsSync, unlinkSync } from 'node:fs'
import { getSocketPath } from '../state/config.js'
import { getState, setState } from '../state/state.js'

export function startIpcServer(): void {
  const socketPath = getSocketPath()

  // Clean up stale socket
  if (existsSync(socketPath)) {
    try { unlinkSync(socketPath) } catch { /* ignore */ }
  }

  const server = createServer((conn: Socket) => {
    let data = ''
    conn.on('data', chunk => {
      data += chunk.toString()
    })
    conn.on('end', () => {
      try {
        const msg = JSON.parse(data)
        handleCommand(msg)
        conn.end(JSON.stringify({ ok: true }))
      } catch {
        conn.end(JSON.stringify({ ok: false, error: 'invalid message' }))
      }
    })
  })

  server.listen(socketPath)

  // Cleanup on exit
  const cleanup = () => {
    try { server.close() } catch { /* ignore */ }
    try { unlinkSync(socketPath) } catch { /* ignore */ }
  }
  process.on('exit', cleanup)
  process.on('SIGINT', () => { cleanup(); process.exit(0) })
  process.on('SIGTERM', () => { cleanup(); process.exit(0) })
}

function handleCommand(msg: { command: string }): void {
  switch (msg.command) {
    case 'pet':
      setState({ petAt: Date.now() })
      break
    case 'stats':
      setState({ showStats: true })
      break
    case 'mute':
      setState({ muted: !getState().muted })
      break
  }
}
