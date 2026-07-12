import { describe, expect, it } from 'vitest'
import { hasRedundantDiscard } from '../selectors'
import { card } from './testUtils'

describe('hasRedundantDiscard', () => {
  it('is false when the total is below the requirement', () => {
    expect(hasRedundantDiscard([card('3', 'hearts')], 10)).toBe(false)
  })

  it('is false when no single card can be dropped without falling short', () => {
    // 7 + 8 = 15 >= 10, but neither card alone reaches 10.
    expect(hasRedundantDiscard([card('7', 'hearts'), card('8', 'diamonds')], 10)).toBe(false)
  })

  it('is true when a card could be removed and the rest still covers the requirement', () => {
    // 2 + 5 + 3 + 10 = 20; the 10 alone already covers a requirement of 10.
    const cards = [card('2', 'hearts'), card('5', 'diamonds'), card('3', 'clubs'), card('10', 'spades')]
    expect(hasRedundantDiscard(cards, 10)).toBe(true)
  })

  it('is false for a single card that exactly meets or exceeds the requirement', () => {
    expect(hasRedundantDiscard([card('10', 'spades')], 10)).toBe(false)
    expect(hasRedundantDiscard([card('10', 'spades')], 7)).toBe(false)
  })
})
