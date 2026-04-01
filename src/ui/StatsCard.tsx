import React from 'react'
import { Box, Text } from 'ink'
import type { Companion } from '../companion/types.js'
import { RARITY_COLORS, RARITY_STARS, STAT_NAMES } from '../companion/types.js'
import type { GrowthState } from '../growth/types.js'
import { getForm, xpProgress, getStatBonus } from '../growth/growth.js'

interface StatsCardProps {
  companion: Companion
  growth: GrowthState
}

function statBar(value: number, bonus: number): string {
  const total = Math.min(100, value + bonus)
  const filled = Math.round(total / 5)
  const empty = 20 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

function xpBar(current: number, needed: number): string {
  if (needed === 0) return '████████████████████ MAX'
  const ratio = current / needed
  const filled = Math.round(ratio * 20)
  const empty = 20 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

export function StatsCard({ companion, growth }: StatsCardProps): React.ReactNode {
  const color = RARITY_COLORS[companion.rarity]
  const stars = RARITY_STARS[companion.rarity]
  const form = getForm(growth.level)
  const progress = xpProgress(growth)
  const bonuses = getStatBonus(growth.level)

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={color} paddingX={1}>
      <Text bold color={color}>
        {companion.name} {companion.shiny ? '✨' : ''}
      </Text>
      <Text dimColor>
        {companion.species} {stars} ({companion.rarity})
      </Text>
      <Text> </Text>
      <Text bold color="yellow">
        Lv.{growth.level} {form.toUpperCase()}
      </Text>
      <Text>
        <Text bold>{'XP'.padEnd(10)}</Text>
        <Text color="yellow">{xpBar(progress.current, progress.needed)}</Text>
        <Text> {progress.current}/{progress.needed}</Text>
      </Text>
      {growth.streak > 1 && (
        <Text dimColor>Streak: {growth.streak} days</Text>
      )}
      <Text> </Text>
      {STAT_NAMES.map(name => {
        const base = companion.stats[name]
        const bonus = bonuses[name]
        return (
          <Text key={name}>
            <Text bold>{name.padEnd(10)}</Text>
            <Text color={color}>{statBar(base, bonus)}</Text>
            <Text> {base}{bonus > 0 ? <Text color="green">+{bonus}</Text> : ''}</Text>
          </Text>
        )
      })}
      <Text> </Text>
      <Text dimColor>
        Hatched: {new Date(companion.hatchedAt).toLocaleDateString()}
      </Text>
    </Box>
  )
}
