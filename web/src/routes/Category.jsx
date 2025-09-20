import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getModules } from '../lib/api'
import { mb, titleFromSlug, relToBreadcrumb } from '../lib/format'
import FileItem from '../ui/FileItem'

const VALID = ['english', 'math', 'science']

export default function Category() {
  const { slug } = useParams()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const debounceRef = useRef(null)
  const [modules, setModules] = useState([])
  const [loaded, setLoaded] = useState(false)

  const title = titleFromSlug(slug)

  useEffect(() => {
    document.title = `Learning Hub — ${title}`
  }, [title])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const all = await getModules()
      if (!cancelled) {
        setModules(all)
        setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const prefix = `/${slug.toLowerCase()}/`
    const q = debounced.trim().toLowerCase()
    return modules.filter(item => {
      if (!item.rel.toLowerCase().startsWith(prefix)) return false
      if (!q) return true
      const name = item.name.toLowerCase()
      const lastSeg = item.rel.split('/').pop().toLowerCase()
      return name.includes(q) || lastSeg.includes(q)
    })
  }, [modules, slug, debounced])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  if (!VALID.includes(slug?.toLowerCase())) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-2">Category not found</h2>
        <p className="text-gray-600">Try one of the known categories.</p>
        <Link className="inline-block mt-4 text-blue-600" to="/categories">Back to categories</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <input
          type="search"
          placeholder="Search..."
          className="ml-auto w-full sm:w-72 px-3 py-2 border border-gray-300 rounded focus-visible:ring-2 focus-visible:ring-blue-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      {!loaded && <div className="text-gray-500">Loading...</div>}
      {loaded && filtered.length === 0 && (
        <div className="text-gray-500">No results. Try a different search.</div>
      )}
      <ul className="divide-y divide-gray-200">
        {filtered.map(item => (
          <FileItem key={item.rel} item={item} />
        ))}
      </ul>
    </div>
  )
}


