import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNodes } from '../lib/api'
import { Card, CardTitle } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'

export default function Library() {
  const params = useParams()
  const navigate = useNavigate()
  const splat = params['*'] || ''
  const currentPath = ('/' + splat).replace(/\/+/g, '/')

  const [nodes, setNodes] = useState({ path: '/', name: '', dirs: [], files: [] })
  const [query, setQuery] = useState('')
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

  const isEmpty = !loading && !error && filteredDirs.length === 0

  const segments = currentPath.split('/').filter(Boolean)
  const isRoot = segments.length === 0
  function goUp() {
    if (isRoot) return
    const parent = segments.slice(0, -1).join('/')
    navigate(parent ? `/library/${parent}` : '/library')
  }

  return (
    <div className="relative">
      {/* page-specific soft blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 right-10 w-[360px] h-[360px] bg-gradient-to-br from-sky-400/15 to-purple-500/15 blur-3xl rounded-full" />
      </div>
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {!isRoot && (
            <button onClick={goUp} className="h-8 px-3 rounded-md bg-gradient-to-r from-accent/90 to-sky-500/90 text-white text-sm hover:opacity-90">
              ← Back
            </button>
          )}
          <nav className="text-sm text-fg flex items-center flex-wrap gap-1 bg-white/60 backdrop-blur-sm rounded-md px-2 py-1 border border-white/0 shadow-sm">
            <button onClick={() => navigate('/library')} className="hover:underline">Home</button>
            {segments.map((seg, i) => {
              const to = '/library/' + segments.slice(0, i + 1).join('/')
              return (
                <span key={to} className="flex items-center gap-1">
                  <span className="text-fg-muted">›</span>
                  <button onClick={() => navigate(to)} className="hover:underline">{decodeURIComponent(seg)}</button>
                </span>
              )
            })}
          </nav>
        </div>
        <div>
          <input
            type="search"
            placeholder="Search in this folder..."
            className="w-full sm:w-80 px-3 py-2 rounded-md bg-white/60 backdrop-blur-sm border border-white/0 shadow-sm focus-visible:ring-2 focus-visible:ring-accent"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
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
          subtitle="Try a different search."
        />
      )}

      {!loading && !error && !isEmpty && (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDirs.map(d => (
              <Card key={d.path} interactive className="cursor-pointer" onClick={() => navigate(`/library${d.path}`)}>
                <CardTitle className="truncate">{d.name}</CardTitle>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


