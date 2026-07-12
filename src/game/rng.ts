/**
 * Deterministic, dependency-free PRNG (mulberry32) implemented as pure
 * state-in/state-out functions so the RNG state can live inside GameState,
 * survive serialization (localStorage), and keep advancing for in-game
 * shuffles (e.g. the Hearts effect) — not just initial setup.
 */

export function nextRandom(state: number): [value: number, nextState: number] {
  const nextState = (state + 0x6d2b79f5) | 0
  let t = nextState
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return [value, nextState]
}

export function shuffle<T>(items: T[], state: number): [T[], number] {
  const result = items.slice()
  let s = state
  for (let i = result.length - 1; i > 0; i--) {
    const [rand, nextState] = nextRandom(s)
    s = nextState
    const j = Math.floor(rand * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return [result, s]
}

/** FNV-1a: hashes an arbitrary seed string (pasted or generated) into a 32-bit RNG seed. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Generates a fresh random 16-char hex seed string, e.g. "7196759210defdc0". */
export function generateHexSeed(): string {
  const bytes = new Uint32Array(2)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((n) => n.toString(16).padStart(8, '0'))
    .join('')
}
