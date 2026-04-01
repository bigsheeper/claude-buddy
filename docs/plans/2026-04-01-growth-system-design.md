# Growth System Design

**Date:** 2026-04-01
**Author:** Yihao Dai
**Status:** Approved

## Background

The current pet system is entirely static — once hatched, a pet never changes. Adding a growth system gives users a reason to keep interacting and creates a sense of progression.

## Goals

- Mixed-driven XP: time, interaction, and coding activity
- 20-level progression with meaningful unlocks at milestones
- Attribute growth, visual evolution, and content unlocks
- Persistent progress in config.json

## Non-Goals

- Multiplayer / leaderboards
- Microtransactions
- AI-driven growth (no LLM calls)

## XP Sources

| Source | XP | Cap |
|--------|-----|-----|
| Daily login (first launch) | +10 | 1x/day |
| Pet (touch) | +2 | 20 XP/day |
| View stats | +1 | 5 XP/day |
| git commit detected | +5 | uncapped |
| Terminal commands | +1 | per 10 commands |
| Consecutive days bonus | +5 × streak | resets on miss |

## Level System

- Formula: level N requires `N × 50` XP
- Total to max: ~10,500 XP (~2-3 months normal use)
- Levels 1-20

## Unlocks Per Level

| Level | Attribute Growth | Visual Change | Content Unlock |
|-------|-----------------|---------------|---------------|
| 1-4 | Base stats | Baby form (current sprites) | Base quip pool |
| 5 | All stats +5 | Teen form (tweaked sprites) | "Sleeping" animation |
| 10 | All stats +10 | Adult form (new sprites) | 3 new hats + new quip pack |
| 15 | All stats +15 | Elite form | "Dancing" animation + 3 new hats |
| 20 | All stats +20 | Legend form (glowing border) | All quips unlocked + title |
| Even levels | Peak stat +2 | — | 1 new quip each |

## Data Model

```typescript
type GrowthState = {
  xp: number
  level: number
  streak: number          // consecutive login days
  lastLoginDate: string   // YYYY-MM-DD
  dailyXp: {
    pet: number           // today's pet XP
    stats: number         // today's stats XP
    login: boolean        // already got daily login XP
  }
  totalCommits: number
  totalCommands: number
}
```

Stored in `~/.claude-buddy/config.json` alongside companion soul.

## Architecture

### XP Tracking (src/growth/)

- `growth.ts` — XP/level calculation, daily cap enforcement
- `activity.ts` — monitors git commits and terminal commands
- `evolution.ts` — maps level → stat bonuses, sprite form, unlocks

### Activity Monitoring

- **git commits**: periodic `git log --since` check (every 60s)
- **terminal commands**: count shell history file line growth (every 30s)
- Both run as background intervals in the Ink app

### Sprite Evolution

- Each species gets 4 visual forms: baby (1-4), teen (5-9), adult (10-14), elite (15-19), legend (20)
- For v1: baby = current sprites, teen/adult/elite/legend = minor ASCII tweaks (ears, size, decorations)
- Level-up triggers a special animation + speech bubble announcement

### New Animations

- **Sleeping** (level 5): zzZ floating above sprite, eyes replaced with `-`
- **Dancing** (level 15): 3-frame side-to-side bounce sequence

## Milestones

1. **M1**: GrowthState data model + XP/level logic + persistence
2. **M2**: Daily login, pet, stats XP tracking with caps
3. **M3**: Activity monitoring (git commits, terminal commands, streak)
4. **M4**: Attribute growth + level-up animation + speech bubble
5. **M5**: Sprite evolution (4 forms per species)
6. **M6**: New animations (sleeping, dancing) + new hats + expanded quips
