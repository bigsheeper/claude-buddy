import React, { useEffect, useState, useCallback } from 'react'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { getCompanion, hatchCompanion } from '../companion/companion.js'
import type { Companion } from '../companion/types.js'
import { getRandomQuip, getGreeting } from '../quips/index.js'
import { startIpcServer } from '../ipc/server.js'
import { subscribe, getState, setState } from '../state/state.js'
import { CompanionSprite } from './CompanionSprite.js'
import { StatsCard } from './StatsCard.js'

const QUIP_MIN_MS = 30_000
const QUIP_MAX_MS = 120_000

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

  // Hatch on first run
  useEffect(() => {
    if (!companion) {
      const c = hatchCompanion()
      setCompanion(c)
      setReaction(getGreeting())
    } else {
      setReaction(getGreeting())
    }
  }, [])

  // Start IPC server
  useEffect(() => {
    startIpcServer()
  }, [])

  // Subscribe to state changes (from IPC)
  useEffect(() => {
    return subscribe((s) => {
      if (s.petAt) setPetAt(s.petAt)
      if (s.showStats) {
        setShowStats(true)
        setState({ showStats: false })
      }
      if (s.reaction) setReaction(s.reaction)
    })
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
      return
    }
    if (input === 's') {
      setShowStats(v => !v)
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
      height={rows}
    >
      {showStats && (
        <StatsCard companion={companion} />
      )}

      <Box flexGrow={1} />

      <CompanionSprite
        companion={companion}
        reaction={reaction}
        petAt={petAt}
      />

      <Box marginTop={1}>
        {showHelp ? (
          <Box flexDirection="column" alignItems="center">
            <Text dimColor>[p] pet  [s] stats  [m] mute  [h] help  [q] quit</Text>
          </Box>
        ) : (
          <Text dimColor>[h] help</Text>
        )}
      </Box>
    </Box>
  )
}
