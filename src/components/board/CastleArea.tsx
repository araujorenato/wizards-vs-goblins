import type { Ref } from 'react'
import type { EnemyInPlay, GameState } from '../../game/types'
import { effectiveEnemyAttack, enemyRemainingHealth } from '../../game/selectors'
import { Card } from './Card'
import { FlippableEnemyCard } from './FlippableEnemyCard'
import './CastleArea.css'

export interface FrozenEnemyDisplay {
  enemy: EnemyInPlay
  remainingHealth: number
  effectiveAttack: number
}

interface CastleAreaProps {
  state: GameState
  enemyCardRef?: Ref<HTMLDivElement>
  /** While set, shows this instead of state.currentEnemy (used to hold the
   * defeated enemy on screen during its exit animation). */
  frozenEnemy?: FrozenEnemyDisplay | null
  /** While true, visually hides the enemy slot (mid fly-away) WITHOUT
   * unmounting FlippableEnemyCard — unmounting would reset its internal
   * flip-trigger tracking and swallow the reveal flip that follows. */
  hideEnemy?: boolean
  /** Forwarded to FlippableEnemyCard — bumped by Board only when the next
   * enemy should actually flip into view (see FlippableEnemyCard). */
  flipTrigger?: number
}

export function CastleArea({ state, enemyCardRef, frozenEnemy, hideEnemy, flipTrigger = 0 }: CastleAreaProps) {
  const remainingBacks = Math.min(state.castleDeck.length, 3)

  const display: FrozenEnemyDisplay | null =
    frozenEnemy ??
    (state.currentEnemy
      ? {
          enemy: state.currentEnemy,
          remainingHealth: enemyRemainingHealth(state),
          effectiveAttack: effectiveEnemyAttack(state),
        }
      : null)

  return (
    <div className="castle-area">
      <div className="castle-area__stack">
        {Array.from({ length: remainingBacks }).map((_, i) => (
          <Card key={i} faceDown size="lg" className="castle-area__back" />
        ))}
        {display && (
          <div
            className="castle-area__enemy-wrap"
            ref={enemyCardRef}
            style={hideEnemy ? { visibility: 'hidden' } : undefined}
          >
            <FlippableEnemyCard
              enemy={display.enemy}
              remainingHealth={display.remainingHealth}
              effectiveAttack={display.effectiveAttack}
              flipTrigger={flipTrigger}
            />
          </div>
        )}
      </div>
    </div>
  )
}
