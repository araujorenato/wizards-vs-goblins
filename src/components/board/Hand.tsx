import type { Card as CardModel } from '../../game/types'
import { Card } from './Card'
import './Hand.css'

interface HandProps {
  cards: CardModel[]
  selectedIds: string[]
  onToggle: (id: string) => void
  disabled?: boolean
  /** Lets a parent (Board) measure a hand card's on-screen position, e.g. to
   * fly a ghost clone from here to the discard pile when it's discarded. */
  registerSlotRef?: (id: string, el: HTMLDivElement | null) => void
}

export function Hand({ cards, selectedIds, onToggle, disabled, registerSlotRef }: HandProps) {
  const selected = new Set(selectedIds)

  return (
    <div className="hand" role="group" aria-label="Your hand of spells">
      {cards.map((c) => (
        <div className="hand__slot" key={c.id} ref={(el) => registerSlotRef?.(c.id, el)}>
          <Card
            card={c}
            selected={selected.has(c.id)}
            raised={selected.has(c.id)}
            onClick={disabled ? undefined : () => onToggle(c.id)}
          />
        </div>
      ))}
      {cards.length === 0 && <p className="hand__empty">Your hand is empty.</p>}
    </div>
  )
}
