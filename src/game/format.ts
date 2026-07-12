import type { Card, Suit } from './types'

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

export function formatCard(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`
}

export function suitLabel(suit: Suit): string {
  return suit.charAt(0).toUpperCase() + suit.slice(1)
}
