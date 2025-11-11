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

function getAuthHeaders() {
  const token = localStorage.getItem('learningHubToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleJson(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export async function createFolder(parentPath, name) {
  const res = await fetch('/api/admin/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ parentPath, name })
  })
  return handleJson(res)
}

export async function renameFolder(path, newName) {
  const res = await fetch('/api/admin/folders/rename', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ path, newName })
  })
  return handleJson(res)
}

export async function deleteFolder(path) {
  const res = await fetch('/api/admin/folders', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ path })
  })
  return handleJson(res)
}

export async function uploadFile(path, file) {
  const form = new FormData()
  form.set('path', path)
  form.set('file', file)
  const res = await fetch('/api/admin/files/upload', {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: form
  })
  return handleJson(res)
}

export async function renameFile(path, newName) {
  const res = await fetch('/api/admin/files/rename', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ path, newName })
  })
  return handleJson(res)
}

export async function deleteFile(path) {
  const res = await fetch('/api/admin/files', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ path })
  })
  return handleJson(res)
}

// --- Dictionary API ---
export async function searchDictionary(query, limit = 20) {
  const url = new URL('/api/dictionary/search', window.location.origin)
  url.searchParams.set('query', String(query || ''))
  if (limit) url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString())
  if (!res.ok) {
    // On server error, degrade gracefully
    return []
  }
  return res.json()
}

export async function getDictionaryWord(word) {
  const safe = encodeURIComponent(String(word || ''))
  const res = await fetch(`/api/dictionary/word/${safe}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Not found')
  }
  return res.json()
}



