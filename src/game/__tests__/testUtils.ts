import { makeCard } from '../deck'
import type { Card, EnemyInPlay, GameState } from '../types'

export function card(rank: Card['rank'], suit: Card['suit']): Card {
  return makeCard(rank, suit)
}

export function makeState(overrides: Partial<GameState> = {}): GameState {
  const currentEnemy: EnemyInPlay | null =
    overrides.currentEnemy !== undefined
      ? overrides.currentEnemy
      : { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 }

  return {
    seed: 'test-seed',
    rngState: 987654321,
    castleDeck: [],
    currentEnemy,
    spellsDeck: [],
    battleArea: [],
    discardPile: [],
    hand: [],
    protectionCharges: [true, true],
    log: [],
    phase: 'awaiting_action',
    pendingDefense: null,
    status: 'playing',
    turnCount: 1,
    ...overrides,
  }
}

/** Strips non-deterministic event ids so two independently-produced logs can be deep-compared. */
export function normalizeLog(state: GameState) {
  return state.log.map(({ id: _id, ...rest }) => rest)
}
