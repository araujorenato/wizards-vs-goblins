import { useState } from 'react'
import { Board } from './components/board/Board'
import { StartScreen } from './components/start/StartScreen'
import { ColorFilterOverlay } from './components/ColorFilterOverlay'
import { GameProvider, useGame } from './state/GameContext'
import { trackEvent } from './lib/analytics'
import { loadGame } from './state/persistence'
import { COLOR_FILTER_OPTIONS, loadColorFilterIndex, saveColorFilterIndex } from './lib/colorFilter'

type Screen = 'start' | 'board'

function AppInner() {
  const { dispatch } = useGame()
  const [screen, setScreen] = useState<Screen>('start')
  const [colorFilterIndex, setColorFilterIndex] = useState<number | null>(() => loadColorFilterIndex())

  const cycleColorFilter = () => {
    setColorFilterIndex((prev) => {
      const next = prev === null ? 0 : (prev + 1) % COLOR_FILTER_OPTIONS.length
      saveColorFilterIndex(next)
      return next
    })
  }

  return (
    <>
      {screen === 'start' ? (
        <StartScreen
          onStart={(seed) => {
            trackEvent('new_game')
            dispatch({ type: 'START_GAME', seed })
            setScreen('board')
          }}
          onResume={() => {
            const saved = loadGame()
            if (saved) {
              dispatch({ type: 'LOAD_STATE', state: saved })
              setScreen('board')
            }
          }}
          onChangeColor={cycleColorFilter}
        />
      ) : (
        <Board onMenu={() => setScreen('start')} />
      )}
      <ColorFilterOverlay color={colorFilterIndex === null ? null : COLOR_FILTER_OPTIONS[colorFilterIndex]} />
    </>
  )
}

function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  )
}

export default App
