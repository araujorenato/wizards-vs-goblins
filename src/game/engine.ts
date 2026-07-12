import { classifySelection, type PlayClassification } from './combos'
import { buildCastleDeck, buildSpellsDeck } from './deck'
import { cardValue, ENEMY_STATS, enemyDisplayName, isEnemyRank } from './enemies'
import { formatCard } from './format'
import { generateHexSeed, hashSeed, shuffle } from './rng'
import {
  MAX_HAND_SIZE,
  type Card,
  type EventKind,
  type GameEvent,
  type GameState,
  type ProtectionTiming,
  type Suit,
  type VictoryTier,
} from './types'

let eventCounter = 0

function makeEvent(kind: EventKind, message: string, payload: Partial<GameEvent> = {}): GameEvent {
  eventCounter += 1
  return { id: `evt-${eventCounter}`, kind, message, ...payload }
}

export function startGame(seedInput?: string): GameState {
  const seed = seedInput && seedInput.trim().length > 0 ? seedInput.trim() : generateHexSeed()
  const initialState = hashSeed(seed)

  const [castleDeck, afterCastle] = buildCastleDeck(initialState)
  const [fullSpellsDeck, afterSpells] = buildSpellsDeck(afterCastle)

  const hand = fullSpellsDeck.slice(0, MAX_HAND_SIZE)
  const spellsDeck = fullSpellsDeck.slice(MAX_HAND_SIZE)

  const [firstEnemyCard, ...restCastle] = castleDeck

  const log: GameEvent[] = [
    makeEvent('game_started', `A new game begins. Seed ${seed}.`),
    makeEvent('enemy_revealed', `A ${enemyDisplayName(firstEnemyCard.rank as 'J' | 'Q' | 'K')} appears!`, {
      cards: [firstEnemyCard],
    }),
  ]

  return {
    seed,
    rngState: afterSpells,
    castleDeck: restCastle,
    currentEnemy: { card: firstEnemyCard, damageTaken: 0, spadesShield: 0 },
    spellsDeck,
    battleArea: [],
    discardPile: [],
    hand,
    protectionCharges: [true, true],
    log,
    phase: 'awaiting_action',
    pendingDefense: null,
    status: 'playing',
    turnCount: 1,
  }
}

export function getLegalPlay(state: GameState, selectedIds: string[]): PlayClassification {
  if (state.status !== 'playing' || state.phase !== 'awaiting_action') {
    return { valid: false, reason: 'Not your turn to play.' }
  }
  const cards = selectedIds
    .map((id) => state.hand.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c))
  if (cards.length !== selectedIds.length) {
    return { valid: false, reason: 'Selected spell is not in your hand.' }
  }
  return classifySelection(cards)
}

interface SuitPowerResult {
  spellsDeck: Card[]
  discardPile: Card[]
  hand: Card[]
  rngState: number
  spadesDelta: number
  clubsActive: boolean
  events: GameEvent[]
}

function resolveSuitPowers(
  state: GameState,
  suits: Suit[],
  attackValue: number,
  immuneSuit: Suit,
  playedCount: number,
): SuitPowerResult {
  let spellsDeck = state.spellsDeck
  let discardPile = state.discardPile
  let hand = state.hand
  let rngState = state.rngState
  let spadesDelta = 0
  let clubsActive = false
  const events: GameEvent[] = []

  // Hearts before Diamonds when both resolve in the same play; suit order
  // below already guarantees that (SUITS = spades, hearts, diamonds, clubs
  // in deck.ts, but here we iterate the play's own suits — sort explicitly).
  const ordered = [...suits].sort((a, b) => suitPriority(a) - suitPriority(b))

  for (const suit of ordered) {
    if (suit === immuneSuit) {
      events.push(makeEvent('suit_immune', `The enemy is immune to ${suit}.`, { suit }))
      continue
    }
    if (suit === 'hearts') {
      const [shuffled, nextState] = shuffle(discardPile, rngState)
      rngState = nextState
      const count = Math.min(attackValue, shuffled.length)
      const returned = shuffled.slice(0, count)
      discardPile = shuffled.slice(count)
      spellsDeck = [...spellsDeck, ...returned]
      events.push(
        makeEvent('suit_power', `Hearts heal ${count} spell${count === 1 ? '' : 's'} back into the deck.`, {
          suit,
          value: count,
        }),
      )
    } else if (suit === 'diamonds') {
      // Played cards leave the hand once the play resolves, so the room
      // available to draw into is measured against the hand size after
      // removing the cards just played, not the hand size before playing.
      const room = MAX_HAND_SIZE - (hand.length - playedCount)
      const count = Math.min(attackValue, spellsDeck.length, room)
      const drawn = spellsDeck.slice(0, count)
      spellsDeck = spellsDeck.slice(count)
      hand = [...hand, ...drawn]
      events.push(
        makeEvent('suit_power', `Diamonds draw ${count} spell${count === 1 ? '' : 's'}.`, { suit, value: count }),
      )
    } else if (suit === 'clubs') {
      clubsActive = true
      events.push(makeEvent('suit_power', `Clubs double the damage dealt.`, { suit, value: attackValue }))
    } else if (suit === 'spades') {
      spadesDelta = attackValue
      events.push(
        makeEvent('suit_power', `Spades reduce the enemy's attack by ${attackValue}.`, { suit, value: attackValue }),
      )
    }
  }

  return { spellsDeck, discardPile, hand, rngState, spadesDelta, clubsActive, events }
}

function suitPriority(suit: Suit): number {
  // Hearts and Diamonds (red) resolve immediately, Hearts before Diamonds;
  // Clubs and Spades (black) just set flags consumed in later steps, so
  // their relative order doesn't affect outcomes.
  switch (suit) {
    case 'hearts':
      return 0
    case 'diamonds':
      return 1
    case 'clubs':
      return 2
    case 'spades':
      return 3
  }
}

export function playCards(state: GameState, selectedIds: string[]): GameState {
  const classification = getLegalPlay(state, selectedIds)
  if (!classification.valid) return state

  const { cards, attackValue, suits } = classification
  const enemy = state.currentEnemy!

  const playEvent = makeEvent(
    'cards_played',
    `You attacked with ${cards.map(formatCard).join(' ')} for ${attackValue} attack value.`,
    { cards, value: attackValue },
  )

  const powerResult = resolveSuitPowers(state, suits, attackValue, enemy.card.suit, cards.length)

  const damage = powerResult.clubsActive ? attackValue * 2 : attackValue
  const damageTaken = enemy.damageTaken + damage
  const spadesShield = enemy.spadesShield + powerResult.spadesDelta

  const selectedIdSet = new Set(selectedIds)
  const handAfterPlay = powerResult.hand.filter((c) => !selectedIdSet.has(c.id))
  // Played cards stay "on the table" in the battle area until the enemy is
  // defeated — they only move to the discard pile together at that point.
  const battleAreaAfterPlay = [...state.battleArea, cards]

  const damageEvent = makeEvent('damage_dealt', `Dealing ${damage} damage.`, { value: damage })

  let working: GameState = {
    ...state,
    rngState: powerResult.rngState,
    spellsDeck: powerResult.spellsDeck,
    discardPile: powerResult.discardPile,
    battleArea: battleAreaAfterPlay,
    hand: handAfterPlay,
    currentEnemy: { ...enemy, damageTaken, spadesShield },
    log: [...state.log, playEvent, ...powerResult.events, damageEvent],
  }

  const stats = ENEMY_STATS[working.currentEnemy!.card.rank as 'J' | 'Q' | 'K']
  if (damageTaken >= stats.health) {
    working = resolveEnemyDefeat(working, damageTaken === stats.health)
  } else {
    working = enterDefensePhase(working)
  }

  return working
}

function resolveEnemyDefeat(state: GameState, exact: boolean): GameState {
  const enemy = state.currentEnemy!
  const name = enemyDisplayName(enemy.card.rank as 'J' | 'Q' | 'K')
  const defeatedEvent = makeEvent(
    'enemy_defeated',
    exact
      ? `${name} defeated with exact damage! It rejoins the top of the Spells deck.`
      : `${name} defeated!`,
    { exact },
  )

  // All cards played against this enemy across the whole fight move to the
  // discard pile together; the enemy card itself either rejoins the Spells
  // deck (exact kill) or goes to discard on top of them (overkill).
  const battleCards = state.battleArea.flat()
  const spellsDeck = exact ? [enemy.card, ...state.spellsDeck] : state.spellsDeck
  const discardPile = exact
    ? [...battleCards, ...state.discardPile]
    : [enemy.card, ...battleCards, ...state.discardPile]

  const log = [...state.log, defeatedEvent]

  if (state.castleDeck.length === 0) {
    const chargesUsed = state.protectionCharges.filter((available) => !available).length
    const tier: VictoryTier = chargesUsed === 0 ? 'gold' : chargesUsed === 1 ? 'silver' : 'bronze'
    return {
      ...state,
      spellsDeck,
      discardPile,
      battleArea: [],
      currentEnemy: null,
      phase: 'awaiting_action',
      pendingDefense: null,
      status: 'won',
      victoryTier: tier,
      log: [
        ...log,
        makeEvent('game_won', `Victory! The Goblin King has fallen. (${tier.toUpperCase()} victory)`),
      ],
    }
  }

  const [nextEnemyCard, ...rest] = state.castleDeck
  const revealEvent = makeEvent(
    'enemy_revealed',
    `A ${enemyDisplayName(nextEnemyCard.rank as 'J' | 'Q' | 'K')} appears!`,
    { cards: [nextEnemyCard] },
  )

  return {
    ...state,
    spellsDeck,
    discardPile,
    battleArea: [],
    castleDeck: rest,
    currentEnemy: { card: nextEnemyCard, damageTaken: 0, spadesShield: 0 },
    phase: 'awaiting_action',
    pendingDefense: null,
    turnCount: state.turnCount + 1,
    log: [...log, revealEvent],
  }
}

function enterDefensePhase(state: GameState): GameState {
  const enemy = state.currentEnemy!
  const stats = ENEMY_STATS[enemy.card.rank as 'J' | 'Q' | 'K']
  const effectiveAttack = Math.max(0, stats.attack - enemy.spadesShield)

  if (effectiveAttack === 0) {
    return {
      ...state,
      phase: 'awaiting_action',
      pendingDefense: null,
      turnCount: state.turnCount + 1,
      log: [...state.log, makeEvent('enemy_attacked', `The enemy's attack is fully blocked.`, { value: 0 })],
    }
  }

  const attackEvent = makeEvent('enemy_attacked', `The enemy is attacking with ${effectiveAttack} damage.`, {
    value: effectiveAttack,
  })

  const working: GameState = {
    ...state,
    phase: 'awaiting_defense',
    pendingDefense: { amountRequired: effectiveAttack },
    log: [...state.log, attackEvent],
  }

  return checkForInevitableLoss(working)
}

function checkForInevitableLoss(state: GameState): GameState {
  if (state.status !== 'playing' || state.phase !== 'awaiting_defense' || !state.pendingDefense) return state
  const chargesLeft = state.protectionCharges.filter(Boolean).length
  if (chargesLeft > 0) return state
  const handTotal = state.hand.reduce((sum, c) => sum + cardValue(c.rank), 0)
  if (handTotal >= state.pendingDefense.amountRequired) return state
  return {
    ...state,
    status: 'lost',
    log: [...state.log, makeEvent('player_died', `You cannot cover the damage. The wizard falls.`)],
  }
}

export function yieldTurn(state: GameState): GameState {
  if (state.status !== 'playing' || state.phase !== 'awaiting_action') return state
  const yieldEvent = makeEvent('yielded', 'You yield, taking no action this turn.')
  return enterDefensePhase({ ...state, log: [...state.log, yieldEvent] })
}

export function payDefense(state: GameState, discardIds: string[]): GameState {
  if (state.status !== 'playing' || state.phase !== 'awaiting_defense' || !state.pendingDefense) return state

  const cards = discardIds
    .map((id) => state.hand.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c))
  if (cards.length !== discardIds.length) return state

  const total = cards.reduce((sum, c) => sum + cardValue(c.rank), 0)
  if (total < state.pendingDefense.amountRequired) return state
  // Reject a selection that discards more than necessary — every card must
  // be needed; if any one of them could be dropped and the rest still
  // covers the attack, the player should remove it and try again.
  if (cards.some((c) => total - cardValue(c.rank) >= state.pendingDefense!.amountRequired)) return state

  const discardIdSet = new Set(discardIds)
  const hand = state.hand.filter((c) => !discardIdSet.has(c.id))
  const discardPile = [...cards, ...state.discardPile]
  const discardEvent = makeEvent(
    'cards_discarded',
    `You discard ${cards.map(formatCard).join(' ')} to cover the damage.`,
    { cards },
  )

  return {
    ...state,
    hand,
    discardPile,
    phase: 'awaiting_action',
    pendingDefense: null,
    turnCount: state.turnCount + 1,
    log: [...state.log, discardEvent],
  }
}

export function activateProtection(state: GameState, timing: ProtectionTiming): GameState {
  if (state.status !== 'playing') return state
  if (timing === 'preTurn' && state.phase !== 'awaiting_action') return state
  if (timing === 'preDamage' && state.phase !== 'awaiting_defense') return state

  const chargeIndex = state.protectionCharges.findIndex(Boolean)
  if (chargeIndex === -1) return state

  const drawCount = Math.min(MAX_HAND_SIZE, state.spellsDeck.length)
  const newHand = state.spellsDeck.slice(0, drawCount)
  const spellsDeck = state.spellsDeck.slice(drawCount)
  const discardPile = [...state.hand, ...state.discardPile]

  const protectionCharges = [...state.protectionCharges] as [boolean, boolean]
  protectionCharges[chargeIndex] = false

  const event = makeEvent(
    'protection_used',
    `You use a protection: hand discarded and refilled to ${newHand.length} spells.`,
  )

  let working: GameState = {
    ...state,
    hand: newHand,
    spellsDeck,
    discardPile,
    protectionCharges,
    log: [...state.log, event],
  }

  if (timing === 'preDamage') {
    working = checkForInevitableLoss(working)
  }

  return working
}

export function isEnemyCard(rank: Card['rank']): boolean {
  return isEnemyRank(rank)
}
