import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'Learning Hub' }, [])
  return (
    <section className="min-h-[calc(100vh-120px)] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">Welcome to Learning Hub</h1>
        <p className="text-gray-600 mb-8">Browse your resources by navigating folders.</p>
        <button
          onClick={() => navigate('/signin')}
          className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Enter
        </button>
      </div>
    </section>
  )
}



