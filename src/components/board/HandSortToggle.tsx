import type { HandSortMode } from '../../game/sorting'
import './HandSortToggle.css'

interface HandSortToggleProps {
  mode: HandSortMode
  onToggle: () => void
}

export function HandSortToggle({ mode, onToggle }: HandSortToggleProps) {
  return (
    <button type="button" className="hand-sort-toggle" onClick={onToggle}>
      {mode === 'suit' ? 'Sort by Rank' : 'Sort by Suit'}
    </button>
  )
}
