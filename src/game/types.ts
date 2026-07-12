export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export type NumberRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
export type EnemyRank = 'J' | 'Q' | 'K'
export type Rank = NumberRank | EnemyRank

export interface Card {
  id: string
  rank: Rank
  suit: Suit
}

export interface EnemyStats {
  attack: number
  health: number
  displayName: string
}

export interface EnemyInPlay {
  card: Card
  damageTaken: number
  spadesShield: number
}

export type ProtectionTiming = 'preTurn' | 'preDamage'

export type GamePhase = 'awaiting_action' | 'awaiting_defense'

export type GameStatus = 'playing' | 'won' | 'lost'

export type VictoryTier = 'gold' | 'silver' | 'bronze'

export type EventKind =
  | 'game_started'
  | 'cards_played'
  | 'yielded'
  | 'suit_power'
  | 'suit_immune'
  | 'damage_dealt'
  | 'enemy_defeated'
  | 'enemy_revealed'
  | 'enemy_attacked'
  | 'cards_discarded'
  | 'protection_used'
  | 'player_died'
  | 'game_won'

export interface GameEvent {
  id: string
  kind: EventKind
  message: string
  suit?: Suit
  value?: number
  cards?: Card[]
  exact?: boolean
}

export interface PendingDefense {
  amountRequired: number
}

export interface GameState {
  seed: string
  rngState: number
  castleDeck: Card[]
  currentEnemy: EnemyInPlay | null
  spellsDeck: Card[]
  /** Cards played against the current enemy, grouped by play, sitting "on the table" until it's defeated. */
  battleArea: Card[][]
  discardPile: Card[]
  hand: Card[]
  protectionCharges: [boolean, boolean]
  log: GameEvent[]
  phase: GamePhase
  pendingDefense: PendingDefense | null
  status: GameStatus
  victoryTier?: VictoryTier
  turnCount: number
}

export const MAX_HAND_SIZE = 8
export const TOTAL_ENEMIES = 12
