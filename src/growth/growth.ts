import { getConfig, saveConfig } from '../state/config.js'
import type { StatName } from '../companion/types.js'
import { STAT_NAMES } from '../companion/types.js'
import {
  type GrowthState,
  type GrowthForm,
  MAX_LEVEL,
  DAILY_CAPS,
  XP_VALUES,
  EVOLUTION_LEVELS,
} from './types.js'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function freshDailyXp(): GrowthState['dailyXp'] {
  return { pet: 0, stats: 0, login: false }
}

export function defaultGrowthState(): GrowthState {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastLoginDate: '',
    dailyXp: freshDailyXp(),
    totalCommits: 0,
    totalCommands: 0,
  }
}

export function getGrowthState(): GrowthState {
  const config = getConfig()
  return config.growth ?? defaultGrowthState()
}

export function saveGrowthState(state: GrowthState): void {
  const config = getConfig()
  config.growth = state
  saveConfig(config)
}

// XP required to reach level N (from level N-1)
export function xpForLevel(level: number): number {
  return level * 50
}

// Total XP required from 0 to reach level N
export function totalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i <= level; i++) total += xpForLevel(i)
  return total
}

// XP progress within current level (0 to xpForLevel(level+1))
export function xpProgress(state: GrowthState): { current: number; needed: number } {
  if (state.level >= MAX_LEVEL) return { current: 0, needed: 0 }
  const prevTotal = totalXpForLevel(state.level)
  const needed = xpForLevel(state.level + 1)
  const current = state.xp - prevTotal
  return { current: Math.max(0, current), needed }
}

function checkLevelUp(state: GrowthState): boolean {
  if (state.level >= MAX_LEVEL) return false
  const threshold = totalXpForLevel(state.level + 1)
  if (state.xp >= threshold) {
    state.level++
    return true
  }
  return false
}

function ensureToday(state: GrowthState): void {
  const t = today()
  if (state.lastLoginDate !== t) {
    // Check streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    if (state.lastLoginDate === yesterdayStr) {
      state.streak++
    } else if (state.lastLoginDate !== t) {
      state.streak = 1
    }
    state.lastLoginDate = t
    state.dailyXp = freshDailyXp()
  }
}

// Returns true if leveled up
export function grantDailyLogin(state: GrowthState): boolean {
  ensureToday(state)
  if (state.dailyXp.login) return false
  state.dailyXp.login = true
  state.xp += XP_VALUES.dailyLogin
  // Streak bonus
  if (state.streak > 1) {
    state.xp += XP_VALUES.streakBonus * state.streak
  }
  return checkLevelUp(state)
}

export function grantPetXp(state: GrowthState): boolean {
  ensureToday(state)
  if (state.dailyXp.pet >= DAILY_CAPS.pet) return false
  state.dailyXp.pet += XP_VALUES.pet
  state.xp += XP_VALUES.pet
  return checkLevelUp(state)
}

export function grantStatsXp(state: GrowthState): boolean {
  ensureToday(state)
  if (state.dailyXp.stats >= DAILY_CAPS.stats) return false
  state.dailyXp.stats += XP_VALUES.viewStats
  state.xp += XP_VALUES.viewStats
  return checkLevelUp(state)
}

export function grantCommitXp(state: GrowthState, count: number): boolean {
  const newCommits = count - state.totalCommits
  if (newCommits <= 0) return false
  state.totalCommits = count
  state.xp += newCommits * XP_VALUES.gitCommit
  return checkLevelUp(state)
}

export function grantCommandXp(state: GrowthState, count: number): boolean {
  const newCommands = count - state.totalCommands
  if (newCommands < 10) return false
  const batches = Math.floor(newCommands / 10)
  state.totalCommands = state.totalCommands + batches * 10
  state.xp += batches * XP_VALUES.terminalCommands
  return checkLevelUp(state)
}

export function getForm(level: number): GrowthForm {
  if (level >= EVOLUTION_LEVELS.legend) return 'legend'
  if (level >= EVOLUTION_LEVELS.elite) return 'elite'
  if (level >= EVOLUTION_LEVELS.adult) return 'adult'
  if (level >= EVOLUTION_LEVELS.teen) return 'teen'
  return 'baby'
}

// Stat bonuses based on level
export function getStatBonus(level: number): Record<StatName, number> {
  const bonus = {} as Record<StatName, number>
  let base = 0
  if (level >= 20) base = 20
  else if (level >= 15) base = 15
  else if (level >= 10) base = 10
  else if (level >= 5) base = 5

  // Peak stat gets extra +2 per even level
  const peakBonus = Math.floor(level / 2) * 2

  for (const name of STAT_NAMES) {
    bonus[name] = base
  }
  // Peak stat bonus applied in companion.ts where peak is known
  return bonus
}

export function getLevelUpMessage(level: number): string | null {
  switch (level) {
    case 5: return 'Evolved to Teen form! Sleeping animation unlocked!'
    case 10: return 'Evolved to Adult form! New hats unlocked!'
    case 15: return 'Evolved to Elite form! Dancing animation unlocked!'
    case 20: return 'MAX LEVEL! Legendary form achieved!'
    default:
      if (level % 2 === 0) return `Level ${level}! New quip unlocked!`
      return `Level ${level}!`
  }
}
