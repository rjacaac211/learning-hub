import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { Card } from '../ui/Card'

export default function Signin() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialRole = (() => {
    const qp = new URLSearchParams(location.search).get('role')
    return qp === 'admin' ? 'admin' : 'student'
  })()
  const [role, setRole] = useState(initialRole)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { document.title = 'Learning Hub — Sign in' }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await auth(role, role === 'admin' ? password : '')
      localStorage.setItem('learningHubRole', res.role)
      navigate('/library')
    } catch (err) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <h1>Sign in</h1>
      <Card className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === 'student'}
                onChange={() => setRole('student')}
              />
              <span>Student</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === 'admin'}
                onChange={() => setRole('admin')}
              />
              <span>Admin</span>
            </label>
          </div>
          {role === 'admin' && (
            <div>
              <label className="block text-sm text-fg mb-1">Admin password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded focus-visible:ring-2 focus-visible:ring-accent"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-gradient-to-r from-accent to-sky-500 text-fg-inverted hover:opacity-90 disabled:opacity-60 transition"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </Card>
    </div>
  )
}



