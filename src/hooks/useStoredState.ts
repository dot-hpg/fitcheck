import { useEffect, useState } from 'react'

/**
 * useState that survives reloads via localStorage. Storage can be missing or
 * throw (private windows, blocked cookies), so every access is guarded and the
 * app keeps working with plain in-memory state.
 */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage unavailable; nothing to do.
    }
  }, [key, value])
  return [value, setValue] as const
}
