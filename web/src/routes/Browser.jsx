import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getNodes } from '../lib/api'

function iconForMime(mime) {
  if (!mime) return '📄'
  if (mime.includes('pdf')) return '📕'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.startsWith('audio/')) return '🎵'
  return '📄'
}

function Breadcrumbs({ path }) {
  const parts = (path || '/').replace(/^\/+/, '').split('/').filter(Boolean)
  const crumbs = [{ name: 'Root', path: '/' }]
  let acc = ''
  for (const p of parts) {
    acc += '/' + p
    crumbs.push({ name: p, path: acc })
  }
  return (
    <nav className="text-sm text-gray-600 flex items-center gap-1">
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1">
          {i > 0 && <span>/</span>}
          <Link className="hover:underline" to={`/browser${c.path === '/' ? '' : c.path}`}>{c.name}</Link>
        </span>
      ))}
    </nav>
  )
}

export default function Browser() {
  const params = useParams()
  const navigate = useNavigate()
  const splat = params['*'] || ''
  const currentPath = ('/' + splat).replace(/\/+/g, '/')

  const [nodes, setNodes] = useState({ path: '/', name: '', dirs: [], files: [] })
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Learning Hub — Browser'
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getNodes(currentPath)
      .then(data => { if (!cancelled) setNodes(data) })
      .catch(err => { if (!cancelled) setError(err.message || 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [currentPath])

  const filteredDirs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return nodes.dirs
    return nodes.dirs.filter(d => d.name.toLowerCase().includes(q))
  }, [nodes, query])

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return nodes.files
    return nodes.files.filter(f => f.name.toLowerCase().includes(q))
  }, [nodes, query])

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-2xl font-semibold">Browse</h2>
        <input
          type="search"
          placeholder="Search in this folder..."
          className="ml-auto w-full sm:w-80 px-3 py-2 border border-gray-300 rounded focus-visible:ring-2 focus-visible:ring-blue-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <Breadcrumbs path={nodes.path} />
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <>
          <ul className="divide-y divide-gray-200 mb-6">
            {filteredDirs.map(d => (
              <li key={d.path} className="py-3 flex items-center gap-3">
                <div className="text-xl" aria-hidden>📁</div>
                <button
                  onClick={() => navigate(`/browser${d.path}`)}
                  className="text-left font-medium text-blue-700 hover:text-blue-900"
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>

          <ul className="divide-y divide-gray-200">
            {filteredFiles.map(f => (
              <li key={f.path} className="py-3 flex items-start gap-3">
                <div className="text-xl leading-none select-none" aria-hidden>{iconForMime(f.mime)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <a
                      href={`/files${f.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-medium text-blue-700 hover:text-blue-900"
                    >
                      {f.name}
                    </a>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {f.size ? `(${(f.size / 1e6).toFixed(1)} MB)` : ''}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}



