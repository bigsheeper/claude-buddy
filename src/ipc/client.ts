import { createConnection } from 'node:net'
import { getSocketPath } from '../state/config.js'

export function sendCommand(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socketPath = getSocketPath()
    const conn = createConnection(socketPath, () => {
      conn.end(JSON.stringify({ command }))
    })
    conn.on('data', () => {
      resolve(true)
    })
    conn.on('error', () => {
      resolve(false)
    })
  })
}
