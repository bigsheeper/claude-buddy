import type { Companion } from '../companion/types.js'

const GREETINGS = [
  'Hey there! Ready to code?',
  '*yawn* Oh, you\'re back!',
  'Let\'s build something cool!',
  'I missed you!',
  'Another day, another bug to squash!',
]

const IDLE = [
  '*stares at your code*',
  '*nods approvingly*',
  'Are you still thinking?',
  'I believe in you!',
  '*falls asleep briefly*',
  'Have you tried turning it off and on again?',
  'That\'s some clean code right there.',
  '*hums quietly*',
  'Remember to take breaks!',
  'Hydration check!',
  '*wiggles*',
  'You know what would be nice? A snack.',
]

const SNARKY = [
  'That\'s... a choice.',
  'I\'ve seen worse. Not much worse, but worse.',
  'Are you SURE about that?',
  'Bold strategy, let\'s see if it pays off.',
  'My CHAOS stat is tingling.',
  '*judges silently*',
  'Interesting approach... very interesting.',
]

const WISE = [
  'Small steps lead to big changes.',
  'Test first, debug less.',
  'Premature optimization is the root of all evil.',
  'Keep it simple.',
  'Read the error message. No, really read it.',
  'When in doubt, add more logs.',
]

const ENCOURAGEMENT = [
  'You\'ve got this!',
  'That last fix was brilliant!',
  'You\'re on fire today!',
  'Keep going, you\'re almost there!',
  'I\'m proud of you!',
  'Great progress!',
]

// Level 10+ quips
const IDLE_LV10 = [
  '*does a little stretch*',
  'I\'ve grown so much since we met.',
  'Remember when I was just a baby?',
  '*practices new hat poses*',
  'I can feel myself getting wiser.',
  'We make a great team, you know.',
]

const SNARKY_LV10 = [
  'I\'m too evolved for this.',
  'My teen self would\'ve let that slide. Not anymore.',
  'With age comes the right to judge harder.',
  '*adjusts hat condescendingly*',
]

const WISE_LV10 = [
  'Code is read more than it\'s written.',
  'The best debugging tool is a good night\'s sleep.',
  'Complexity is the enemy of reliability.',
  'Make it work, make it right, make it fast. In that order.',
  'Every expert was once a beginner.',
]

const ENCOURAGEMENT_LV10 = [
  'You\'ve leveled up too, you know.',
  'Look how far we\'ve come together!',
  'Your consistency is inspiring.',
  'That commit was chef\'s kiss.',
]

// Level 20 (legend) quips
const LEGEND = [
  'I have seen all the code. I am at peace.',
  '*radiates legendary aura*',
  'We are one with the terminal.',
  'There is no bug I fear.',
  'I have transcended mere debugging.',
  'The code flows through me.',
  '*glows magnificently*',
  'At max level, every day is a good day.',
]

export function getRandomQuip(companion: Companion, level = 1): string {
  const { stats } = companion
  const pools: string[][] = [IDLE, IDLE]

  if (stats.SNARK > 60) pools.push(SNARKY, SNARKY)
  else pools.push(SNARKY)

  if (stats.WISDOM > 60) pools.push(WISE, WISE)
  else pools.push(WISE)

  if (stats.PATIENCE > 60) pools.push(ENCOURAGEMENT, ENCOURAGEMENT)
  else pools.push(ENCOURAGEMENT)

  // Level-gated quips
  if (level >= 10) {
    pools.push(IDLE_LV10)
    pools.push(SNARKY_LV10)
    pools.push(WISE_LV10)
    pools.push(ENCOURAGEMENT_LV10)
  }

  if (level >= 20) {
    pools.push(LEGEND, LEGEND, LEGEND) // heavy weight for legend quips
  }

  const pool = pools[Math.floor(Math.random() * pools.length)]!
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function getGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)]!
}
