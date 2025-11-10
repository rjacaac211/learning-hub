import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getNodes } from '../lib/api'
import { Card, CardSubtitle, CardTitle } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'

function fileTypeOf(mime) {
  if (!mime) return 'other'
  if (mime.includes('pdf')) return 'pdf'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('audio/')) return 'audio'
  return 'other'
}

export default function Library() {
  const params = useParams()
  const navigate = useNavigate()
  const splat = params['*'] || ''
  const currentPath = ('/' + splat).replace(/\/+/g, '/')

  const [nodes, setNodes] = useState({ path: '/', name: '', dirs: [], files: [] })
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Learning Hub — Library'
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
    let list = nodes.files
    if (type !== 'all') list = list.filter(f => fileTypeOf(f.mime) === type)
    if (!q) return list
    return list.filter(f => f.name.toLowerCase().includes(q))
  }, [nodes, query, type])

  const isEmpty = !loading && !error && filteredDirs.length === 0 && filteredFiles.length === 0

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1>Library</h1>
        <div className="sm:ml-auto flex items-center gap-2 w-full sm:w-auto">
          <input
            type="search"
            placeholder="Search in this folder..."
            className="w-full sm:w-80 px-3 py-2 border border-border rounded-md focus-visible:ring-2 focus-visible:ring-accent"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="hidden sm:flex items-center gap-1">
            {['all', 'pdf', 'video', 'image', 'audio'].map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`h-9 px-3 rounded-md border ${type === t ? 'bg-accent text-fg-inverted border-accent' : 'border-border text-fg-muted hover:text-fg'}`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {error && <div className="mt-6 text-red-600">{error}</div>}

      {isEmpty && (
        <EmptyState
          title="No results"
          subtitle="Try a different search or navigate up."
          action={<Link className="h-9 inline-flex items-center px-4 rounded-md border border-border" to="/library">Go to root</Link>}
        />
      )}

      {!loading && !error && !isEmpty && (
        <>
          {filteredDirs.length > 0 && (
            <>
              <h3 className="mt-8 text-sm font-medium text-fg-muted">Folders</h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDirs.map(d => (
                  <Card key={d.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/library${d.path}`)}>
                    <CardSubtitle>Folder</CardSubtitle>
                    <CardTitle className="mt-1">{d.name}</CardTitle>
                  </Card>
                ))}
              </div>
            </>
          )}

          {filteredFiles.length > 0 && (
            <>
              <h3 className="mt-10 text-sm font-medium text-fg-muted">Files</h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiles.map(f => (
                  <Card key={f.path}>
                    <CardSubtitle className="capitalize">{fileTypeOf(f.mime)}</CardSubtitle>
                    <CardTitle className="mt-1 truncate">{f.name}</CardTitle>
                    <div className="mt-3">
                      <a
                        href={`/files${f.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center h-9 px-3 rounded-md bg-accent text-fg-inverted hover:bg-accent-hover"
                      >
                        Open
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {(filteredDirs.length > 0 || filteredFiles.length > 0) && (
            <div className="mt-8 text-sm text-fg-muted">
              <nav className="flex items-center gap-1">
                <span>Path:</span>
                <Link className="hover:underline" to="/library">Root</Link>
                {currentPath.split('/').filter(Boolean).map((p, i, arr) => {
                  const to = '/library/' + arr.slice(0, i + 1).join('/')
                  return (
                    <span key={to} className="flex items-center gap-1">
                      <span>/</span>
                      <Link className="hover:underline" to={to}>{p}</Link>
                    </span>
                  )
                })}
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}


