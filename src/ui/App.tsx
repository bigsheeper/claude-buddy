import React, { useEffect, useState } from 'react'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { getCompanion, hatchCompanion } from '../companion/companion.js'
import type { Companion } from '../companion/types.js'
import { getRandomQuip, getGreeting } from '../quips/index.js'
import { startIpcServer } from '../ipc/server.js'
import { subscribe, getState, setState } from '../state/state.js'
import { CompanionSprite } from './CompanionSprite.js'
import { StatsCard } from './StatsCard.js'
import type { GrowthState } from '../growth/types.js'
import {
  getGrowthState,
  saveGrowthState,
  grantDailyLogin,
  grantPetXp,
  grantStatsXp,
  grantCommitXp,
  grantCommandXp,
  getLevelUpMessage,
} from '../growth/growth.js'
import { countTodayCommits, countHistoryLines } from '../growth/activity.js'

const QUIP_MIN_MS = 30_000
const QUIP_MAX_MS = 120_000
const ACTIVITY_CHECK_MS = 60_000

function randomInterval(): number {
  return QUIP_MIN_MS + Math.random() * (QUIP_MAX_MS - QUIP_MIN_MS)
}

export function App(): React.ReactNode {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const rows = stdout?.rows ?? 24

  const [companion, setCompanion] = useState<Companion | undefined>(() => getCompanion())
  const [reaction, setReaction] = useState<string | undefined>(undefined)
  const [petAt, setPetAt] = useState<number | undefined>(undefined)
  const [showStats, setShowStats] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [growth, setGrowth] = useState<GrowthState>(() => getGrowthState())

  function handleLevelUp(state: GrowthState, leveled: boolean): void {
    if (leveled) {
      const msg = getLevelUpMessage(state.level)
      if (msg) setReaction(`Level UP! ${msg}`)
    }
    setGrowth({ ...state })
    saveGrowthState(state)
  }

  // Hatch on first run + daily login XP
  useEffect(() => {
    if (!companion) {
      const c = hatchCompanion()
      setCompanion(c)
      setReaction(getGreeting())
    } else {
      setReaction(getGreeting())
    }
    // Grant daily login XP
    const state = getGrowthState()
    const leveled = grantDailyLogin(state)
    handleLevelUp(state, leveled)
  }, [])

  // Start IPC server
  useEffect(() => {
    startIpcServer()
  }, [])

  // Subscribe to state changes (from IPC)
  useEffect(() => {
    return subscribe((s) => {
      if (s.petAt) {
        setPetAt(s.petAt)
        // Grant pet XP via IPC
        const state = getGrowthState()
        const leveled = grantPetXp(state)
        handleLevelUp(state, leveled)
      }
      if (s.showStats) {
        setShowStats(true)
        setState({ showStats: false })
        const state = getGrowthState()
        const leveled = grantStatsXp(state)
        handleLevelUp(state, leveled)
      }
      if (s.reaction) setReaction(s.reaction)
    })
  }, [])

  // Activity monitoring (git commits + terminal commands)
  useEffect(() => {
    const check = () => {
      const state = getGrowthState()
      let leveled = false
      const commits = countTodayCommits()
      if (commits > 0) leveled = grantCommitXp(state, commits) || leveled
      const commands = countHistoryLines()
      if (commands > 0) leveled = grantCommandXp(state, commands) || leveled
      if (leveled || state.xp !== growth.xp) {
        handleLevelUp(state, leveled)
      }
    }
    const timer = setInterval(check, ACTIVITY_CHECK_MS)
    check() // initial check
    return () => clearInterval(timer)
  }, [])

  // Periodic quips
  useEffect(() => {
    if (!companion) return
    let timer: ReturnType<typeof setTimeout>
    const scheduleQuip = () => {
      timer = setTimeout(() => {
        const state = getState()
        if (!state.muted) {
          setReaction(getRandomQuip(companion))
        }
        scheduleQuip()
      }, randomInterval())
    }
    scheduleQuip()
    return () => clearTimeout(timer)
  }, [companion])

  // Clear reaction after 10s
  useEffect(() => {
    if (!reaction) return
    const timer = setTimeout(() => setReaction(undefined), 10_000)
    return () => clearTimeout(timer)
  }, [reaction])

  // Keyboard input
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit()
      return
    }
    if (input === 'p') {
      setPetAt(Date.now())
      setReaction('*purrs happily*')
      const state = getGrowthState()
      const leveled = grantPetXp(state)
      handleLevelUp(state, leveled)
      return
    }
    if (input === 's') {
      setShowStats(v => !v)
      const state = getGrowthState()
      const leveled = grantStatsXp(state)
      handleLevelUp(state, leveled)
      return
    }
    if (input === 'm') {
      const muted = !getState().muted
      setState({ muted })
      setReaction(muted ? '*zips mouth*' : '*opens mouth wide*')
      return
    }
    if (input === 'h' || input === '?') {
      setShowHelp(v => !v)
      return
    }
  })

  if (!companion) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center">
        <Text>Hatching your companion...</Text>
      </Box>
    )
  }

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-end"
      minHeight={rows}
      width="100%"
    >
      {showStats && (
        <StatsCard companion={companion} growth={growth} />
      )}

      <Box flexGrow={1} />

      <CompanionSprite
        companion={companion}
        reaction={reaction}
        petAt={petAt}
      />

      <Box marginTop={1}>
        <Text dimColor>
          Lv.{growth.level} {showHelp
            ? '[p] pet  [s] stats  [m] mute  [h] help  [q] quit'
            : '[h] help'}
        </Text>
      </Box>
    </Box>
  )
}
