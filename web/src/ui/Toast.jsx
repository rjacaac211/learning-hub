import React, { useEffect, useState } from 'react'
import { subscribe } from './toastBus'

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const unsub = subscribe(({ id, message, type, duration }) => {
      setToasts(prev => [...prev, { id, message, type, until: Date.now() + (duration || 3000) }])
    })
    const timer = setInterval(() => {
      const now = Date.now()
      setToasts(prev => prev.filter(t => t.until > now))
    }, 250)
    return () => { unsub(); clearInterval(timer) }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-[min(320px,calc(100vw-2rem))]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`rounded-md shadow card px-3 py-2 text-sm text-white ${t.type === 'error' ? 'bg-red-600' : t.type === 'warn' ? 'bg-amber-600' : 'bg-emerald-600'}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}


