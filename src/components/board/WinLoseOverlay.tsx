import { useEffect, useRef } from 'react'
import type { GameState } from '../../game/types'
import { trackEvent } from '../../lib/analytics'
import './WinLoseOverlay.css'

interface WinLoseOverlayProps {
  state: GameState
  onNewGame: () => void
}

export function WinLoseOverlay({ state, onNewGame }: WinLoseOverlayProps) {
  const trackedStatus = useRef<GameState['status'] | null>(null)

  useEffect(() => {
    if (state.status === trackedStatus.current) return
    trackedStatus.current = state.status

    if (state.status === 'lost') {
      trackEvent('game_lost')
    } else if (state.status === 'won') {
      trackEvent('game_won', { tier: state.victoryTier })
    }
  }, [state.status, state.victoryTier])

  if (state.status === 'playing') return null

  const isWin = state.status === 'won'

  return (
    <div className="overlay" role="alertdialog" aria-modal="true">
      <div className="overlay__panel">
        <img
          className="overlay__image"
          src={isWin ? '/assets/endgame-imgs/win-img.png' : '/assets/endgame-imgs/defeat-img.png'}
          alt=""
          aria-hidden="true"
        />
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
