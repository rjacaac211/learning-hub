import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Pptx() {
  const navigate = useNavigate()
  const { '*': splat = '' } = useParams()

  const src = useMemo(() => {
    return '/files/' + encodeURI(splat)
  }, [splat])

  const name = decodeURIComponent(splat.split('/').pop() || 'presentation')

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

      <div className="rounded-lg border border-border bg-white shadow-card overflow-hidden">
        <iframe
          title={name}
          src={'/files/' + encodeURI(splat)}
          className="w-full h-[calc(100vh-280px)] md:h-[calc(100vh-200px)] bg-black/5"
        />
      </div>
    </section>
  )
}



