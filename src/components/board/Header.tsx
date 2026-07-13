import { useState } from 'react'
import './Header.css'

interface HeaderProps {
  seed: string
  onMenu: () => void
  onOpenLog: () => void
  onOpenRules: () => void
}

export function Header({ seed, onMenu, onOpenLog, onOpenRules }: HeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(seed)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable; nothing more we can do offline.
    }
  }

  return (
    <header className="header">
      <div className="header__brand">
        <button type="button" className="header__logo" onClick={onMenu} aria-label="Open menu">
          <img src="/assets/logo.svg" alt="Regicide" className="header__logo-img" />
        </button>
        <button type="button" className="header__rules-button" onClick={onOpenRules} aria-label="Open rules">
          Rules
        </button>
      </div>
      <div className="header__seed">
        <span className="header__seed-text">Seed: {seed}</span>
        <button type="button" className="header__copy" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button type="button" className="header__log-button" onClick={onOpenLog} aria-label="Open game log">
        Log
      </button>
    </header>
  )
}
