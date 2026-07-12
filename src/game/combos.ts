import { cardValue } from './enemies'
import type { Card } from './types'

export interface PlayShape {
  cards: Card[]
  attackValue: number
  suits: Card['suit'][]
}

export interface InvalidPlay {
  valid: false
  reason: string
}

export type PlayClassification = ({ valid: true } & PlayShape) | InvalidPlay

const invalid = (reason: string): InvalidPlay => ({ valid: false, reason })

/**
 * Classifies a hand selection into a legal play shape (single card, a
 * same-rank combo of 2-4 cards summing to <=10, or an Ace pairing with
 * exactly one other card), or reports why the selection is illegal.
 */
export function classifySelection(cards: Card[]): PlayClassification {
  if (cards.length === 0) return invalid('Select at least one spell to play.')
  if (cards.length > 4) return invalid('You can play at most 4 cards together.')

  const aces = cards.filter((c) => c.rank === 'A')

  if (cards.length === 1) {
    return finalize(cards)
  }

  if (cards.length === 2) {
    if (aces.length > 0) {
      // Ace paired with exactly one other card (which may itself be an Ace).
      return finalize(cards)
    }
    return classifyCombo(cards)
  }

  // 3 or 4 cards: Aces may never join a multi-card combo.
  if (aces.length > 0) {
    return invalid('An Ace can only be paired with exactly one other card.')
  }
  return classifyCombo(cards)
}

function classifyCombo(cards: Card[]): PlayClassification {
  const rank = cards[0].rank
  const sameRank = cards.every((c) => c.rank === rank)
  if (!sameRank) {
    return invalid('Combo cards must all share the same rank.')
  }
  const uniqueSuits = new Set(cards.map((c) => c.suit))
  if (uniqueSuits.size !== cards.length) {
    return invalid('You cannot select the same card twice.')
  }
  const total = cards.reduce((sum, c) => sum + cardValue(c.rank), 0)
  if (total > 10) {
    return invalid('Combo total value cannot exceed 10.')
  }
  return finalize(cards)
}

function finalize(cards: Card[]): PlayClassification {
  const attackValue = cards.reduce((sum, c) => sum + cardValue(c.rank), 0)
  const suits = Array.from(new Set(cards.map((c) => c.suit)))
  return { valid: true, cards, attackValue, suits }
}
