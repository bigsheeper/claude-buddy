import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { StoredCompanion } from '../companion/types.js'
import type { GrowthState } from '../growth/types.js'

export interface BuddyConfig {
  companion?: StoredCompanion
  companionMuted?: boolean
  growth?: GrowthState
}

const CONFIG_DIR = join(homedir(), '.claude-buddy')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const SOCKET_PATH = join(CONFIG_DIR, 'buddy.sock')

export function getConfigDir(): string {
  return CONFIG_DIR
}

export function getSocketPath(): string {
  return SOCKET_PATH
}

export function getConfig(): BuddyConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch {
    // corrupted config, start fresh
  }
  return {}
}

export function saveConfig(config: BuddyConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n')
}
