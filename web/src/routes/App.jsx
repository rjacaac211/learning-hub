import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Shell from '../ui/Shell'

export default function App() {
  const location = useLocation()
  useEffect(() => {
    if (location.pathname === '/') {
      document.title = 'The Solar Archive'
    }
  }, [location])

  // Ensure landing/sign-in always start at top and do not inherit scroll
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/signin') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      // Also reset both roots for browsers that use one or the other
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }, [location])

  return (
    <Shell showTopNav={true}>
      <Outlet />
    </Shell>
  )
}



