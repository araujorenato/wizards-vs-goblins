import { SUIT_ICONS } from '../../game/format'
import type { Suit } from '../../game/types'
import './RulesModal.css'

const SUIT_INFO: { suit: Suit; name: string; effect: string }[] = [
  { suit: 'hearts', name: 'Mana', effect: 'Heal: returns discarded cards to the top of the spells deck.' },
  { suit: 'diamonds', name: 'Energy', effect: 'Draw: pulls extra cards from the spells deck into your hand.' },
  { suit: 'clubs', name: 'Missile', effect: 'Doubles the damage dealt to the enemy on this play.' },
  { suit: 'spades', name: 'Break', effect: "Reduces the enemy's attack by the value played." },
]

export function RulesModal() {
  return (
    <div className="rules-modal">
      <h2 className="rules-modal__title">Rules</h2>
      <div className="rules-modal__body">
        <section className="rules-modal__section">
          <h3 className="rules-modal__heading">Objective</h3>
          <p>Defeat all 12 enemies in the goblin dungeon (warrior, guardian and Goblin King of each suit) before your spells run out.</p>
        </section>
        <section className="rules-modal__section">
          <h3 className="rules-modal__heading">How to attack</h3>
          <p>
            Play 1 card, or combine 2 to 4 cards of the same rank (summing up to 10) to attack the enemy. An Ace is
            worth 1 and can only be paired with exactly 1 other card.
          </p>
        </section>
        <section className="rules-modal__section">
          <h3 className="rules-modal__heading">Defense</h3>
          <p>If the enemy survives, it counterattacks: discard cards whose total value covers the damage taken.</p>
        </section>
        <section className="rules-modal__section">
          <h3 className="rules-modal__heading">Protection</h3>
          <p>You have 2 protection charges: they discard and refill your hand, before your turn or before damage.</p>
        </section>
        <section className="rules-modal__section">
          <h3 className="rules-modal__heading">Suits and effects</h3>
          <ul className="rules-modal__suits">
            {SUIT_INFO.map(({ suit, name, effect }) => (
              <li key={suit} className="rules-modal__suit">
                <img className="rules-modal__suit-icon" src={SUIT_ICONS[suit]} alt={name} />
                <div>
                  <strong>{name}</strong>
                  <p>{effect}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rules-modal__section">
          <h3 className="rules-modal__heading">Suit immunity</h3>
          <p>
            Each enemy is immune to its own suit: if you attack with cards of that suit, the suit's special effect
            is nullified — the attack value is still dealt as damage, just without the bonus.
          </p>
        </section>
      </div>
      <div className="rules-modal__attribution">
        <p>
          Inspired by the mechanics of Regicide, a card game created by Paul Abrahams, Luke Badger, and Andy
          Richdale, and published by Badgers From Mars. This is an independent, unofficial project.
        </p>
      </div>
    </div>
  )
}
