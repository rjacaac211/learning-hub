import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Doc() {
  const navigate = useNavigate()
  const { '*': splat = '' } = useParams()

  const src = useMemo(() => {
    return '/files/' + encodeURI(splat)
  }, [splat])

  const name = decodeURIComponent(splat.split('/').pop() || 'document')

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

      <div className="rounded-lg border border-border bg-white shadow-card p-6 flex flex-col gap-3 text-sm text-fg">
        <p>This document will be downloaded to your device.</p>
        <div>
          <a
            href={src}
            download
            className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-to-r from-accent to-sky-500 text-white text-sm hover:opacity-90"
          >
            Download document
          </a>
        </div>
      </div>
    </section>
  )
}



