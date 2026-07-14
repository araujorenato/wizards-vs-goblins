import { useState } from 'react'
import { loadGame } from '../../state/persistence'
import './StartScreen.css'

interface StartScreenProps {
  onStart: (seed?: string) => void
  onResume: () => void
  onChangeColor: () => void
}

export function StartScreen({ onStart, onResume, onChangeColor }: StartScreenProps) {
  const [seedInput, setSeedInput] = useState('')
  const savedGame = loadGame()

  return (
    <div className="start-screen">
      <div className="start-screen__content">
        <img src="/assets/logo.svg" alt="Regicide" className="start-screen__logo" />
        <p className="start-screen__subtitle">A solo battle against the Goblin Kingdom</p>

        <div className="start-screen__actions">
          {savedGame && savedGame.status === 'playing' && (
            <button type="button" className="start-screen__primary" onClick={onResume}>
              Resume Game
            </button>
          )}
          <button type="button" className="start-screen__primary" onClick={() => onStart()}>
            New Game
          </button>

          <form
            className="start-screen__seed-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (seedInput.trim()) onStart(seedInput.trim())
            }}
          >
            <label htmlFor="seed-input" className="start-screen__label">
              Reproduce a run with a specific seed
            </label>
            <div className="start-screen__seed-row">
              <input
                id="seed-input"
                className="start-screen__seed-input"
                type="text"
                placeholder="e.g. 7196759210defdc0"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
              />
              <button type="submit" className="start-screen__secondary" disabled={!seedInput.trim()}>
                Start
              </button>
            </div>
          </form>

          <button type="button" className="start-screen__secondary" onClick={onChangeColor}>
            Change Color
          </button>
        </div>
      </div>

      <div className="start-screen__attribution">
        <p>
          Inspired by the mechanics of Regicide, a card game created by Paul Abrahams, Luke Badger, and Andy
          Richdale, and published by Badgers From Mars. This is an independent, unofficial project.
        </p>
      </div>
    </div>
  )
}
