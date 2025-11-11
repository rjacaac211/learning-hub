import React from 'react'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import { ToastContainer } from './Toast'

export default function Shell({ children, showTopNav = true }) {
  return (
    <div className="min-h-screen relative">
      {/* subtle global blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-gradient-to-br from-accent/15 to-sky-400/15 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-gradient-to-tr from-purple-500/12 to-accent/12 blur-3xl rounded-full" />
      </div>
      {showTopNav && <TopNav />}
      <main className="relative container px-6 pt-8 pb-[calc(64px+env(safe-area-inset-bottom))] md:py-8">
        {children}
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}


