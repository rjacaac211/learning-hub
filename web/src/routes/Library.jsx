import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNodes, createFolder, renameFolder, deleteFolder, uploadFile, renameFile, deleteFile } from '../lib/api'
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

  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('learningHubRole') === 'admin' && !!localStorage.getItem('learningHubToken')
  const fileInputRef = useRef(null)

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
    const allowed = nodes.files.filter(f => {
      const mime = String(f.mime || '').toLowerCase()
      if (f.name.toLowerCase().startsWith('readme')) return false
      return mime.includes('pdf') || mime.startsWith('video/')
    })
    if (!q) return allowed
    return allowed.filter(f => f.name.toLowerCase().includes(q))
  }, [nodes, query])

  const isEmpty = !loading && !error && filteredDirs.length === 0 && filteredFiles.length === 0

  const segments = currentPath.split('/').filter(Boolean)
  const isRoot = segments.length === 0
  function goUp() {
    if (isRoot) return
    const parent = segments.slice(0, -1).join('/')
    navigate(parent ? `/library/${parent}` : '/library')
  }

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const data = await getNodes(currentPath)
      setNodes(data)
    } catch (err) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function onNewFolder() {
    const name = window.prompt('New folder name:')
    if (!name) return
    try {
      await createFolder(currentPath, name)
      refresh()
    } catch (err) {
      alert(err.message || 'Failed to create folder')
    }
  }

  function onUploadClick() {
    fileInputRef.current?.click()
  }

  async function onFileChosen(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await uploadFile(currentPath, file)
      refresh()
    } catch (err) {
      alert(err.message || 'Failed to upload file')
    }
  }

  async function onRenameFolder(path) {
    const newName = window.prompt('Rename folder to:')
    if (!newName) return
    try {
      await renameFolder(path, newName)
      refresh()
    } catch (err) {
      alert(err.message || 'Failed to rename folder')
    }
  }

  async function onDeleteFolder(path) {
    if (!window.confirm('Delete this folder? Only empty folders can be deleted.')) return
    try {
      await deleteFolder(path)
      refresh()
    } catch (err) {
      alert(err.message || 'Failed to delete folder')
    }
  }

  async function onRenameFile(path) {
    const newName = window.prompt('Rename file to (keep .pdf or .mp4):')
    if (!newName) return
    try {
      await renameFile(path, newName)
      refresh()
    } catch (err) {
      alert(err.message || 'Failed to rename file')
    }
  }

  async function onDeleteFile(path) {
    if (!window.confirm('Delete this file?')) return
    try {
      await deleteFile(path)
      refresh()
    } catch (err) {
      alert(err.message || 'Failed to delete file')
    }
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
          {isAdmin && (
            <div className="ml-auto flex items-center gap-2">
              <button onClick={onNewFolder} className="h-8 px-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm hover:opacity-90">
                + New Folder
              </button>
              <button onClick={onUploadClick} className="h-8 px-3 rounded-md bg-gradient-to-r from-indigo-500 to-sky-500 text-white text-sm hover:opacity-90">
                ⬆ Upload
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.mp4" onChange={onFileChosen} className="hidden" />
            </div>
          )}
        </div>
        <div>
          <input
            type="search"
            placeholder="Search in this folder..."
            className="w-full sm:w-[28rem] lg:w-[36rem] px-3 py-2 rounded-md bg-white/60 backdrop-blur-sm border border-white/0 shadow-sm focus-visible:ring-2 focus-visible:ring-accent"
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
                {isAdmin && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onRenameFolder(d.path) }} className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">Rename</button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(d.path) }} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:opacity-90">Delete</button>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {filteredFiles.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map(f => {
                const mime = String(f.mime || '').toLowerCase()
                const isPdf = mime.includes('pdf')
                const isVideo = mime.startsWith('video/')
                if (isPdf) {
                  return (
                    <div key={f.path} onClick={() => navigate(`/pdf${f.path}`)}>
                      <Card interactive className="cursor-pointer">
                        <CardTitle className="truncate">{f.name}</CardTitle>
                        {isAdmin && (
                          <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => onRenameFile(f.path)} className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">Rename</button>
                            <button onClick={() => onDeleteFile(f.path)} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:opacity-90">Delete</button>
                          </div>
                        )}
                      </Card>
                    </div>
                  )
                }
                if (isVideo) {
                  return (
                    <div key={f.path} onClick={() => navigate(`/video${f.path}`)}>
                      <Card interactive className="cursor-pointer">
                        <CardTitle className="truncate">{f.name}</CardTitle>
                        {isAdmin && (
                          <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => onRenameFile(f.path)} className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">Rename</button>
                            <button onClick={() => onDeleteFile(f.path)} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:opacity-90">Delete</button>
                          </div>
                        )}
                      </Card>
                    </div>
                  )
                }
                return (
                  <a key={f.path} href={`/files${f.path}`} target="_blank" rel="noreferrer">
                    <Card interactive className="cursor-pointer">
                      <CardTitle className="truncate">{f.name}</CardTitle>
                      {isAdmin && (
                        <div className="mt-2 flex gap-2">
                          <button onClick={(e) => { e.preventDefault(); onRenameFile(f.path) }} className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">Rename</button>
                          <button onClick={(e) => { e.preventDefault(); onDeleteFile(f.path) }} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:opacity-90">Delete</button>
                        </div>
                      )}
                    </Card>
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}


