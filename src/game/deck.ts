import { shuffle } from './rng'
import type { Card, EnemyRank, NumberRank, Suit } from './types'

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export const NUMBER_RANKS: NumberRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10']
export const ENEMY_TIER_ORDER: EnemyRank[] = ['J', 'Q', 'K']

export function makeCard(rank: Card['rank'], suit: Suit): Card {
  return { id: `${rank}-${suit}`, rank, suit }
}

/**
 * Builds the Castle deck: each tier (Guards, then Champions, then Goblin
 * Kings) shuffled independently and concatenated, so tiers are always
 * fought in order but the 4 enemies within a tier are randomized per seed.
 */
export function buildCastleDeck(rngState: number): [Card[], number] {
  let state = rngState
  const tiers: Card[][] = []
  for (const rank of ENEMY_TIER_ORDER) {
    const tierCards = SUITS.map((suit) => makeCard(rank, suit))
    const [shuffled, nextState] = shuffle(tierCards, state)
    state = nextState
    tiers.push(shuffled)
  }
  return [tiers.flat(), state]
}

/** Builds the Spells deck: Ace-10 of all 4 suits (40 cards), shuffled. */
export function buildSpellsDeck(rngState: number): [Card[], number] {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (const rank of NUMBER_RANKS) {
      cards.push(makeCard(rank, suit))
    }
  }
  return shuffle(cards, rngState)
}
