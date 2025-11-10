import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Shell from '../ui/Shell'

export default function App() {
  const location = useLocation()
  useEffect(() => {
    if (location.pathname === '/') {
      document.title = 'Learning Hub'
    }
  }, [location])

  return (
    <Shell showTopNav={location.pathname !== '/' && !location.pathname.startsWith('/library') && !location.pathname.startsWith('/pdf') && !location.pathname.startsWith('/video')}>
      <Outlet />
    </Shell>
  )
}



