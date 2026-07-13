import { SUIT_ICONS } from '../../game/format'
import type { EnemyInPlay } from '../../game/types'
import { getAnimDurationMs } from './animationUtils'
import { useCountdown } from './useCountdown'
import './EnemyCard.css'

interface EnemyCardProps {
  enemy: EnemyInPlay
  remainingHealth: number
  effectiveAttack: number
}

export function EnemyCard({ enemy, remainingHealth, effectiveAttack }: EnemyCardProps) {
  const countdownMs = getAnimDurationMs('--anim-health-countdown-duration', 800)
  const displayHealth = useCountdown(remainingHealth, enemy.card.id, countdownMs)
  const displayAttack = useCountdown(effectiveAttack, enemy.card.id, countdownMs)

  return (
    <div
      className={`enemy-card enemy-card--${enemy.card.rank}`}
      role="img"
      aria-label={`Enemy: ${remainingHealth} health, ${effectiveAttack} attack`}
    >
      <span className="enemy-card__health">{displayHealth}</span>
      <img className="enemy-card__suit" src={SUIT_ICONS[enemy.card.suit]} alt={enemy.card.suit} />
      <span className="enemy-card__attack">{displayAttack}</span>
    </div>
  )
}
