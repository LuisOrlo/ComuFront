type Entry<T> = { expiresAt: number; value: Promise<T> }

const cache = new Map<string, Entry<unknown>>()
const TTL_MS = 15_000

export function getCachedAvailability<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const current = cache.get(key) as Entry<T> | undefined
  if (current && current.expiresAt > now) return current.value
  const value = loader()
  cache.set(key, { value, expiresAt: now + TTL_MS })
  value.catch(() => cache.delete(key))
  return value
}

export function clearAvailabilityCache(prefix?: string): void {
  if (!prefix) { cache.clear(); return }
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key)
}
