import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Image() {
  const navigate = useNavigate()
  const { '*': splat = '' } = useParams()

  const src = useMemo(() => {
    return '/files/' + encodeURI(splat)
  }, [splat])

  const name = decodeURIComponent(splat.split('/').pop() || 'image')

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => navigate(-1)}
          className="tap-target md:h-8 md:text-sm rounded-md bg-gradient-to-r from-accent/90 to-sky-500/90 text-white hover:opacity-90"
        >
          ← Back
        </button>
        <div className="text-sm text-fg-muted truncate">{name}</div>
      </div>

      <div className="rounded-lg border border-border bg-white shadow-card overflow-hidden flex items-center justify-center">
        {/* Use max-height similar to PDF/video viewers */}
        <img
          src={src}
          alt={name}
          className="max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-200px)] w-auto max-w-full object-contain bg-black/5"
        />
      </div>
    </section>
  )
}



