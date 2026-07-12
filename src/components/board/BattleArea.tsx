import { forwardRef } from 'react'
import type { Card as CardModel } from '../../game/types'
import { Card } from './Card'
import './BattleArea.css'

interface BattleAreaProps {
  groups: CardModel[][]
}

export const BattleArea = forwardRef<HTMLDivElement, BattleAreaProps>(function BattleArea({ groups }, ref) {
  return (
    <div className="battle-area" ref={ref}>
      {groups.map((group, i) => (
        <div className="battle-area__group" key={i}>
          {group.map((c) => (
            <Card key={c.id} card={c} size="sm" />
          ))}
        </div>
      ))}
    </div>
  )
})
