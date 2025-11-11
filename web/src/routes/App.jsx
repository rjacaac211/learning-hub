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

  return (
    <Shell showTopNav={true}>
      <Outlet />
    </Shell>
  )
}



