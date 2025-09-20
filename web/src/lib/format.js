export function mb(bytes) {
  return bytes ? `(${(bytes / 1e6).toFixed(1)} MB)` : ''
}

export function titleFromSlug(slug) {
  const s = (slug || '').toLowerCase()
  if (s === 'english') return 'English'
  if (s === 'math') return 'Math'
  if (s === 'science') return 'Science'
  return 'Unknown'
}

export function relToBreadcrumb(rel) {
  if (!rel) return ''
  const parts = rel.replace(/^\//, '').split('/')
  // Show all but filename for breadcrumbs
  const crumbs = parts.slice(0, Math.max(1, parts.length - 1))
  return crumbs.join(' / ')
}



