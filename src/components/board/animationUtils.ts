export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Resolves after the browser has painted the current frame, so a style set
 * just before this can be the animation's real starting point (classic FLIP). */
export const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

/**
 * Reads an animation duration straight from the CSS custom property defined
 * in `src/styles/global.css` (e.g. "--anim-card-fly-duration: 2s"), so JS
 * choreography (which needs to know *when* a CSS transition finishes) always
 * matches whatever the CSS says — edit the duration in one place (the CSS
 * variable) and both the visual transition and the JS timing follow.
 */
export function getAnimDurationMs(cssVarName: string, fallbackMs: number): number {
  if (typeof document === 'undefined') return fallbackMs
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim()
  if (!raw) return fallbackMs
  const value = parseFloat(raw)
  if (Number.isNaN(value)) return fallbackMs
  return raw.endsWith('ms') ? value : value * 1000
}
