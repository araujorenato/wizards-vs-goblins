import type { Card, Rank, Suit } from './types'

const SUIT_ORDER: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANK_ORDER: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function suitIndex(suit: Suit): number {
  return SUIT_ORDER.indexOf(suit)
}

function rankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank)
}

export type HandSortMode = 'suit' | 'rank'

export function sortHand(cards: Card[], mode: HandSortMode): Card[] {
  const sorted = [...cards]
  if (mode === 'suit') {
    sorted.sort((a, b) => suitIndex(a.suit) - suitIndex(b.suit) || rankIndex(a.rank) - rankIndex(b.rank))
  } else {
    sorted.sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank) || suitIndex(a.suit) - suitIndex(b.suit))
  }
  return sorted
}
