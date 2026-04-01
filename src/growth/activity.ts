import { execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Count total git commits today across all repos
export function countTodayCommits(): number {
  try {
    const out = execSync(
      'git log --all --oneline --since="00:00" --author="$(git config user.name)" 2>/dev/null | wc -l',
      { encoding: 'utf-8', cwd: homedir(), stdio: ['pipe', 'pipe', 'pipe'] },
    )
    return parseInt(out.trim(), 10) || 0
  } catch {
    return 0
  }
}

// Count shell history lines as proxy for terminal command activity
export function countHistoryLines(): number {
  const shell = process.env.SHELL ?? '/bin/zsh'
  let histFile: string
  if (shell.includes('zsh')) {
    histFile = process.env.HISTFILE ?? join(homedir(), '.zsh_history')
  } else {
    histFile = join(homedir(), '.bash_history')
  }

  try {
    if (!existsSync(histFile)) return 0
    const stat = statSync(histFile)
    // Use file size as rough proxy (avoids reading entire file)
    return Math.floor(stat.size / 50) // ~50 bytes per command average
  } catch {
    return 0
  }
}
