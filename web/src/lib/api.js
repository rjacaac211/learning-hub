let cache = null

export async function getModules() {
  if (cache) return cache
  const res = await fetch('/api/modules')
  if (!res.ok) throw new Error('Failed to fetch modules')
  cache = await res.json()
  return cache
}



