import { useLayoutEffect, useRef, useState } from 'react'
import { getLegalPlay } from '../../game/engine'
import { cardValue, ENEMY_STATS } from '../../game/enemies'
import { hasRedundantDiscard, spellsDeckCount } from '../../game/selectors'
import { sortHand, type HandSortMode } from '../../game/sorting'
import type { Card as CardModel, EnemyRank, GameState } from '../../game/types'
import { useGame } from '../../state/GameContext'
import { ActionBar } from './ActionBar'
import { getAnimDurationMs, nextFrame, sleep } from './animationUtils'
import { BattleArea } from './BattleArea'
import { Card } from './Card'
import { CastleArea, type FrozenEnemyDisplay } from './CastleArea'
import { DiscardPile } from './DiscardPile'
import { EnemyCard } from './EnemyCard'
import { GameLog } from './GameLog'
import './Ghost.css'
import { Hand } from './Hand'
import { HandSortToggle } from './HandSortToggle'
import { Header } from './Header'
import { ProtectionDots } from './ProtectionDots'
import { SpellsDeck } from './SpellsDeck'
import { TurnBanner } from './TurnBanner'
import { WinLoseOverlay } from './WinLoseOverlay'
import './Board.css'

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

interface BattleGhost {
  groups: CardModel[][]
  start: Rect
  end: Rect
  phase: 'start' | 'end'
}

interface EnemyGhost {
  card: CardModel
  start: Rect
  end: Rect
  phase: 'start' | 'end'
}

interface DiscardGhost {
  card: CardModel
  start: Rect
  end: Rect
  phase: 'start' | 'end'
}

function toRect(el: Element | null): Rect | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

function ghostStyle(g: { start: Rect; end: Rect; phase: 'start' | 'end' }, scale = 1) {
  const dx = g.end.left - g.start.left
  const dy = g.end.top - g.start.top
  return {
    left: g.start.left,
    top: g.start.top,
    width: g.start.width,
    height: g.start.height,
    opacity: g.phase === 'end' ? 0 : 1,
    transform: g.phase === 'end' ? `translate(${dx}px, ${dy}px) scale(${scale})` : 'translate(0, 0) scale(1)',
  }
}

// The battle area collapses to near-zero width the instant its cards are
// cleared from state (same dispatch that triggers this ghost), so anchoring
// on its left edge would leave the ghost pinned to a sliver and force its
// cards to wrap into a column. Anchor on the center point instead — that
// stays put as the box shrinks — and let the ghost's width come from its own
// content (`max-content` in CSS) so the cards it actually holds lay out in
// one horizontal row.
function battleGhostStyle(g: { start: Rect; end: Rect; phase: 'start' | 'end' }, scale = 1) {
  const startCenterX = g.start.left + g.start.width / 2
  const startCenterY = g.start.top + g.start.height / 2
  const endCenterX = g.end.left + g.end.width / 2
  const endCenterY = g.end.top + g.end.height / 2
  const dx = endCenterX - startCenterX
  const dy = endCenterY - startCenterY
  return {
    left: startCenterX,
    top: startCenterY,
    opacity: g.phase === 'end' ? 0 : 1,
    transform:
      g.phase === 'end'
        ? `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scale})`
        : 'translate(-50%, -50%) scale(1)',
  }
}

export function Board({ onMenu }: { onMenu: () => void }) {
  const { state, dispatch } = useGame()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortMode, setSortMode] = useState<HandSortMode>('suit')

  const battleAreaRef = useRef<HTMLDivElement>(null)
  const discardPileRef = useRef<HTMLDivElement>(null)
  const spellsDeckRef = useRef<HTMLDivElement>(null)
  const enemyCardRef = useRef<HTMLDivElement>(null)
  const prevStateRef = useRef<GameState | null>(state)
  const handSlotRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const registerHandSlotRef = (id: string, el: HTMLDivElement | null) => {
    if (el) handSlotRefs.current.set(id, el)
    else handSlotRefs.current.delete(id)
  }

  const [battleGhost, setBattleGhost] = useState<BattleGhost | null>(null)
  const [enemyGhost, setEnemyGhost] = useState<EnemyGhost | null>(null)
  const [discardGhosts, setDiscardGhosts] = useState<DiscardGhost[]>([])
  const [frozenEnemy, setFrozenEnemy] = useState<FrozenEnemyDisplay | null>(null)
  const [hideEnemySlot, setHideEnemySlot] = useState(false)
  const [isAnimatingDefeat, setIsAnimatingDefeat] = useState(false)
  const [flipTrigger, setFlipTrigger] = useState(0)

  async function animateDiscardGhosts(ghosts: DiscardGhost[]) {
    setDiscardGhosts(ghosts)
    await nextFrame()
    setDiscardGhosts((prev) => prev.map((g) => ({ ...g, phase: 'end' })))
    await sleep(getAnimDurationMs('--anim-card-fly-duration', 2000))
    setDiscardGhosts([])
  }

  useLayoutEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = state
    if (!prev || !state || state.log.length <= prev.log.length) return

    const newEvents = state.log.slice(prev.log.length)
    const defeatEvent = newEvents.find((e) => e.kind === 'enemy_defeated')
    const defeatedEnemy = prev.currentEnemy
    if (!defeatEvent || !defeatedEnemy) return
    const defeatedEnemyCard = defeatedEnemy.card

    const wasExact = defeatEvent.exact === true
    const lastPlayEvent = [...newEvents].reverse().find((e) => e.kind === 'cards_played')
    const groups = [...prev.battleArea, lastPlayEvent?.cards ?? []].filter((g) => g.length > 0)

    const stats = ENEMY_STATS[defeatedEnemyCard.rank as EnemyRank]
    const preHitHealth = Math.max(0, stats.health - defeatedEnemy.damageTaken)

    let cancelled = false

    async function choreograph() {
      setIsAnimatingDefeat(true)

      // Show the battle-area cards (including the killing blow itself) as a
      // static ghost held exactly where they already are — the engine
      // clears state.battleArea as part of this same dispatch, so without
      // this they'd vanish instantly instead of staying visible through the
      // health countdown below.
      const battleStart = toRect(battleAreaRef.current)
      const discardEnd = toRect(discardPileRef.current)
      const hasBattleGhost = Boolean(battleStart && discardEnd && groups.length > 0)
      if (hasBattleGhost) {
        setBattleGhost({ groups, start: battleStart!, end: discardEnd!, phase: 'start' })
      }

      // Phase 0: show the enemy exactly as it looked a moment ago (same
      // health, no jump), then let it tick down to 0 via EnemyCard's own
      // countdown — the player sees the killing blow land before anything
      // about the defeat/exit animations begins.
      setFrozenEnemy({
        enemy: { card: defeatedEnemyCard, damageTaken: 0, spadesShield: 0 },
        remainingHealth: preHitHealth,
        effectiveAttack: 0,
      })
      await nextFrame()
      if (cancelled) return
      setFrozenEnemy((f) => (f ? { ...f, remainingHealth: 0 } : f))
      await sleep(getAnimDurationMs('--anim-health-countdown-duration', 800))
      if (cancelled) return

      // Phase 1: only now do the battle-area cards fly to the discard pile.
      if (hasBattleGhost) {
        setBattleGhost((g) => (g ? { ...g, phase: 'end' } : g))
        await sleep(getAnimDurationMs('--anim-card-fly-duration', 2000))
        if (cancelled) return
      }
      setBattleGhost(null)

      // Phase 2: the defeated enemy card itself flies to its destination.
      // Measure its position while still frozen there, then hide the real
      // slot so only the flying ghost represents it (no next-enemy peek).
      const enemyStart = toRect(enemyCardRef.current)
      setHideEnemySlot(true)
      const enemyEnd = toRect(wasExact ? spellsDeckRef.current : discardPileRef.current)
      if (enemyStart && enemyEnd) {
        setEnemyGhost({ card: defeatedEnemyCard, start: enemyStart, end: enemyEnd, phase: 'start' })
        await nextFrame()
        if (cancelled) return
        setEnemyGhost((g) => (g ? { ...g, phase: 'end' } : g))
        await sleep(getAnimDurationMs('--anim-card-fly-duration', 2000))
        if (cancelled) return
      }
      setEnemyGhost(null)

      // Phase 3: only now reveal the next enemy (or the win screen), and
      // explicitly trigger its flip-in — the enemy underneath was already
      // the new one the whole time, we just held it hidden/frozen until now.
      setFrozenEnemy(null)
      setHideEnemySlot(false)
      setFlipTrigger((t) => t + 1)
      await sleep(getAnimDurationMs('--anim-flip-duration', 1200))
      if (cancelled) return
      setIsAnimatingDefeat(false)
    }

    choreograph()
    return () => {
      cancelled = true
      setBattleGhost(null)
      setEnemyGhost(null)
      setFrozenEnemy(null)
      setHideEnemySlot(false)
      setIsAnimatingDefeat(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  if (!state) return null

  const toggleCard = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const isPlaying = state.status === 'playing'
  const isDefense = state.phase === 'awaiting_defense'
  const sortedHand = sortHand(state.hand, sortMode)

  const legalPlay = !isDefense ? getLegalPlay(state, selectedIds) : null
  const selectedCards = selectedIds
    .map((id) => state.hand.find((h) => h.id === id))
    .filter((c): c is CardModel => Boolean(c))
  const selectedTotal = selectedCards.reduce((sum, c) => sum + cardValue(c.rank), 0)

  const amountRequired = state.pendingDefense?.amountRequired ?? 0
  const isOverDiscarding =
    isDefense && selectedTotal >= amountRequired && hasRedundantDiscard(selectedCards, amountRequired)

  const handleAttack = () => {
    if (!legalPlay?.valid) return
    dispatch({ type: 'PLAY_CARDS', cardIds: selectedIds })
    setSelectedIds([])
  }

  const handleYield = () => {
    dispatch({ type: 'YIELD' })
    setSelectedIds([])
  }

  const handleConfirmDefense = () => {
    if (!state.pendingDefense || selectedTotal < amountRequired || isOverDiscarding) return

    // Measure each discarded card's current hand position *before* dispatch
    // removes it from the DOM, so the ghost can fly from exactly there.
    const discardEnd = toRect(discardPileRef.current)
    if (discardEnd) {
      const ghosts = selectedCards
        .map((c): DiscardGhost | null => {
          const start = toRect(handSlotRefs.current.get(c.id) ?? null)
          return start ? { card: c, start, end: discardEnd, phase: 'start' } : null
        })
        .filter((g): g is DiscardGhost => g !== null)
      if (ghosts.length > 0) animateDiscardGhosts(ghosts)
    }

    dispatch({ type: 'PAY_DEFENSE', cardIds: selectedIds })
    setSelectedIds([])
  }

  const handleProtection = () => {
    dispatch({ type: 'USE_PROTECTION', timing: isDefense ? 'preDamage' : 'preTurn' })
    setSelectedIds([])
  }

  return (
    <div className="board">
      <Header seed={state.seed} onMenu={onMenu} />
      <div className="board__grid">
        <aside className="board__piles">
          <SpellsDeck ref={spellsDeckRef} count={spellsDeckCount(state)} />
          <DiscardPile ref={discardPileRef} state={state} />
          <ProtectionDots
            charges={state.protectionCharges}
            canUse={isPlaying && (state.phase === 'awaiting_action' || isDefense)}
            onUse={handleProtection}
          />
        </aside>

        <section className="board__center">
          <CastleArea
            state={state}
            enemyCardRef={enemyCardRef}
            frozenEnemy={frozenEnemy}
            hideEnemy={hideEnemySlot}
            flipTrigger={flipTrigger}
          />
          <TurnBanner
            state={state}
            errorText={
              isOverDiscarding
                ? `You only need ${amountRequired} — you have ${selectedTotal}. Remove a spell.`
                : undefined
            }
          />
          <BattleArea ref={battleAreaRef} groups={state.battleArea} />

          <div className="board__hand-dock">
            <HandSortToggle mode={sortMode} onToggle={() => setSortMode((m) => (m === 'suit' ? 'rank' : 'suit'))} />
            <Hand
              cards={sortedHand}
              selectedIds={selectedIds}
              onToggle={toggleCard}
              disabled={!isPlaying}
              registerSlotRef={registerHandSlotRef}
            />
            {isPlaying &&
              (isDefense ? (
                <ActionBar
                  mode="defense"
                  selectedTotal={selectedTotal}
                  amountRequired={amountRequired}
                  canConfirm={selectedTotal >= amountRequired && !isOverDiscarding}
                  onConfirm={handleConfirmDefense}
                />
              ) : (
                <ActionBar
                  mode="attack"
                  canAttack={Boolean(legalPlay?.valid)}
                  onAttack={handleAttack}
                  onYield={handleYield}
                />
              ))}
          </div>
        </section>

        <aside className="board__side">
          <GameLog log={state.log} />
        </aside>
      </div>

      {battleGhost && (
        <div className="ghost ghost--battle" style={battleGhostStyle(battleGhost, 0.6)}>
          <BattleArea groups={battleGhost.groups} />
        </div>
      )}

      {enemyGhost && (
        <div className="ghost" style={ghostStyle(enemyGhost, 0.6)}>
          <EnemyCard enemy={{ card: enemyGhost.card, damageTaken: 0, spadesShield: 0 }} remainingHealth={0} effectiveAttack={0} />
        </div>
      )}

      {discardGhosts.map((g) => (
        <div key={g.card.id} className="ghost" style={ghostStyle(g, 0.7)}>
          <Card card={g.card} size="md" />
        </div>
      ))}

      {!isAnimatingDefeat && <WinLoseOverlay state={state} onNewGame={onMenu} />}
    </div>
  )
}
