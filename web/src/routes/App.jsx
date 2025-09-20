import React, { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()
  useEffect(() => {
    // default title; pages override as needed
    if (location.pathname === '/') {
      document.title = 'Learning Hub'
    }
  }, [location])

  const isRoot = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {!isRoot && (
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">← Back</Link>
          )}
          <Link to="/" className="font-semibold text-lg">Learning Hub</Link>
          <div className="ml-auto text-xs text-gray-500">Raspberry Pi friendly</div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 text-center text-xs text-gray-500 py-4">Local Learning Hub</footer>
    </div>
  )
}



