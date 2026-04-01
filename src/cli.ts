import { execSync, spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { sendCommand } from './ipc/client.js'
import { getSocketPath, getConfigDir } from './state/config.js'

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
  const command = args[0] ?? 'install'

  if (command === 'install') {
    installAutostart()
    return
  }

  if (command === 'uninstall') {
    uninstallAutostart()
    return
  }

  // Direct IPC commands (no tmux needed)
  if (['pet', 'stats', 'mute'].includes(command)) {
    if (!isBuddyRunning()) {
      console.log('No buddy is running. Open a new terminal after install.')
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

  if (command === '_run') {
    // Internal: launched by the autostart snippet inside tmux
    await import('./main.js')
    return
  }

  console.log(`Usage: claude-buddy [command]

Commands:
  install     Auto-start buddy on every new terminal (default)
  uninstall   Remove auto-start
  stop        Close the buddy pane
  pet         Pet your buddy from another pane (♥)
  stats       Toggle stats display
  mute        Toggle speech bubbles`)
}

// ── Autostart ──────────────────────────────────────────────────────

const SHELL_MARKER_BEGIN = '# >>> claude-buddy autostart >>>'
const SHELL_MARKER_END = '# <<< claude-buddy autostart <<<'

function getShellRcPath(): string {
  const shell = process.env.SHELL ?? '/bin/zsh'
  if (shell.includes('zsh')) return join(homedir(), '.zshrc')
  if (shell.includes('bash')) return join(homedir(), '.bashrc')
  return join(homedir(), '.profile')
}

function getAutoStartSnippet(): string {
  const mainScript = join(__dirname, 'main.js')
  // This snippet:
  // 1. Only runs in interactive shells with node + tmux available
  // 2. If not in tmux: auto-enter tmux (new or existing session), then the
  //    tmux branch spawns the buddy pane. `exec` replaces the shell so
  //    closing tmux closes the terminal naturally.
  // 3. If in tmux: spawn buddy pane if not already running
  const lockFile = join(getConfigDir(), 'spawn.lock')
  return `${SHELL_MARKER_BEGIN}
# Auto-start claude-buddy companion
if [[ $- == *i* ]] && command -v node >/dev/null 2>&1 && command -v tmux >/dev/null 2>&1; then
  _claude_buddy_main="${mainScript}"
  _claude_buddy_lock="${lockFile}"
  _cb_ensure_buddy() {
    local sess="$1"
    # Pane title check — skip if buddy already exists
    if tmux list-panes -t "$sess" -F '#{pane_title}' 2>/dev/null | grep -q 'claude-buddy'; then
      return
    fi
    # Lock file prevents duplicate spawns from concurrent shells
    if [[ -f "$_claude_buddy_lock" ]]; then
      local age=$(( $(date +%s) - $(stat -f%m "$_claude_buddy_lock" 2>/dev/null || echo 0) ))
      [[ $age -lt 5 ]] && return
    fi
    touch "$_claude_buddy_lock" 2>/dev/null
    tmux split-window -t "$sess" -h -l 20 "node --enable-source-maps $_claude_buddy_main" 2>/dev/null
    sleep 0.5
    # Set title on the new (right) pane, then force focus to pane 0 (left/shell)
    tmux select-pane -t "$sess:.1" -T claude-buddy 2>/dev/null
    tmux select-pane -t "$sess:.0" 2>/dev/null
    rm -f "$_claude_buddy_lock" 2>/dev/null
  }
  if [[ -z "$TMUX" ]]; then
    # Not in tmux: create a fresh session per terminal window
    _cb_sess="cb-$$"
    tmux new-session -d -s "$_cb_sess" 2>/dev/null
    _cb_ensure_buddy "$_cb_sess"
    exec tmux attach -t "$_cb_sess"
  else
    # Already in tmux: ensure buddy in current session
    _cb_ensure_buddy "$(tmux display-message -p '#S')"
  fi
  unset _claude_buddy_main _claude_buddy_lock
  unset -f _cb_ensure_buddy
fi
${SHELL_MARKER_END}`
}

function installAutostart(): void {
  const rcPath = getShellRcPath()
  const rcName = rcPath.split('/').pop()

  // Check if already installed
  if (existsSync(rcPath)) {
    const content = readFileSync(rcPath, 'utf-8')
    if (content.includes(SHELL_MARKER_BEGIN)) {
      console.log(`Already installed in ~/${rcName}. Use 'claude-buddy uninstall' to remove.`)
      return
    }
  }

  const snippet = getAutoStartSnippet()
  appendFileSync(rcPath, '\n' + snippet + '\n')
  console.log(`Installed auto-start in ~/${rcName}`)
  console.log('')
  console.log('Every new terminal will now:')
  console.log('  1. Auto-enter tmux (session "main")')
  console.log('  2. Spawn a buddy pane on the right (36 cols)')
  console.log('')
  console.log(`Restart your terminal to see it. (or: source ~/${rcName})`)
}

function uninstallAutostart(): void {
  const rcPath = getShellRcPath()
  const rcName = rcPath.split('/').pop()

  if (!existsSync(rcPath)) {
    console.log(`No ~/${rcName} found.`)
    return
  }

  const content = readFileSync(rcPath, 'utf-8')
  if (!content.includes(SHELL_MARKER_BEGIN)) {
    console.log(`No claude-buddy autostart found in ~/${rcName}.`)
    return
  }

  const regex = new RegExp(
    `\\n?${SHELL_MARKER_BEGIN}[\\s\\S]*?${SHELL_MARKER_END}\\n?`,
  )
  const cleaned = content.replace(regex, '\n')
  writeFileSync(rcPath, cleaned)
  console.log(`Removed auto-start from ~/${rcName}`)
}

main().catch(console.error)
