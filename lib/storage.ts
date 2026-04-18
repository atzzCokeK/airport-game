const KEY = 'airport.progress'

export function getMaxClearedStage(): number {
  try {
    const v = localStorage.getItem(KEY)
    return v ? parseInt(v, 10) : 0
  } catch {
    return 0
  }
}

export function saveProgress(clearedStage: number) {
  try {
    const cur = getMaxClearedStage()
    if (clearedStage > cur) {
      localStorage.setItem(KEY, String(clearedStage))
    }
  } catch {}
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
