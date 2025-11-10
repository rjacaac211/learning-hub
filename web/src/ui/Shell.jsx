import React from 'react'
import TopNav from './TopNav'

export default function Shell({ children, showTopNav = true }) {
  return (
    <div className="min-h-screen bg-bg">
      {showTopNav && <TopNav />}
      <main className="container px-6 py-8">
        {children}
      </main>
    </div>
  )
}


