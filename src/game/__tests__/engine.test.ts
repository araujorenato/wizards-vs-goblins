import { describe, expect, it } from 'vitest'
import { activateProtection, payDefense, playCards, yieldTurn } from '../engine'
import { card, makeState } from './testUtils'

describe('suit powers', () => {
  it('Hearts returns discarded cards to the bottom of the Spells deck', () => {
    const discard = [card('4', 'spades'), card('5', 'diamonds'), card('6', 'clubs')]
    const state = makeState({
      currentEnemy: { card: card('J', 'diamonds'), damageTaken: 0, spadesShield: 0 },
      hand: [card('3', 'hearts')],
      discardPile: discard,
      spellsDeck: [card('9', 'spades')],
    })
    const result = playCards(state, [card('3', 'hearts').id])
    // The 3 old discards were pulled into the deck by Hearts; the just-played
    // 3 of Hearts itself sits in the battle area until the enemy dies.
    expect(result.discardPile).toEqual([])
    expect(result.battleArea).toEqual([[card('3', 'hearts')]])
    expect(result.spellsDeck.length).toBe(4)
    const ids = new Set(result.spellsDeck.map((c) => c.id))
    for (const c of discard) expect(ids.has(c.id)).toBe(true)
  })

  it('Diamonds draws up to the attack value, capped by remaining hand room', () => {
    const deck = [card('4', 'spades'), card('5', 'clubs'), card('6', 'hearts')]
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 },
      hand: [card('3', 'diamonds')],
      spellsDeck: deck,
    })
    const result = playCards(state, [card('3', 'diamonds').id])
    // attack value 3, deck has 3, room = 8 - 1 = 7 -> draws all 3.
    expect(result.hand.map((c) => c.id).sort()).toEqual(['4-spades', '5-clubs', '6-hearts'].sort())
    expect(result.spellsDeck.length).toBe(0)
  })

  it('Diamonds never draws the hand above the 8-card maximum', () => {
    const filler = [
      card('2', 'spades'),
      card('3', 'spades'),
      card('4', 'spades'),
      card('5', 'spades'),
      card('6', 'spades'),
      card('7', 'spades'),
      card('8', 'spades'),
    ]
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 },
      hand: [card('9', 'diamonds'), ...filler],
      spellsDeck: [card('2', 'hearts'), card('3', 'hearts')],
    })
    const result = playCards(state, [card('9', 'diamonds').id])
    expect(result.hand.length).toBeLessThanOrEqual(8)
  })

  it('Clubs doubles the damage dealt', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'spades'), damageTaken: 0, spadesShield: 0 },
      hand: [card('6', 'clubs')],
    })
    const result = playCards(state, [card('6', 'clubs').id])
    expect(result.currentEnemy!.damageTaken).toBe(12)
  })

  it('Spades reduces the enemy attack cumulatively across turns', () => {
    let state = makeState({
      currentEnemy: { card: card('J', 'hearts'), damageTaken: 0, spadesShield: 0 },
      hand: [card('4', 'spades'), card('3', 'spades'), card('9', 'clubs')],
    })
    state = playCards(state, [card('4', 'spades').id])
    expect(state.currentEnemy!.spadesShield).toBe(4)
    // Enemy survived (4 damage < 20 health): it now strikes back for its
    // reduced attack (10 - 4 = 6) before the player gets a new turn.
    expect(state.phase).toBe('awaiting_defense')
    expect(state.pendingDefense?.amountRequired).toBe(6)
    state = payDefense(state, [card('9', 'clubs').id])
    expect(state.phase).toBe('awaiting_action')
    state = playCards(state, [card('3', 'spades').id])
    expect(state.currentEnemy!.spadesShield).toBe(7)
  })

  it('resets spadesShield to 0 for the next enemy', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'hearts'), damageTaken: 19, spadesShield: 8 },
      hand: [card('5', 'clubs')],
      castleDeck: [card('Q', 'diamonds')],
    })
    const result = playCards(state, [card('5', 'clubs').id])
    expect(result.currentEnemy!.card.rank).toBe('Q')
    expect(result.currentEnemy!.spadesShield).toBe(0)
  })

  it('enemy is immune to its own suit: power skipped, damage still counts', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'spades'), damageTaken: 0, spadesShield: 0 },
      hand: [card('4', 'spades')],
    })
    const result = playCards(state, [card('4', 'spades').id])
    expect(result.currentEnemy!.damageTaken).toBe(4)
    expect(result.currentEnemy!.spadesShield).toBe(0)
    expect(result.log.some((e) => e.kind === 'suit_immune')).toBe(true)
  })

  it('resolves Hearts before Diamonds within the same play', () => {
    // Deck only has 1 card before Hearts runs; Hearts adds 3 more to the
    // bottom, so Diamonds (which runs after) can draw from a 4-card deck.
    // If Diamonds ran first it would only ever see the original 1 card.
    const s1 = card('9', 'spades')
    const discard = [card('4', 'diamonds'), card('5', 'diamonds'), card('6', 'diamonds')]
    const filler = [card('2', 'clubs'), card('3', 'clubs'), card('4', 'clubs')]
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 },
      hand: [card('3', 'hearts'), card('3', 'diamonds'), ...filler],
      discardPile: discard,
      spellsDeck: [s1],
    })
    const result = playCards(state, [card('3', 'hearts').id, card('3', 'diamonds').id])
    // hand: started at 5, -2 played = 3, room for 5 more (up to 8); 4 available -> 3+4 drawn = 7
    expect(result.hand.length).toBe(7)
    expect(result.hand.some((c) => c.id === s1.id)).toBe(true)
    // The 3 old discards were pulled into the deck by Hearts; the 2 just
    // -played cards sit in the battle area until the enemy dies.
    expect(result.discardPile.length).toBe(0)
    expect(result.battleArea.flat().length).toBe(2)
    expect(result.spellsDeck.length).toBe(0) // 4 available after Hearts, all 4 drawn by Diamonds
  })
})

describe('battle area', () => {
  it('keeps played cards on the table, grouped by play, across multiple turns against the same enemy', () => {
    let state = makeState({
      currentEnemy: { card: card('J', 'diamonds'), damageTaken: 0, spadesShield: 0 },
      hand: [card('2', 'spades'), card('2', 'clubs'), card('9', 'hearts'), card('9', 'clubs')],
    })
    state = playCards(state, [card('2', 'spades').id, card('2', 'clubs').id])
    expect(state.phase).toBe('awaiting_defense')
    state = payDefense(state, [card('9', 'clubs').id])
    expect(state.battleArea).toEqual([[card('2', 'spades'), card('2', 'clubs')]])

    state = playCards(state, [card('9', 'hearts').id])
    expect(state.battleArea).toEqual([[card('2', 'spades'), card('2', 'clubs')], [card('9', 'hearts')]])
    // 2+2 combo with Clubs doubles to 8, plus 9 from the second play = 17.
    expect(state.currentEnemy!.damageTaken).toBe(17)
    expect(state.discardPile).toEqual([]) // nothing discarded yet, the enemy is still alive
  })

  it('moves every card from every play against the enemy to discard together when it dies', () => {
    // Simulate arriving at the killing blow after two earlier plays already
    // sitting in the battle area (built up over prior turns of this fight).
    const state = makeState({
      currentEnemy: { card: card('J', 'diamonds'), damageTaken: 19, spadesShield: 0 },
      battleArea: [[card('2', 'spades'), card('2', 'clubs')], [card('9', 'hearts')]],
      hand: [card('K', 'spades')],
      castleDeck: [card('Q', 'hearts')],
    })
    const result = playCards(state, [card('K', 'spades').id])
    expect(result.currentEnemy!.card.rank).not.toBe('J') // the next enemy was revealed
    expect(result.battleArea).toEqual([])
    const discardIds = result.discardPile.map((c) => c.id).sort()
    expect(discardIds).toEqual(['2-clubs', '2-spades', '9-hearts', 'J-diamonds', 'K-spades'].sort())
  })
})

describe('exact lethal vs overkill', () => {
  it('places an exactly-lethal enemy face-down on top of the Spells deck', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 10, spadesShield: 0 },
      hand: [card('10', 'spades')],
      castleDeck: [card('Q', 'hearts')],
      spellsDeck: [],
      discardPile: [],
    })
    const result = playCards(state, [card('10', 'spades').id])
    expect(result.spellsDeck[0].id).toBe('J-clubs')
    expect(result.discardPile.some((c) => c.id === 'J-clubs')).toBe(false)
    expect(result.discardPile.some((c) => c.id === '10-spades')).toBe(true)
    expect(result.currentEnemy!.card.rank).toBe('Q')
    expect(result.log.some((e) => e.kind === 'enemy_defeated' && e.exact === true)).toBe(true)
  })

  it('sends an overkilled enemy to the discard pile instead', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 15, spadesShield: 0 },
      hand: [card('10', 'spades')],
      castleDeck: [card('Q', 'hearts')],
      spellsDeck: [],
      discardPile: [],
    })
    const result = playCards(state, [card('10', 'spades').id])
    expect(result.discardPile[0].id).toBe('J-clubs')
    expect(result.spellsDeck.some((c) => c.id === 'J-clubs')).toBe(false)
  })

  it('a redrawn Guard/Champion/Goblin King card plays and resolves its suit power normally', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'hearts'), damageTaken: 0, spadesShield: 0 },
      hand: [card('Q', 'spades')],
    })
    const result = playCards(state, [card('Q', 'spades').id])
    expect(result.currentEnemy!.spadesShield).toBe(15)
    expect(result.currentEnemy!.damageTaken).toBe(15)
  })
})

describe('win condition and victory tiers', () => {
  it('wins with a GOLD tier when no protections were used', () => {
    const state = makeState({
      currentEnemy: { card: card('K', 'clubs'), damageTaken: 39, spadesShield: 0 },
      hand: [card('5', 'spades')],
      castleDeck: [],
      protectionCharges: [true, true],
    })
    const result = playCards(state, [card('5', 'spades').id])
    expect(result.status).toBe('won')
    expect(result.victoryTier).toBe('gold')
  })

  it('wins with a SILVER tier when one protection was used', () => {
    const state = makeState({
      currentEnemy: { card: card('K', 'clubs'), damageTaken: 39, spadesShield: 0 },
      hand: [card('5', 'spades')],
      castleDeck: [],
      protectionCharges: [true, false],
    })
    const result = playCards(state, [card('5', 'spades').id])
    expect(result.victoryTier).toBe('silver')
  })

  it('wins with a BRONZE tier when both protections were used', () => {
    const state = makeState({
      currentEnemy: { card: card('K', 'clubs'), damageTaken: 39, spadesShield: 0 },
      hand: [card('5', 'spades')],
      castleDeck: [],
      protectionCharges: [false, false],
    })
    const result = playCards(state, [card('5', 'spades').id])
    expect(result.victoryTier).toBe('bronze')
  })
})

describe('defense and loss condition', () => {
  it('requires discarding cards totaling at least the effective enemy attack', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 },
      hand: [card('9', 'spades'), card('2', 'diamonds')],
      phase: 'awaiting_defense',
      pendingDefense: { amountRequired: 10 },
    })
    const tooLow = payDefense(state, [card('2', 'diamonds').id])
    expect(tooLow).toBe(state) // no-op: insufficient total

    const enough = payDefense(state, [card('9', 'spades').id, card('2', 'diamonds').id])
    expect(enough.phase).toBe('awaiting_action')
    expect(enough.hand.length).toBe(0)
    expect(enough.discardPile.length).toBe(2)
  })

  it('rejects discarding more cards than necessary when a smaller valid subset exists', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 },
      hand: [card('2', 'hearts'), card('5', 'diamonds'), card('3', 'clubs'), card('10', 'spades')],
      phase: 'awaiting_defense',
      pendingDefense: { amountRequired: 10 },
    })
    // 2 + 5 + 3 + 10 = 20, way over 10 — the 10 alone already covers it.
    const overshoot = payDefense(state, [
      card('2', 'hearts').id,
      card('5', 'diamonds').id,
      card('3', 'clubs').id,
      card('10', 'spades').id,
    ])
    expect(overshoot).toBe(state) // no-op: redundant cards present

    const minimal = payDefense(state, [card('10', 'spades').id])
    expect(minimal.phase).toBe('awaiting_action')
    expect(minimal.discardPile.map((c) => c.id)).toEqual(['10-spades'])
  })

  it('allows unavoidable overshoot when no exact-covering subset exists', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 },
      hand: [card('7', 'hearts'), card('8', 'diamonds')],
      phase: 'awaiting_defense',
      pendingDefense: { amountRequired: 10 },
    })
    // 7 alone (7 < 10) and 8 alone (8 < 10) are both insufficient, so
    // playing both (15 total) isn't "redundant" even though it overshoots.
    const result = payDefense(state, [card('7', 'hearts').id, card('8', 'diamonds').id])
    expect(result.phase).toBe('awaiting_action')
    expect(result.discardPile.length).toBe(2)
  })

  it('kills the player when the hand cannot cover the incoming attack and no protections remain', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 },
      hand: [card('2', 'hearts'), card('3', 'diamonds')],
      protectionCharges: [false, false],
    })
    const result = yieldTurn(state)
    expect(result.status).toBe('lost')
    expect(result.log.some((e) => e.kind === 'player_died')).toBe(true)
  })

  it('does not auto-lose while a protection charge is still available', () => {
    const state = makeState({
      currentEnemy: { card: card('J', 'clubs'), damageTaken: 0, spadesShield: 0 },
      hand: [card('2', 'hearts'), card('3', 'diamonds')],
      protectionCharges: [true, false],
    })
    const result = yieldTurn(state)
    expect(result.status).toBe('playing')
    expect(result.phase).toBe('awaiting_defense')
  })
})

describe('protection charges', () => {
  it('discards the hand and refills to 8 cards, consuming one charge', () => {
    const deck = [
      card('2', 'clubs'),
      card('3', 'clubs'),
      card('4', 'clubs'),
      card('5', 'clubs'),
      card('6', 'clubs'),
      card('7', 'clubs'),
      card('8', 'clubs'),
      card('9', 'clubs'),
      card('10', 'clubs'),
      card('A', 'clubs'),
    ]
    const state = makeState({
      hand: [card('2', 'hearts')],
      spellsDeck: deck,
      protectionCharges: [true, true],
    })
    const result = activateProtection(state, 'preTurn')
    expect(result.hand.length).toBe(8)
    expect(result.protectionCharges).toEqual([false, true])
    expect(result.discardPile.some((c) => c.id === '2-hearts')).toBe(true)
  })

  it('is a no-op at the wrong timing for the current phase', () => {
    const state = makeState({ phase: 'awaiting_action', protectionCharges: [true, true] })
    const result = activateProtection(state, 'preDamage')
    expect(result).toBe(state)
  })

  it('can be used at most twice total', () => {
    let state = makeState({ hand: [], spellsDeck: [], protectionCharges: [true, true] })
    state = activateProtection(state, 'preTurn')
    state = activateProtection(state, 'preTurn')
    expect(state.protectionCharges).toEqual([false, false])
    const noop = activateProtection(state, 'preTurn')
    expect(noop).toBe(state)
  })
})
