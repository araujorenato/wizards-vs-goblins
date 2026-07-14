const STORAGE_KEY = 'wizards-vs-goblins:color-filter'

export const COLOR_FILTER_OPTIONS = [
  'rgb(229, 254, 255)',
  'rgb(1, 235, 97)',
  'rgb(253, 202, 85)',
  'rgb(136, 215, 222)',
  'rgb(235, 229, 206)',
  'rgb(255, 255, 255)',
]

export function loadColorFilterIndex(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const index = Number(raw)
    return Number.isInteger(index) && index >= 0 && index < COLOR_FILTER_OPTIONS.length ? index : null
  } catch {
    return null
  }
}

export function saveColorFilterIndex(index: number | null): void {
  try {
    if (index === null) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, String(index))
    }
  } catch {
    // Storage unavailable (private mode, quota, etc.) — silently skip persistence.
  }
}
