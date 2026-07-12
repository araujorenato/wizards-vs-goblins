import { TOTAL_ENEMIES } from './types'
import { cardValue, ENEMY_STATS } from './enemies'
import type { Card, EnemyRank, GameState } from './types'

export function effectiveEnemyAttack(state: GameState): number {
  const enemy = state.currentEnemy
  if (!enemy) return 0
  const stats = ENEMY_STATS[enemy.card.rank as EnemyRank]
  return Math.max(0, stats.attack - enemy.spadesShield)
}

export function enemyRemainingHealth(state: GameState): number {
  const enemy = state.currentEnemy
  if (!enemy) return 0
  const stats = ENEMY_STATS[enemy.card.rank as EnemyRank]
  return Math.max(0, stats.health - enemy.damageTaken)
}

export function enemiesDefeatedCount(state: GameState): number {
  // Total tiers (12) minus the current enemy and whatever's left undrawn.
  const undrawn = state.castleDeck.length
  const current = state.currentEnemy ? 1 : 0
  return TOTAL_ENEMIES - undrawn - current
}

export function spellsDeckCount(state: GameState): number {
  return state.spellsDeck.length
}

export function discardCount(state: GameState): number {
  return state.discardPile.length
}

export function topDiscardCard(state: GameState): Card | null {
  return state.discardPile[0] ?? null
}

export function handTotalValue(state: GameState): number {
  return state.hand.reduce((sum, c) => sum + cardValue(c.rank), 0)
}

export function protectionChargesAvailable(state: GameState): number {
  return state.protectionCharges.filter(Boolean).length
}

export function canUseProtectionNow(state: GameState): boolean {
  if (state.status !== 'playing') return false
  if (protectionChargesAvailable(state) === 0) return false
  return state.phase === 'awaiting_action' || state.phase === 'awaiting_defense'
}

/**
 * True if some selected card could be removed while the remaining total
 * still covers `amountRequired` — i.e. the player is discarding more than
 * necessary. Unavoidable overshoot (no subset hits the target exactly) is
 * NOT flagged, only genuinely redundant individual cards.
 */
export function hasRedundantDiscard(cards: Card[], amountRequired: number): boolean {
  const total = cards.reduce((sum, c) => sum + cardValue(c.rank), 0)
  if (total < amountRequired) return false
  return cards.some((c) => total - cardValue(c.rank) >= amountRequired)
}
