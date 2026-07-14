import './ColorFilterOverlay.css'

interface ColorFilterOverlayProps {
  color: string | null
}

export function ColorFilterOverlay({ color }: ColorFilterOverlayProps) {
  if (!color) return null

  return <div className="color-filter-overlay" style={{ backgroundColor: color }} />
}
