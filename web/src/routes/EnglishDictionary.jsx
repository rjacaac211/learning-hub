import React, { useEffect, useMemo, useState } from 'react'
import { searchDictionary, getDictionaryWord } from '../lib/api'
import { Card, CardTitle } from '../ui/Card'
import Skeleton from '../ui/Skeleton'

export default function EnglishDictionary() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [results, setResults] = useState([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [selected, setSelected] = useState('')
  const [entry, setEntry] = useState(null) // { word, definitions }
  const [entryLoading, setEntryLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Learning Hub — English Dictionary'
  }, [])

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  // Fetch search results
  useEffect(() => {
    let cancelled = false
    setError('')
    if (!debounced) {
      setResults([])
      return
    }
    setResultsLoading(true)
    searchDictionary(debounced, 20)
      .then(list => { if (!cancelled) setResults(list || []) })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setResultsLoading(false) })
    return () => { cancelled = true }
  }, [debounced])

  // Load entry when selected
  useEffect(() => {
    let cancelled = false
    setError('')
    if (!selected) {
      setEntry(null)
      return
    }
    setEntryLoading(true)
    getDictionaryWord(selected)
      .then(data => { if (!cancelled) setEntry(data) })
      .catch(err => { if (!cancelled) { setEntry(null); setError(err.message || 'Not found') } })
      .finally(() => { if (!cancelled) setEntryLoading(false) })
    return () => { cancelled = true }
  }, [selected])

  const hasResults = results && results.length > 0

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-2xl font-semibold">English Dictionary</h2>
        <input
          type="search"
          placeholder="Search a word..."
          className="ml-auto w-full sm:w-96 px-3 py-2 border border-gray-300 rounded focus-visible:ring-2 focus-visible:ring-blue-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {resultsLoading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-10" />))}
            </div>
          )}
          {!resultsLoading && !debounced && <div className="text-gray-500">Type to search for a word.</div>}
          {!resultsLoading && debounced && !hasResults && <div className="text-gray-500">No matches.</div>}
          {!resultsLoading && hasResults && (
            <ul className="divide-y divide-gray-200 rounded border border-gray-200 overflow-hidden">
              {results.map(word => (
                <li key={word}>
                  <button
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selected === word ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelected(word)}
                  >
                    {word}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <Card>
            <CardTitle>{entry ? entry.word : 'Definition'}</CardTitle>
            <div className="mt-2">
              {entryLoading && <div className="text-gray-500">Loading...</div>}
              {!entryLoading && error && <div className="text-red-600">{error}</div>}
              {!entryLoading && !error && !entry && <div className="text-gray-500">Select a word to view its meaning.</div>}
              {!entryLoading && entry && (
                <div className="space-y-2">
                  {Array.isArray(entry.definitions) && entry.definitions.length > 0 ? (
                    entry.definitions.map((d, i) => (
                      <div key={i} className="p-3 rounded border border-gray-200 bg-white">
                        <div className="text-sm text-gray-600">{d.pos || 'definition'}</div>
                        <div className="mt-1">{d.definition}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No definitions available.</div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}


