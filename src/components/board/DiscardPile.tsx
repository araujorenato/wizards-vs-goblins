import { forwardRef } from 'react'
import { topDiscardCard } from '../../game/selectors'
import type { GameState } from '../../game/types'
import { Card } from './Card'
import './Piles.css'

interface DiscardPileProps {
  state: GameState
}

export const DiscardPile = forwardRef<HTMLDivElement, DiscardPileProps>(function DiscardPile({ state }, ref) {
  const top = topDiscardCard(state)

  return (
    <div className="pile">
      <div className="pile__label">
        Used <span className="pile__count">{state.discardPile.length}</span>
      </div>
      <div className="pile__stack" ref={ref}>
        {top ? <Card card={top} size="lg" /> : <Card faceDown size="lg" dimmed />}
      </div>
    </div>
  )
})
