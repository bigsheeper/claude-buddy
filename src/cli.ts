import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sendCommand } from './ipc/client.js'
import { getSocketPath } from './state/config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function hasTmux(): boolean {
  try {
    execSync('which tmux', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function isInTmux(): boolean {
  return !!process.env.TMUX
}

function isBuddyRunning(): boolean {
  return existsSync(getSocketPath())
}

function getBuddyPaneId(): string | null {
  try {
    const out = execSync(
      'tmux list-panes -a -F "#{pane_id} #{pane_title}" 2>/dev/null',
      { encoding: 'utf-8' },
    )
    for (const line of out.trim().split('\n')) {
      if (line.includes('claude-buddy')) return line.split(' ')[0]!
    }
  } catch { /* ignore */ }
  return null
}

function startBuddyPane(): void {
  const mainScript = join(__dirname, 'main.js')
  const cmd = `node --enable-source-maps ${mainScript}`

  if (!isInTmux()) {
    // Create new tmux session with buddy in a right pane
    console.log('Starting tmux session with your buddy...')
    execSync(
      `tmux new-session -d -s buddy-session -x $(tput cols) -y $(tput lines)`,
      { stdio: 'inherit' },
    )
    execSync(
      `tmux split-window -h -t buddy-session -l 36 -P '${cmd}'`,
      { stdio: 'pipe' },
    )
    execSync(
      `tmux select-pane -t buddy-session:.0 -T claude-buddy`,
      { stdio: 'pipe' },
    )
    // Attach to the session
    execSync('tmux attach -t buddy-session', { stdio: 'inherit' })
    return
  }

  // Already in tmux — just split a pane
  console.log('Spawning buddy pane...')
  execSync(`tmux split-window -h -l 36 '${cmd}'`, { stdio: 'pipe' })
  execSync(`tmux select-pane -t '{last}' -T claude-buddy`, { stdio: 'pipe' })
  // Focus back to the original pane
  execSync(`tmux select-pane -t '{previous}'`, { stdio: 'pipe' })
  console.log('Your buddy is alive! Press [h] in the buddy pane for help.')
}

function stopBuddy(): void {
  const paneId = getBuddyPaneId()
  if (paneId) {
    execSync(`tmux kill-pane -t ${paneId}`, { stdio: 'pipe' })
    console.log('Buddy pane closed.')
  } else if (isBuddyRunning()) {
    sendCommand('quit').then(() => console.log('Buddy stopped.'))
  } else {
    console.log('No buddy is running.')
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0] ?? 'start'

  // Direct IPC commands (no tmux needed)
  if (['pet', 'stats', 'mute'].includes(command)) {
    if (!isBuddyRunning()) {
      console.log('No buddy is running. Start one with: claude-buddy start')
      process.exit(1)
    }
    const ok = await sendCommand(command)
    if (ok) {
      console.log(command === 'pet' ? '♥ Petted!' : `Sent: ${command}`)
    } else {
      console.log('Failed to reach buddy.')
    }
    return
  }

  if (command === 'stop') {
    stopBuddy()
    return
  }

  if (command === 'start') {
    if (!hasTmux()) {
      console.log('tmux is required. Install with:')
      console.log('  macOS:  brew install tmux')
      console.log('  Ubuntu: sudo apt install tmux')
      process.exit(1)
    }

    if (isBuddyRunning()) {
      console.log('Buddy is already running! Use `claude-buddy pet` to interact.')
      return
    }

    startBuddyPane()
    return
  }

  if (command === 'run') {
    // Direct run (no tmux, used internally by tmux pane)
    await import('./main.js')
    return
  }

  console.log(`Usage: claude-buddy [start|stop|pet|stats|mute]

Commands:
  start   Launch buddy in a tmux pane (default)
  stop    Close the buddy pane
  pet     Pet your buddy (sends ♥)
  stats   Toggle stats display
  mute    Toggle speech bubbles
  run     Run directly (no tmux, for internal use)`)
}

main().catch(console.error)
