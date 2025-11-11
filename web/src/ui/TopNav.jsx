import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function TopNav() {
  const navigate = useNavigate()
  const role = typeof window !== 'undefined' ? localStorage.getItem('learningHubRole') : null
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('learningHubToken') : false

  function handleSignOut() {
    localStorage.removeItem('learningHubRole')
    localStorage.removeItem('learningHubToken')
    navigate('/')
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-gradient-to-b from-white/80 to-white/50 backdrop-blur">
      <div className="container h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent" />
          <Link to="/" className="text-sm font-semibold tracking-tight">The Solar Archive</Link>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {role === 'admin' && hasToken ? (
            <>
              <span className="text-xs px-2 py-1 rounded bg-amber-200 text-amber-900">Admin</span>
              <button onClick={handleSignOut} className="tap-target md:h-9 md:text-sm bg-accent text-fg-inverted hover:bg-accent-hover transition-colors">Sign out</button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}


