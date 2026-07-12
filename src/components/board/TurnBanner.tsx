import { useEffect, useState } from 'react'
import type { GameState } from '../../game/types'
import './TurnBanner.css'

interface TurnBannerProps {
  state: GameState
  errorText?: string
}

const FADE_MS = 600

export function TurnBanner({ state, errorText }: TurnBannerProps) {
  const narrativeText = bannerText(state)
  const [displayedText, setDisplayedText] = useState(narrativeText)
  const [visible, setVisible] = useState(true)

  // The narrative banner (turn/status text) fades out then back in on
  // change. The validation error below bypasses this: it's live feedback
  // tied directly to card selection and must react instantly.
  useEffect(() => {
    if (narrativeText === displayedText) return
    setVisible(false)
    const timer = setTimeout(() => {
      setDisplayedText(narrativeText)
      setVisible(true)
    }, FADE_MS)
    return () => clearTimeout(timer)
  }, [narrativeText, displayedText])

  if (errorText) {
    return (
      <div className="turn-banner">
        <span className="turn-banner__text turn-banner__text--visible turn-banner__text--error">{errorText}</span>
      </div>
    )
  }

  return (
    <div className="turn-banner">
      <span className={`turn-banner__text ${visible ? 'turn-banner__text--visible' : ''}`}>{displayedText}</span>
    </div>
  )
}

function bannerText(state: GameState): string {
  if (state.status === 'won') return `Victory! (${state.victoryTier?.toUpperCase()})`
  if (state.status === 'lost') return 'Defeat. The wizard has fallen.'
  if (state.phase === 'awaiting_defense' && state.pendingDefense) {
    return `The enemy attacks! Discard spells worth at least ${state.pendingDefense.amountRequired}.`
  }
  return 'Your turn. Choose spells and confirm attack.'
}
