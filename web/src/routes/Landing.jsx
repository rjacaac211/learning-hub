import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'

export default function Landing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [adminMode, setAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  useEffect(() => { 
    document.title = 'The Solar Archive'
    // Prevent scrolling on landing page
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])
  async function handleStudent() {
    try {
      setLoading(true)
      const res = await auth('student', '')
      localStorage.setItem('learningHubRole', res.role)
      navigate('/library')
    } finally {
      setLoading(false)
    }
  }
  async function handleAdminSubmit(e) {
    e.preventDefault()
    setAdminError('')
    setAdminLoading(true)
    try {
      const res = await auth('admin', adminPassword)
      localStorage.setItem('learningHubRole', res.role)
      if (res.token) {
        localStorage.setItem('learningHubToken', res.token)
      } else {
        localStorage.removeItem('learningHubToken')
      }
      navigate('/library')
    } catch (err) {
      setAdminError(err.message || 'Invalid password')
    } finally {
      setAdminLoading(false)
    }
  }
  return (
    <section className="relative h-screen flex items-start justify-center overflow-hidden pt-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-gradient-to-br from-accent/25 to-sky-400/25 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-gradient-to-tr from-purple-500/20 to-accent/20 blur-3xl rounded-full" />
      </div>
      <div className="relative text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight bg-gradient-to-r from-accent to-sky-500 bg-clip-text text-transparent leading-tight">
          <span className="whitespace-pre-line block">{`The Solar Archive:\nKnowledge Powered\nby the Sun`}</span>
        </h1>
        <p className="mt-4 text-fg-muted max-w-xl mx-auto">Choose your role to continue.</p>
        {!adminMode ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={handleStudent}
              disabled={loading}
              className="inline-flex items-center justify-center tap-target md:h-11 bg-gradient-to-r from-accent to-sky-500 text-fg-inverted hover:opacity-90 disabled:opacity-60 transition"
            >
              {loading ? 'Loading...' : 'Student'}
            </button>
            <button
              onClick={() => setAdminMode(true)}
              className="inline-flex items-center justify-center tap-target md:h-11 border border-border"
            >
              Admin
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} className="mt-8 max-w-sm mx-auto text-left">
            <label className="block text-sm mb-2">Admin password</label>
            <input
              type="password"
              className="w-full h-12 px-4 text-base rounded-md bg-white/60 backdrop-blur-sm border border-white/0 shadow-sm focus-visible:ring-2 focus-visible:ring-accent"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              autoFocus
              required
            />
            {adminError && <div className="mt-2 text-sm text-red-600">{adminError}</div>}
            <div className="mt-4 flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setAdminMode(false); setAdminPassword(''); setAdminError('') }}
                className="tap-target md:h-10 border border-border"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={adminLoading}
                className="tap-target md:h-10 bg-gradient-to-r from-accent to-sky-500 text-fg-inverted hover:opacity-90 disabled:opacity-60 transition"
              >
                {adminLoading ? 'Signing in...' : 'Continue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}



