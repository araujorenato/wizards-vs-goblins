import { describe, expect, it } from 'vitest'
import { activateProtection, getLegalPlay, payDefense, playCards, startGame, yieldTurn } from '../engine'
import { cardValue } from '../enemies'
import { normalizeLog } from './testUtils'
import type { Card, GameState } from '../types'

const SEED = 'determinism-test-seed-42'

/** Greedily picks the fewest, largest-first cards covering `required`, then
 * drops any that turned out redundant — payDefense now rejects over-discarding. */
function pickMinimalDiscard(hand: Card[], required: number): string[] {
  const sorted = [...hand].sort((a, b) => cardValue(b.rank) - cardValue(a.rank))
  const chosen: Card[] = []
  let total = 0
  for (const c of sorted) {
    if (total >= required) break
    chosen.push(c)
    total += cardValue(c.rank)
  }
  for (let i = chosen.length - 1; i >= 0 && chosen.length > 1; i--) {
    const value = cardValue(chosen[i].rank)
    if (total - value >= required) {
      total -= value
      chosen.splice(i, 1)
    }
  }
  return chosen.map((c) => c.id)
}

function playAFewTurns(state: GameState): GameState {
  let s = state
  for (let i = 0; i < 15 && s.status === 'playing'; i++) {
    if (s.phase === 'awaiting_defense') {
      const required = s.pendingDefense?.amountRequired ?? 0
      const attempt = payDefense(s, pickMinimalDiscard(s.hand, required))
      if (attempt !== s) {
        s = attempt
        continue
      }
      // Whole hand wasn't enough; try a protection charge to refill and retry once.
      const refreshed = activateProtection(s, 'preDamage')
      if (refreshed === s) break // nothing left to try; loop ends, status may be 'lost'
      const retryRequired = refreshed.pendingDefense?.amountRequired ?? required
      const retry = payDefense(refreshed, pickMinimalDiscard(refreshed.hand, retryRequired))
      s = retry === refreshed ? refreshed : retry
      if (s.status !== 'playing') break
      continue
    }
    if (s.hand.length === 0) {
      s = yieldTurn(s)
      continue
    }
    const single = s.hand[0]
    const legal = getLegalPlay(s, [single.id])
    s = legal.valid ? playCards(s, [single.id]) : yieldTurn(s)
  }
  return s
}

describe('seed determinism', () => {
  it('the same seed always builds the same castle and spells order', () => {
    const a = startGame(SEED)
    const b = startGame(SEED)
    expect(a.castleDeck.map((c) => c.id)).toEqual(b.castleDeck.map((c) => c.id))
    expect(a.spellsDeck.map((c) => c.id)).toEqual(b.spellsDeck.map((c) => c.id))
    expect(a.hand.map((c) => c.id)).toEqual(b.hand.map((c) => c.id))
    expect(a.currentEnemy?.card.id).toBe(b.currentEnemy?.card.id)
  })

  it('replaying the same decisions against the same seed reproduces an identical run', () => {
    const a = playAFewTurns(startGame(SEED))
    const b = playAFewTurns(startGame(SEED))

    expect(a.status).toBe(b.status)
    expect(a.hand.map((c) => c.id)).toEqual(b.hand.map((c) => c.id))
    expect(a.spellsDeck.map((c) => c.id)).toEqual(b.spellsDeck.map((c) => c.id))
    expect(a.discardPile.map((c) => c.id)).toEqual(b.discardPile.map((c) => c.id))
    expect(a.castleDeck.map((c) => c.id)).toEqual(b.castleDeck.map((c) => c.id))
    expect(a.currentEnemy?.card.id).toBe(b.currentEnemy?.card.id)
    expect(normalizeLog(a)).toEqual(normalizeLog(b))
  })

  it('a different seed produces a different castle/spells order', () => {
    const a = startGame(SEED)
    const b = startGame('a-completely-different-seed')
    const same =
      a.castleDeck.map((c) => c.id).join() === b.castleDeck.map((c) => c.id).join() &&
      a.spellsDeck.map((c) => c.id).join() === b.spellsDeck.map((c) => c.id).join()
    expect(same).toBe(false)
  })
})
