import { activateProtection, payDefense, playCards, startGame, yieldTurn } from '../game/engine'
import type { GameState, ProtectionTiming } from '../game/types'

export type GameAction =
  | { type: 'START_GAME'; seed?: string }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'PLAY_CARDS'; cardIds: string[] }
  | { type: 'YIELD' }
  | { type: 'PAY_DEFENSE'; cardIds: string[] }
  | { type: 'USE_PROTECTION'; timing: ProtectionTiming }

export function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case 'START_GAME':
      return startGame(action.seed)
    case 'LOAD_STATE':
      return action.state
    case 'PLAY_CARDS':
      return state ? playCards(state, action.cardIds) : state
    case 'YIELD':
      return state ? yieldTurn(state) : state
    case 'PAY_DEFENSE':
      return state ? payDefense(state, action.cardIds) : state
    case 'USE_PROTECTION':
      return state ? activateProtection(state, action.timing) : state
    default:
      return state
  }
}
