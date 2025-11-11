import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNodes, createFolder, renameFolder, deleteFolder, uploadFile, renameFile, deleteFile } from '../lib/api'
import { Card, CardTitle } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import { showToast } from '../ui/toastBus'

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
    document.title = 'The Solar Archive — Library'
  }, [])

  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('learningHubRole') === 'admin' && !!localStorage.getItem('learningHubToken')
  const fileInputRef = useRef(null)

  // In-app dialogs state
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderLoading, setNewFolderLoading] = useState(false)

  const [renameState, setRenameState] = useState(null) // { kind:'folder'|'file', path, currentName, newName, ext? }
  const [renameLoading, setRenameLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // { kind:'folder'|'file', path, name }
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

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
    setNewFolderName('')
    setNewFolderOpen(true)
  }

  function onUploadClick() {
    if (isRoot) {
      showToast('Open a folder to upload files.', 'warn')
      return
    }
    fileInputRef.current?.click()
  }

  async function onFileChosen(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setUploading(true)
      await uploadFile(currentPath, file)
      showToast('File uploaded')
      refresh()
    } catch (err) {
      showToast(err.message || 'Failed to upload file', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function onRenameFolder(path) {
    const currentName = decodeURIComponent(path.split('/').pop() || '')
    setRenameState({ kind: 'folder', path, currentName, newName: currentName })
  }

  async function onDeleteFolder(path) {
    const name = decodeURIComponent(path.split('/').pop() || 'folder')
    setConfirmDelete({ kind: 'folder', path, name })
  }

  async function onRenameFile(path) {
    const currentName = decodeURIComponent(path.split('/').pop() || '')
    const dot = currentName.lastIndexOf('.')
    const base = dot > 0 ? currentName.slice(0, dot) : currentName
    const ext = dot > 0 ? currentName.slice(dot) : ''
    setRenameState({ kind: 'file', path, currentName, newName: base, ext })
  }

  async function onDeleteFile(path) {
    const name = decodeURIComponent(path.split('/').pop() || 'file')
    setConfirmDelete({ kind: 'file', path, name })
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
        <div className="mt-10 flex flex-col items-center justify-center gap-4">
          <EmptyState
            title="This folder is empty"
            subtitle={isAdmin ? 'Upload a PDF or MP4 to get started.' : 'No content here yet.'}
          />
          {isAdmin && !isRoot && (
            <button
              onClick={onUploadClick}
              className="h-10 px-5 rounded-md bg-gradient-to-r from-accent/70 to-sky-500/70 text-white text-sm hover:from-accent/80 hover:to-sky-600/80 transition"
            >
              ⬆ Upload file
            </button>
          )}
        </div>
      )}

      {!loading && !error && !isEmpty && (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDirs.map(d => (
              <Card key={d.path} interactive className="cursor-pointer" onClick={() => navigate(`/library${d.path}`)}>
                <CardTitle className="truncate">{d.name}</CardTitle>
                {isAdmin && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onRenameFolder(d.path) }} className="text-xs px-2 py-1 rounded-md border border-border bg-white text-fg hover:opacity-90">Rename</button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(d.path) }} className="text-xs px-2 py-1 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 text-white hover:opacity-90">Delete</button>
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
                            <button onClick={() => onRenameFile(f.path)} className="text-xs px-2 py-1 rounded-md border border-border bg-white text-fg hover:opacity-90">Rename</button>
                            <button onClick={() => onDeleteFile(f.path)} className="text-xs px-2 py-1 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 text-white hover:opacity-90">Delete</button>
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
                            <button onClick={() => onRenameFile(f.path)} className="text-xs px-2 py-1 rounded-md border border-border bg-white text-fg hover:opacity-90">Rename</button>
                            <button onClick={() => onDeleteFile(f.path)} className="text-xs px-2 py-1 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 text-white hover:opacity-90">Delete</button>
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
                          <button onClick={(e) => { e.preventDefault(); onRenameFile(f.path) }} className="text-xs px-2 py-1 rounded-md border border-border bg-white text-fg hover:opacity-90">Rename</button>
                          <button onClick={(e) => { e.preventDefault(); onDeleteFile(f.path) }} className="text-xs px-2 py-1 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 text-white hover:opacity-90">Delete</button>
                        </div>
                      )}
                    </Card>
                  </a>
                )
              })}
              {isAdmin && !isRoot && (
                <div
                  onClick={!uploading ? onUploadClick : undefined}
                  className={`rounded-lg bg-gradient-to-r from-accent/70 to-sky-600/70 hover:from-accent/80 hover:to-sky-700/80 text-white shadow-card p-5 ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-center h-20 transition`}
                >
                  <div className="text-sm font-medium">{uploading ? 'Uploading...' : '⬆ Upload file'}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <Modal
        open={newFolderOpen}
        title="New folder"
        onClose={() => { if (!newFolderLoading) setNewFolderOpen(false) }}
        footer={(
          <>
            <button onClick={() => setNewFolderOpen(false)} disabled={newFolderLoading} className="h-9 px-4 rounded-md border border-border disabled:opacity-60">Cancel</button>
            <button
              onClick={async () => {
                const name = newFolderName.trim()
                if (!name) return
                try {
                  setNewFolderLoading(true)
                  await createFolder(currentPath, name)
                  showToast('Folder created')
                  setNewFolderOpen(false)
                  setNewFolderName('')
                  refresh()
                } catch (err) {
                  showToast(err.message || 'Failed to create folder', 'error')
                } finally {
                  setNewFolderLoading(false)
                }
              }}
              disabled={newFolderLoading}
              className="h-9 px-4 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white disabled:opacity-60"
            >
              {newFolderLoading ? 'Creating...' : 'Create'}
            </button>
          </>
        )}
      >
        <label className="block text-sm mb-2">Folder name</label>
        <input
          type="text"
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          disabled={newFolderLoading}
          className="w-full px-3 py-2 border border-border rounded focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          placeholder="e.g., Quarter 1"
          autoFocus
        />
      </Modal>

      <Modal
        open={!!renameState}
        title={renameState?.kind === 'file' ? 'Rename file' : 'Rename folder'}
        onClose={() => { if (!renameLoading) setRenameState(null) }}
        footer={(
          <>
            <button onClick={() => setRenameState(null)} disabled={renameLoading} className="h-9 px-4 rounded-md border border-border disabled:opacity-60">Cancel</button>
            <button
              onClick={async () => {
                if (!renameState) return
                const newName = (renameState.newName || '').trim()
                if (!newName) return
                try {
                  setRenameLoading(true)
                  if (renameState.kind === 'folder') {
                    await renameFolder(renameState.path, newName)
                  } else {
                    // Preserve original extension; strip it if user included it
                    const ext = renameState.ext || ''
                    let base = newName
                    if (ext && base.toLowerCase().endsWith(ext.toLowerCase())) {
                      base = base.slice(0, -ext.length)
                    }
                    const finalName = base + ext
                    await renameFile(renameState.path, finalName)
                  }
                  showToast('Renamed')
                  setRenameState(null)
                  refresh()
                } catch (err) {
                  showToast(err.message || 'Failed to rename', 'error')
                } finally {
                  setRenameLoading(false)
                }
              }}
              disabled={renameLoading}
              className="h-9 px-4 rounded-md bg-gradient-to-r from-accent to-sky-500 text-white disabled:opacity-60"
            >
              {renameLoading ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      >
        <label className="block text-sm mb-2">New name</label>
        <input
          type="text"
          value={renameState?.newName || ''}
          onChange={e => setRenameState(s => ({ ...(s || {}), newName: e.target.value }))}
          disabled={renameLoading}
          className="w-full px-3 py-2 border border-border rounded focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          placeholder={renameState?.kind === 'file'
            ? (() => {
                const name = renameState?.currentName || ''
                const dot = name.lastIndexOf('.')
                return dot > 0 ? name.slice(0, dot) : name
              })()
            : (renameState?.currentName || '')}
          autoFocus
        />
        {renameState?.kind === 'file' && (
          <div className="mt-2 text-xs text-fg-muted">File extension will be preserved (e.g., .pdf or .mp4).</div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        title="Confirm delete"
        onClose={() => { if (!deleteLoading) setConfirmDelete(null) }}
        footer={(
          <>
            <button onClick={() => setConfirmDelete(null)} disabled={deleteLoading} className="h-9 px-4 rounded-md border border-border disabled:opacity-60">Cancel</button>
            <button
              onClick={async () => {
                if (!confirmDelete) return
                try {
                  setDeleteLoading(true)
                  if (confirmDelete.kind === 'folder') {
                    await deleteFolder(confirmDelete.path)
                  } else {
                    await deleteFile(confirmDelete.path)
                  }
                  showToast('Deleted')
                  setConfirmDelete(null)
                  refresh()
                } catch (err) {
                  showToast(err.message || 'Failed to delete', 'error')
                } finally {
                  setDeleteLoading(false)
                }
              }}
              disabled={deleteLoading}
              className="h-9 px-4 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 text-white disabled:opacity-60"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </>
        )}
      >
        <div className="text-sm">
          {confirmDelete?.kind === 'folder'
            ? 'Delete this folder? Only empty folders can be deleted.'
            : 'Delete this file?'}
        </div>
        {confirmDelete?.name && <div className="mt-2 text-sm font-medium">{confirmDelete.name}</div>}
      </Modal>
    </div>
  )
}


