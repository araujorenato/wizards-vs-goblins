import { describe, expect, it } from 'vitest'
import { sortHand } from '../sorting'
import { card } from './testUtils'

describe('sortHand', () => {
  const hand = [card('10', 'spades'), card('2', 'hearts'), card('A', 'diamonds'), card('5', 'clubs')]

  it('sorts by suit first (spades, hearts, diamonds, clubs), then by rank', () => {
    const sorted = sortHand(hand, 'suit')
    expect(sorted.map((c) => `${c.rank}-${c.suit}`)).toEqual(['10-spades', '2-hearts', 'A-diamonds', '5-clubs'])
  })

  it('sorts by rank first (A,2..10,J,Q,K), then by suit', () => {
    const sorted = sortHand(hand, 'rank')
    expect(sorted.map((c) => `${c.rank}-${c.suit}`)).toEqual(['A-diamonds', '2-hearts', '5-clubs', '10-spades'])
  })

  it('does not mutate the original array', () => {
    const original = [...hand]
    sortHand(hand, 'rank')
    expect(hand).toEqual(original)
  })

  it('breaks ties within the same suit by rank order', () => {
    const sameSuit = [card('K', 'spades'), card('3', 'spades'), card('A', 'spades')]
    expect(sortHand(sameSuit, 'suit').map((c) => c.rank)).toEqual(['A', '3', 'K'])
  })

  it('breaks ties within the same rank by suit order', () => {
    const sameRank = [card('7', 'clubs'), card('7', 'spades'), card('7', 'hearts')]
    expect(sortHand(sameRank, 'rank').map((c) => c.suit)).toEqual(['spades', 'hearts', 'clubs'])
  })
})
