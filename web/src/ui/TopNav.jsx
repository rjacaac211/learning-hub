import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function TopNav() {
  const location = useLocation()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-gradient-to-b from-white/80 to-white/50 backdrop-blur">
      <div className="container h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent" />
          <Link to="/" className="text-sm font-semibold tracking-tight">Learning Hub</Link>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-fg-muted">
          <Link to="/library" className={`hover:text-fg ${location.pathname.startsWith('/library') ? 'text-fg' : ''}`}>Library</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-fg">GitHub</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/signin" className="h-9 px-4 rounded-md bg-accent text-fg-inverted hover:bg-accent-hover transition-colors">Sign in</Link>
        </div>
      </div>
    </header>
  )
}


