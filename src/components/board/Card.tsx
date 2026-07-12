import type { CSSProperties, KeyboardEvent } from 'react'
import { SUIT_SYMBOLS } from '../../game/format'
import type { Card as CardModel } from '../../game/types'
import './Card.css'

const RED_SUITS = new Set(['hearts', 'diamonds'])

interface CardProps {
  card?: CardModel
  faceDown?: boolean
  selected?: boolean
  raised?: boolean
  dimmed?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

export function Card({
  card,
  faceDown,
  selected,
  raised,
  dimmed,
  size = 'md',
  onClick,
  ariaLabel,
  className,
  style,
}: CardProps) {
  const interactive = Boolean(onClick)
  const isBack = faceDown || !card
  const isRed = card ? RED_SUITS.has(card.suit) : false

  const classes = [
    'card',
    `card--${size}`,
    isBack ? 'card--back' : 'card--face',
    selected ? 'card--selected' : '',
    raised ? 'card--raised' : '',
    dimmed ? 'card--dimmed' : '',
    interactive ? 'card--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={classes}
      style={style}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? Boolean(selected) : undefined}
      aria-label={ariaLabel ?? (card ? `${card.rank} of ${card.suit}` : undefined)}
    >
      {!isBack && card && (
        <>
          <span className={`card__corner card__corner--top ${isRed ? 'card__corner--red' : ''}`}>{card.rank}</span>
          <span className={`card__suit ${isRed ? 'card__suit--red' : ''}`}>{SUIT_SYMBOLS[card.suit]}</span>
          <span className={`card__corner card__corner--bottom ${isRed ? 'card__corner--red' : ''}`}>
            {card.rank}
          </span>
        </>
      )}
    </div>
  )
}
