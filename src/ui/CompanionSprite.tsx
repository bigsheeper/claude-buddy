import React, { useEffect, useState, useRef } from 'react'
import { Box, Text } from 'ink'
import type { Companion } from '../companion/types.js'
import { RARITY_COLORS } from '../companion/types.js'
import { renderSprite, spriteFrameCount } from '../companion/sprites.js'
import { SpeechBubble } from './SpeechBubble.js'

const TICK_MS = 500
const BUBBLE_SHOW = 20   // ticks → ~10s
const FADE_WINDOW = 6    // last ~3s dims
const PET_BURST_MS = 2500

// Idle sequence: mostly rest (0), occasional fidget (1-2), rare blink (-1)
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0]

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
}

export function CompanionSprite({ companion, reaction, petAt }: CompanionSpriteProps): React.ReactNode {
  const [tick, setTick] = useState(0)
  const lastSpokeTick = useRef(0)
  const [petStartTick, setPetStartTick] = useState(0)
  const [forPetAt, setForPetAt] = useState(petAt)

  if (petAt !== forPetAt) {
    setPetStartTick(tick)
    setForPetAt(petAt)
  }

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (reaction) lastSpokeTick.current = tick
  }, [reaction])

  const color = RARITY_COLORS[companion.rarity]
  const frameCount = spriteFrameCount(companion.species)
  const bubbleAge = reaction ? tick - lastSpokeTick.current : 0
  const fading = reaction !== undefined && bubbleAge >= BUBBLE_SHOW - FADE_WINDOW
  const petAge = petAt ? tick - petStartTick : Infinity
  const petting = petAge * TICK_MS < PET_BURST_MS

  const heartFrame = petting ? PET_HEARTS[petAge % PET_HEARTS.length] : null

  let spriteFrame: number
  let blink = false
  if (reaction || petting) {
    spriteFrame = tick % frameCount
  } else {
    const step = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!
    if (step === -1) {
      spriteFrame = 0
      blink = true
    } else {
      spriteFrame = step % frameCount
    }
  }

  const body = renderSprite(companion, spriteFrame).map(line =>
    blink ? line.replaceAll(companion.eye, '-') : line,
  )
  const sprite = heartFrame ? [heartFrame, ...body] : body

  return (
    <Box flexDirection="column" alignItems="center">
      {reaction && bubbleAge < BUBBLE_SHOW && (
        <SpeechBubble text={reaction} color={color} fading={fading} />
      )}
      {sprite.map((line, i) => (
        <Text key={i} color={i === 0 && heartFrame ? 'red' : color}>
          {line}
        </Text>
      ))}
      <Text bold color={color}>
        {companion.name}
      </Text>
    </Box>
  )
}
