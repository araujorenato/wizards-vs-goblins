import { describe, expect, it } from 'vitest'
import { hashSeed, nextRandom, shuffle } from '../rng'

describe('rng', () => {
  it('produces the same sequence for the same starting state', () => {
    const seedState = hashSeed('same-seed')
    const seq1: number[] = []
    const seq2: number[] = []
    let s1 = seedState
    let s2 = seedState
    for (let i = 0; i < 20; i++) {
      const [v1, n1] = nextRandom(s1)
      const [v2, n2] = nextRandom(s2)
      seq1.push(v1)
      seq2.push(v2)
      s1 = n1
      s2 = n2
    }
    expect(seq1).toEqual(seq2)
  })

  it('produces different sequences for different seeds', () => {
    const a = hashSeed('seed-a')
    const b = hashSeed('seed-b')
    const [va] = nextRandom(a)
    const [vb] = nextRandom(b)
    expect(va).not.toBe(vb)
  })

  it('hashSeed is deterministic for identical input strings', () => {
    expect(hashSeed('7196759210defdc0')).toBe(hashSeed('7196759210defdc0'))
  })

  it('shuffle is a permutation of the input (same elements, generally reordered)', () => {
    const input = Array.from({ length: 20 }, (_, i) => i)
    const [shuffled] = shuffle(input, hashSeed('shuffle-seed'))
    expect(shuffled.slice().sort((a, b) => a - b)).toEqual(input)
  })

  it('shuffle is deterministic for the same seed and reproduces the same order', () => {
    const input = Array.from({ length: 12 }, (_, i) => i)
    const seedState = hashSeed('deterministic-shuffle')
    const [shuffled1] = shuffle(input, seedState)
    const [shuffled2] = shuffle(input, seedState)
    expect(shuffled1).toEqual(shuffled2)
  })
})
