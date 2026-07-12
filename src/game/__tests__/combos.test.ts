import { describe, expect, it } from 'vitest'
import { classifySelection } from '../combos'
import { card } from './testUtils'

describe('classifySelection', () => {
  it('accepts a single non-ace card', () => {
    const result = classifySelection([card('8', 'spades')])
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.attackValue).toBe(8)
      expect(result.suits).toEqual(['spades'])
    }
  })

  it('accepts a same-rank pair summing to 10 or less', () => {
    const result = classifySelection([card('5', 'spades'), card('5', 'diamonds')])
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.attackValue).toBe(10)
      expect(result.suits.sort()).toEqual(['diamonds', 'spades'])
    }
  })

  it('accepts a same-rank triple summing to 10 or less', () => {
    const result = classifySelection([card('3', 'spades'), card('3', 'diamonds'), card('3', 'clubs')])
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.attackValue).toBe(9)
  })

  it('accepts a same-rank quadruple summing to 10 or less', () => {
    const result = classifySelection([
      card('2', 'spades'),
      card('2', 'diamonds'),
      card('2', 'clubs'),
      card('2', 'hearts'),
    ])
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.attackValue).toBe(8)
  })

  it('rejects a same-rank pair summing above 10', () => {
    const result = classifySelection([card('6', 'spades'), card('6', 'diamonds')])
    expect(result.valid).toBe(false)
  })

  it('rejects mismatched ranks that are not an Ace pairing', () => {
    const result = classifySelection([card('8', 'spades'), card('9', 'diamonds')])
    expect(result.valid).toBe(false)
  })

  it('accepts an Ace played alone for 1 attack value', () => {
    const result = classifySelection([card('A', 'hearts')])
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.attackValue).toBe(1)
      expect(result.suits).toEqual(['hearts'])
    }
  })

  it('accepts an Ace paired with exactly one other card, adding +1', () => {
    const result = classifySelection([card('A', 'hearts'), card('8', 'diamonds')])
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.attackValue).toBe(9)
      expect(result.suits.sort()).toEqual(['diamonds', 'hearts'])
    }
  })

  it('accepts two Aces paired together for 2 attack value with both suit powers', () => {
    const result = classifySelection([card('A', 'hearts'), card('A', 'spades')])
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.attackValue).toBe(2)
      expect(result.suits.sort()).toEqual(['hearts', 'spades'])
    }
  })

  it('dedupes the suit power when an Ace pairs with a same-suit card', () => {
    const result = classifySelection([card('A', 'diamonds'), card('7', 'diamonds')])
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.attackValue).toBe(8)
      expect(result.suits).toEqual(['diamonds'])
    }
  })

  it('rejects an Ace combined with two or more other cards', () => {
    const result = classifySelection([card('A', 'hearts'), card('2', 'diamonds'), card('2', 'clubs')])
    expect(result.valid).toBe(false)
  })

  it('rejects a same-rank set combined with an unrelated extra card', () => {
    const result = classifySelection([card('2', 'spades'), card('2', 'diamonds'), card('3', 'clubs')])
    expect(result.valid).toBe(false)
  })

  it('rejects selections of more than 4 cards', () => {
    const result = classifySelection([
      card('2', 'spades'),
      card('2', 'diamonds'),
      card('2', 'clubs'),
      card('2', 'hearts'),
      card('3', 'spades'),
    ])
    expect(result.valid).toBe(false)
  })

  it('rejects an empty selection', () => {
    const result = classifySelection([])
    expect(result.valid).toBe(false)
  })

  it('treats a drawn Guard/Champion/Goblin King card as playable at its tier value', () => {
    const jack = classifySelection([card('J', 'spades')])
    const queen = classifySelection([card('Q', 'hearts')])
    const king = classifySelection([card('K', 'clubs')])
    expect(jack.valid && jack.attackValue).toBe(10)
    expect(queen.valid && queen.attackValue).toBe(15)
    expect(king.valid && king.attackValue).toBe(20)
  })
})
