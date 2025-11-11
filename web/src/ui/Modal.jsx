import React, { useEffect } from 'react'

export default function Modal({ open, title, children, onClose, footer }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 rounded-lg border border-border bg-white shadow-2xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3 border-t border-border bg-white/60 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}


