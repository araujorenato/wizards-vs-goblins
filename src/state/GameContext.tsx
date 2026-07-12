import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { gameReducer, type GameAction } from './gameReducer'
import { saveGame } from './persistence'
import type { GameState } from '../game/types'

interface GameContextValue {
  state: GameState | null
  dispatch: React.Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null)

  useEffect(() => {
    if (state) saveGame(state)
  }, [state])

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}
