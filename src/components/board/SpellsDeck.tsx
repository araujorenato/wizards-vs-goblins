import { forwardRef } from 'react'
import { Card } from './Card'
import './Piles.css'

interface SpellsDeckProps {
  count: number
}

export const SpellsDeck = forwardRef<HTMLDivElement, SpellsDeckProps>(function SpellsDeck({ count }, ref) {
  return (
    <div className="pile">
      <div className="pile__label">
        Spells <span className="pile__count">{count}</span>
      </div>
      <div className="pile__stack" ref={ref}>
        <Card faceDown size="lg" />
      </div>
    </div>
  )
})
