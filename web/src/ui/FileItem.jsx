import React from 'react'
import { mb, relToBreadcrumb } from '../lib/format'

function iconForMime(mime) {
  if (!mime) return '📄'
  if (mime.includes('pdf')) return '📕'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.startsWith('audio/')) return '🎵'
  return '📄'
}

export default function FileItem({ item }) {
  const breadcrumbs = relToBreadcrumb(item.rel)
  return (
    <li className="py-3 flex items-start gap-3">
      <div className="text-xl leading-none select-none" aria-hidden>{iconForMime(item.mime)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <a
            href={`/files${item.rel}`}
            target="_blank"
            rel="noreferrer"
            className="truncate font-medium text-blue-700 hover:text-blue-900"
          >
            {item.name}
          </a>
          <span className="text-xs text-gray-500 whitespace-nowrap">{mb(item.size)}</span>
        </div>
        <div className="text-xs text-gray-500 truncate">{breadcrumbs}</div>
      </div>
    </li>
  )
}



