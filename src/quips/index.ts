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

export function getRandomQuip(companion: Companion): string {
  const { stats } = companion
  const pools: string[][] = [IDLE, IDLE] // base weight for idle

  if (stats.SNARK > 60) pools.push(SNARKY, SNARKY)
  else pools.push(SNARKY)

  if (stats.WISDOM > 60) pools.push(WISE, WISE)
  else pools.push(WISE)

  if (stats.PATIENCE > 60) pools.push(ENCOURAGEMENT, ENCOURAGEMENT)
  else pools.push(ENCOURAGEMENT)

  const pool = pools[Math.floor(Math.random() * pools.length)]!
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function getGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)]!
}
