import React from 'react'
import { Box, Text } from 'ink'

function wrap(text: string, width: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (cur.length + w.length + 1 > width && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = cur ? `${cur} ${w}` : w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

interface SpeechBubbleProps {
  text: string
  color: string
  fading: boolean
}

export function SpeechBubble({ text, color, fading }: SpeechBubbleProps): React.ReactNode {
  const lines = wrap(text, 28)
  const borderColor = fading ? 'gray' : color

  return (
    <Box flexDirection="column" alignItems="center">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={borderColor}
        paddingX={1}
        width={32}
      >
        {lines.map((l, i) => (
          <Text key={i} italic dimColor={!fading} color={fading ? 'gray' : undefined}>
            {l}
          </Text>
        ))}
      </Box>
      <Text color={borderColor}>╲</Text>
    </Box>
  )
}
