import { createConnection } from 'node:net'
import { getSocketPath } from '../state/config.js'

export type IpcCommand = 'pet' | 'stats' | 'mute' | 'quit'

export function sendCommand(command: IpcCommand): Promise<boolean> {
  return new Promise((resolve) => {
    const socketPath = getSocketPath()
    const timeout = setTimeout(() => {
      conn.destroy()
      resolve(false)
    }, 2000)

    const conn = createConnection(socketPath, () => {
      conn.end(JSON.stringify({ command }))
    })
    conn.on('data', () => {
      clearTimeout(timeout)
      resolve(true)
    })
    conn.on('error', () => {
      clearTimeout(timeout)
      resolve(false)
    })
  })
}
