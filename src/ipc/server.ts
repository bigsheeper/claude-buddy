import { createServer, type Socket } from 'node:net'
import { existsSync, unlinkSync } from 'node:fs'
import { getSocketPath } from '../state/config.js'
import { getState, setState } from '../state/state.js'

type IpcCommand = 'pet' | 'stats' | 'mute' | 'quit'

export function startIpcServer(): void {
  const socketPath = getSocketPath()

  // Clean up stale socket
  if (existsSync(socketPath)) {
    try { unlinkSync(socketPath) } catch { /* ignore */ }
  }

  const server = createServer((conn: Socket) => {
    let data = ''

    // Per-connection timeout to prevent hanging connections
    const timeout = setTimeout(() => conn.destroy(), 5000)

    conn.on('data', chunk => {
      data += chunk.toString()
      if (data.length > 10_000) {
        conn.end(JSON.stringify({ ok: false, error: 'message too large' }))
      }
    })
    conn.on('end', () => {
      clearTimeout(timeout)
      try {
        if (!data) {
          conn.end(JSON.stringify({ ok: false, error: 'empty message' }))
          return
        }
        const msg = JSON.parse(data)
        if (typeof msg.command !== 'string') {
          conn.end(JSON.stringify({ ok: false, error: 'invalid command' }))
          return
        }
        handleCommand(msg.command as IpcCommand)
        conn.end(JSON.stringify({ ok: true }))
      } catch {
        conn.end(JSON.stringify({ ok: false, error: 'parse error' }))
      }
    })
  })

  server.listen(socketPath)

  // Cleanup on exit (guard against double-cleanup)
  let cleanedUp = false
  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    try { server.close() } catch { /* ignore */ }
    try { unlinkSync(socketPath) } catch { /* ignore */ }
  }
  process.on('exit', cleanup)
  process.on('SIGINT', () => { cleanup(); process.exit(0) })
  process.on('SIGTERM', () => { cleanup(); process.exit(0) })
}

function handleCommand(command: IpcCommand): void {
  switch (command) {
    case 'pet':
      setState({ petAt: Date.now() })
      break
    case 'stats':
      setState({ showStats: true })
      break
    case 'mute':
      setState({ muted: !getState().muted })
      break
    case 'quit':
      process.exit(0)
      break
  }
}
