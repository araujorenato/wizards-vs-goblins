import { useEffect, useRef, useState } from 'react'
import type { EnemyInPlay } from '../../game/types'
import { getAnimDurationMs } from './animationUtils'
import { EnemyCard } from './EnemyCard'
import './FlippableEnemyCard.css'

interface FlippableEnemyCardProps {
  enemy: EnemyInPlay
  remainingHealth: number
  effectiveAttack: number
  /**
   * Bumped by Board exactly once, at the moment the new enemy should be
   * revealed (after the defeated one has already finished flying off) —
   * NOT derived from `enemy.card.id` changing, since that identity swaps
   * internally (real enemy -> frozen defeated enemy -> real enemy again)
   * during the defeat choreography and would flip the wrong card.
   */
  flipTrigger: number
}

/**
 * Wraps EnemyCard with the reveal animation, played whenever `flipTrigger`
 * increases (skips the very first render, which just appears instantly):
 * scale up while still showing the back (0-25%), squash flat (25-50%, the
 * "flip" instant — this is when the face swaps), stretch back out now
 * showing the front (50-75%), then settle to normal size (75-100%). The
 * keyframes/timing live in FlippableEnemyCard.css under `--anim-flip-duration`.
 */
export function FlippableEnemyCard({ enemy, remainingHealth, effectiveAttack, flipTrigger }: FlippableEnemyCardProps) {
  const [showingFront, setShowingFront] = useState(true)
  const [animating, setAnimating] = useState(false)
  const prevTriggerRef = useRef(flipTrigger)

  useEffect(() => {
    if (flipTrigger === prevTriggerRef.current) return
    prevTriggerRef.current = flipTrigger

    const durationMs = getAnimDurationMs('--anim-flip-duration', 1200)

    setAnimating(false)
    setShowingFront(false)
    let rafA = 0
    let rafB = 0
    rafA = requestAnimationFrame(() => {
      rafB = requestAnimationFrame(() => setAnimating(true))
    })
    const midTimer = setTimeout(() => setShowingFront(true), durationMs / 2)
    const endTimer = setTimeout(() => setAnimating(false), durationMs)

    return () => {
      cancelAnimationFrame(rafA)
      cancelAnimationFrame(rafB)
      clearTimeout(midTimer)
      clearTimeout(endTimer)
    }
  }, [flipTrigger])

  return (
    <div className="flip-card">
      <div className={`flip-card__inner ${animating ? 'flip-card__inner--animating' : ''}`}>
        {showingFront ? (
          <EnemyCard enemy={enemy} remainingHealth={remainingHealth} effectiveAttack={effectiveAttack} />
        ) : (
          <div className="flip-card__back" />
        )}
      </div>
    </div>
  )
}
