import React from 'react'
import { useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import { ToastContainer } from './Toast'

export default function Shell({ children, showTopNav = true }) {
  const location = useLocation()
  const isLandingPage = location.pathname === '/' || location.pathname === '/signin'
  const showBottomNav = !isLandingPage

  return (
    <div className="min-h-screen relative">
      {/* subtle global blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-gradient-to-br from-accent/15 to-sky-400/15 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-gradient-to-tr from-purple-500/12 to-accent/12 blur-3xl rounded-full" />
      </div>
      {showTopNav && !isLandingPage && <TopNav />}
      <main className={`relative ${isLandingPage ? '' : 'container px-6'} ${isLandingPage ? 'pt-0' : 'pt-8'} ${showBottomNav ? 'pb-[calc(64px+env(safe-area-inset-bottom))]' : 'pb-8'} md:py-8 ${isLandingPage ? 'overflow-hidden' : ''}`}>
        {children}
      </main>
      {showBottomNav && <BottomNav />}
      <ToastContainer />
    </div>
  )
}


