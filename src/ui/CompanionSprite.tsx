import React, { useEffect, useState, useRef } from 'react'
import { Box, Text } from 'ink'
import type { Companion } from '../companion/types.js'
import { RARITY_COLORS } from '../companion/types.js'
import { renderSprite, spriteFrameCount } from '../companion/sprites.js'
import { SpeechBubble } from './SpeechBubble.js'
import type { GrowthForm } from '../growth/types.js'
import {
  applyFormDecoration,
  applySleepingOverlay,
  applyDancingOverlay,
} from '../growth/evolution.js'

const TICK_MS = 500
const BUBBLE_SHOW = 20   // ticks → ~10s
const FADE_WINDOW = 6    // last ~3s dims
const PET_BURST_MS = 2500
const SLEEP_AFTER_IDLE = 120 // ticks (~60s) of no reaction → sleeping

// Idle sequence: mostly rest (0), occasional fidget (1-2), rare blink (-1)
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0]
// Dancing sequence: bouncy side-to-side
const DANCE_SEQUENCE = [0, 1, 2, 1, 0, 2, 1, 0]

const H = '♥'
const PET_HEARTS = [
  `   ${H}    ${H}   `,
  `  ${H}  ${H}   ${H}  `,
  ` ${H}   ${H}  ${H}   `,
  `${H}  ${H}      ${H} `,
  '·    ·   ·  ',
]

interface CompanionSpriteProps {
  companion: Companion
  reaction: string | undefined
  petAt: number | undefined
  form?: GrowthForm
  level?: number
}

export function CompanionSprite({
  companion,
  reaction,
  petAt,
  form = 'baby',
  level = 1,
}: CompanionSpriteProps): React.ReactNode {
  const [tick, setTick] = useState(0)
  const lastSpokeTick = useRef(0)
  const lastActivityTick = useRef(0)
  const [petStartTick, setPetStartTick] = useState(0)
  const [forPetAt, setForPetAt] = useState(petAt)

  if (petAt !== forPetAt) {
    setPetStartTick(tick)
    setForPetAt(petAt)
    lastActivityTick.current = tick
  }

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (reaction) {
      lastSpokeTick.current = tick
      lastActivityTick.current = tick
    }
  }, [reaction])

  const color = RARITY_COLORS[companion.rarity]
  const legendColor = form === 'legend' ? 'yellow' : color
  const frameCount = spriteFrameCount(companion.species)
  const bubbleAge = reaction ? tick - lastSpokeTick.current : 0
  const fading = reaction !== undefined && bubbleAge >= BUBBLE_SHOW - FADE_WINDOW
  const petAge = petAt ? tick - petStartTick : Infinity
  const petting = petAge * TICK_MS < PET_BURST_MS
  const idleDuration = tick - lastActivityTick.current

  // Determine animation state
  const canSleep = level >= 5
  const canDance = level >= 15
  const isSleeping = canSleep && !reaction && !petting && idleDuration > SLEEP_AFTER_IDLE
  const isDancing = canDance && petting // dance while being petted at level 15+

  const heartFrame = petting ? PET_HEARTS[petAge % PET_HEARTS.length] : null

  let spriteFrame: number
  let blink = false

  if (isDancing) {
    spriteFrame = DANCE_SEQUENCE[tick % DANCE_SEQUENCE.length]! % frameCount
  } else if (reaction || petting) {
    spriteFrame = tick % frameCount
  } else if (isSleeping) {
    spriteFrame = 0 // still while sleeping
  } else {
    const step = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!
    if (step === -1) {
      spriteFrame = 0
      blink = true
    } else {
      spriteFrame = step % frameCount
    }
  }

  let body = renderSprite(companion, spriteFrame).map(line =>
    blink ? line.replaceAll(companion.eye, '-') : line,
  )

  // Apply evolution decorations
  body = applyFormDecoration(body, form, companion.eye, tick)

  // Apply special animations
  if (isSleeping) {
    body = applySleepingOverlay(body, companion.eye, tick)
  }
  if (isDancing) {
    body = applyDancingOverlay(body, tick)
  }

  const sprite = heartFrame ? [heartFrame, ...body] : body

  return (
    <Box flexDirection="column" alignItems="center">
      {reaction && bubbleAge < BUBBLE_SHOW && (
        <SpeechBubble text={reaction} color={legendColor} fading={fading} />
      )}
      {sprite.map((line, i) => (
        <Text key={i} color={i === 0 && heartFrame ? 'red' : legendColor}>
          {line}
        </Text>
      ))}
      <Text bold color={legendColor}>
        {companion.name}
      </Text>
    </Box>
  )
}
