import type { EnemyRank, EnemyStats, Rank } from './types'

export const ENEMY_STATS: Record<EnemyRank, EnemyStats> = {
  J: { attack: 10, health: 20, displayName: 'Guard' },
  Q: { attack: 15, health: 30, displayName: 'Champion' },
  K: { attack: 20, health: 40, displayName: 'Goblin King' },
}

export function isEnemyRank(rank: Rank): rank is EnemyRank {
  return rank === 'J' || rank === 'Q' || rank === 'K'
}

export function enemyDisplayName(rank: EnemyRank): string {
  return ENEMY_STATS[rank].displayName
}

/**
 * The attack/discard value of a card. Regular number cards use their face
 * value, Aces are worth 1, and Guard/Champion/Goblin King cards drawn into
 * hand (via the exact-lethal reward) are worth their tier's base attack.
 */
export function cardValue(rank: Rank): number {
  if (rank === 'A') return 1
  if (isEnemyRank(rank)) return ENEMY_STATS[rank].attack
  return Number(rank)
}
