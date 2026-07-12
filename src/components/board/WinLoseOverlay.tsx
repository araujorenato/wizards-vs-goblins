import type { GameState } from '../../game/types'
import './WinLoseOverlay.css'

interface WinLoseOverlayProps {
  state: GameState
  onNewGame: () => void
}

export function WinLoseOverlay({ state, onNewGame }: WinLoseOverlayProps) {
  if (state.status === 'playing') return null

  const isWin = state.status === 'won'

  return (
    <div className="overlay" role="alertdialog" aria-modal="true">
      <div className="overlay__panel">
        <h2 className="overlay__title">{isWin ? 'Victory' : 'Defeat'}</h2>
        <p className="overlay__subtitle">
          {isWin
            ? `You have defeated the Goblin King. ${state.victoryTier?.toUpperCase()} VICTORY.`
            : 'The wizard has fallen. The goblins reign on.'}
        </p>
        <button type="button" className="overlay__button" onClick={onNewGame}>
          New Game
        </button>
      </div>
    </div>
  )
}
