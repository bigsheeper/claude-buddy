export type GrowthState = {
  xp: number
  level: number
  streak: number
  lastLoginDate: string    // YYYY-MM-DD
  dailyXp: {
    pet: number
    stats: number
    login: boolean
  }
  totalCommits: number
  totalCommands: number
}

export type GrowthForm = 'baby' | 'teen' | 'adult' | 'elite' | 'legend'

export const MAX_LEVEL = 20

export const DAILY_CAPS = {
  pet: 20,
  stats: 5,
} as const

export const XP_VALUES = {
  dailyLogin: 10,
  pet: 2,
  viewStats: 1,
  gitCommit: 5,
  terminalCommands: 1, // per 10 commands
  streakBonus: 5,      // × streak days
} as const

export const EVOLUTION_LEVELS = {
  baby: 1,
  teen: 5,
  adult: 10,
  elite: 15,
  legend: 20,
} as const
