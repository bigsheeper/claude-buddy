import React from 'react'
import { Box, Text } from 'ink'
import type { Companion } from '../companion/types.js'
import { RARITY_COLORS, RARITY_STARS, STAT_NAMES } from '../companion/types.js'

interface StatsCardProps {
  companion: Companion
}

function statBar(value: number): string {
  const filled = Math.round(value / 5)
  const empty = 20 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

export function StatsCard({ companion }: StatsCardProps): React.ReactNode {
  const color = RARITY_COLORS[companion.rarity]
  const stars = RARITY_STARS[companion.rarity]

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={color} paddingX={1}>
      <Text bold color={color}>
        {companion.name} {companion.shiny ? '✨' : ''}
      </Text>
      <Text dimColor>
        {companion.species} {stars} ({companion.rarity})
      </Text>
      <Text> </Text>
      {STAT_NAMES.map(name => (
        <Text key={name}>
          <Text bold>{name.padEnd(10)}</Text>
          <Text color={color}>{statBar(companion.stats[name])}</Text>
          <Text> {companion.stats[name]}</Text>
        </Text>
      ))}
      <Text> </Text>
      <Text dimColor>
        Hatched: {new Date(companion.hatchedAt).toLocaleDateString()}
      </Text>
    </Box>
  )
}
