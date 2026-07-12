import { useEffect, useRef } from 'react'
import type { GameEvent } from '../../game/types'
import './GameLog.css'

interface GameLogProps {
  log: GameEvent[]
}

export function GameLog({ log }: GameLogProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [log.length])

  return (
    <div className="game-log" aria-live="polite">
      <h2 className="game-log__title">Log</h2>
      <div className="game-log__entries">
        {log.map((entry) => (
          <p key={entry.id} className={`game-log__entry game-log__entry--${entry.kind}`}>
            {entry.message}
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
