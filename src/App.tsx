import { useState } from 'react'
import { Board } from './components/board/Board'
import { StartScreen } from './components/start/StartScreen'
import { GameProvider, useGame } from './state/GameContext'
import { trackEvent } from './lib/analytics'
import { loadGame } from './state/persistence'

type Screen = 'start' | 'board'

function AppInner() {
  const { dispatch } = useGame()
  const [screen, setScreen] = useState<Screen>('start')

  if (screen === 'start') {
    return (
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
      />
    )
  }

  return <Board onMenu={() => setScreen('start')} />
}

function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  )
}

export default App
