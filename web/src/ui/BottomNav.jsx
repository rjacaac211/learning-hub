import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-white/90 backdrop-blur safe-bottom">
      <div className="flex items-stretch justify-around px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center tap-target text-sm ${isActive ? 'text-accent font-medium' : 'text-fg'}`
          }
          aria-label="Home"
        >
          Home
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center tap-target text-sm ${isActive ? 'text-accent font-medium' : 'text-fg'}`
          }
          aria-label="Library"
        >
          Library
        </NavLink>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex-1 flex items-center justify-center tap-target text-sm text-fg"
          aria-label="Back"
        >
          Back
        </button>
      </div>
    </nav>
  )
}


