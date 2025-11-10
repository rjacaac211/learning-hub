export async function auth(role, password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, password })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Authentication failed')
  }
  return res.json()
}

export async function getNodes(pathname = '/') {
  const url = new URL('/api/nodes', window.location.origin)
  url.searchParams.set('path', pathname || '/')
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch nodes')
  return res.json()
}



