import './ProtectionDots.css'

interface ProtectionDotsProps {
  charges: [boolean, boolean]
  canUse: boolean
  onUse: () => void
}

export function ProtectionDots({ charges, canUse, onUse }: ProtectionDotsProps) {
  const available = charges.filter(Boolean).length

  return (
    <div className="protections">
      <div className="protections__dots" aria-hidden="true">
        {charges.map((isAvailable, i) => (
          <span key={i} className={`protections__dot ${isAvailable ? 'protections__dot--filled' : ''}`} />
        ))}
      </div>
      <button
        type="button"
        className="protections__button"
        disabled={!canUse || available === 0}
        onClick={onUse}
        title="Discard your hand and refill to 8 spells"
      >
        {available} protection{available === 1 ? '' : 's'} (jokers)
      </button>
    </div>
  )
}
