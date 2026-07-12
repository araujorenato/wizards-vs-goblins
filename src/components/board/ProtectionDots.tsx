import './ProtectionDots.css'

interface ProtectionDotsProps {
  charges: [boolean, boolean]
  canUse: boolean
  onUse: () => void
  /** Compact form used in the mobile hand-sort row: just "Protection" next
   * to the dots instead of the full descriptive sentence. */
  compact?: boolean
}

export function ProtectionDots({ charges, canUse, onUse, compact }: ProtectionDotsProps) {
  const available = charges.filter(Boolean).length

  return (
    <div className={compact ? 'protections protections--compact' : 'protections'}>
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
        {compact ? 'Protection' : `${available} protection${available === 1 ? '' : 's'} (jokers)`}
      </button>
    </div>
  )
}
