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
  useEffect(() => { document.title = 'Learning Hub' }, [])
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
      navigate('/library')
    } catch (err) {
      setAdminError(err.message || 'Invalid password')
    } finally {
      setAdminLoading(false)
    }
  }
  return (
    <section className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Learning Hub</h1>
        <p className="mt-4 text-fg-muted max-w-xl mx-auto">Choose your role to continue.</p>
        {!adminMode ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={handleStudent}
              disabled={loading}
              className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-accent text-fg-inverted hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Student'}
            </button>
            <button
              onClick={() => setAdminMode(true)}
              className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-border"
            >
              Admin
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} className="mt-8 max-w-sm mx-auto text-left">
            <label className="block text-sm mb-2">Admin password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-border rounded focus-visible:ring-2 focus-visible:ring-accent"
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
                className="h-10 px-4 rounded-md border border-border"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={adminLoading}
                className="h-10 px-6 rounded-md bg-accent text-fg-inverted hover:bg-accent-hover disabled:opacity-60"
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



