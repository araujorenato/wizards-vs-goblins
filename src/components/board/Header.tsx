import { useState } from 'react'
import './Header.css'

interface HeaderProps {
  seed: string
  onMenu: () => void
}

export function Header({ seed, onMenu }: HeaderProps) {
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
      <button type="button" className="header__logo" onClick={onMenu} aria-label="Open menu">
        <img src="/assets/logo.svg" alt="Regicide" className="header__logo-img" />
      </button>
      <div className="header__seed">
        <span className="header__seed-text">Seed: {seed}</span>
        <button type="button" className="header__copy" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </header>
  )
}
