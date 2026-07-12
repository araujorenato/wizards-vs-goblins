import './ActionBar.css'

interface AttackModeProps {
  mode: 'attack'
  canAttack: boolean
  onAttack: () => void
  onYield: () => void
}

interface DefenseModeProps {
  mode: 'defense'
  selectedTotal: number
  amountRequired: number
  canConfirm: boolean
  onConfirm: () => void
}

type ActionBarProps = AttackModeProps | DefenseModeProps

export function ActionBar(props: ActionBarProps) {
  if (props.mode === 'attack') {
    return (
      <div className="action-bar">
        <button type="button" className="action-bar__primary" disabled={!props.canAttack} onClick={props.onAttack}>
          Attack
        </button>
        <button type="button" className="action-bar__secondary" onClick={props.onYield}>
          Yield
        </button>
      </div>
    )
  }

  return (
    <div className="action-bar">
      <p className="action-bar__hint">
        {props.selectedTotal} / {props.amountRequired} discarded
      </p>
      <button type="button" className="action-bar__primary" disabled={!props.canConfirm} onClick={props.onConfirm}>
        Confirm Discard
      </button>
    </div>
  )
}
