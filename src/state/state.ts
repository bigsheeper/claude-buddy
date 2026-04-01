export interface BuddyState {
  reaction: string | undefined
  petAt: number | undefined
  showStats: boolean
  muted: boolean
}

let state: BuddyState = {
  reaction: undefined,
  petAt: undefined,
  showStats: false,
  muted: false,
}

type Listener = (state: BuddyState) => void
const listeners = new Set<Listener>()

export function getState(): BuddyState {
  return state
}

export function setState(partial: Partial<BuddyState>): void {
  state = { ...state, ...partial }
  for (const fn of listeners) fn(state)
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
