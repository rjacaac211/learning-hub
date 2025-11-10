import React from 'react'

export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="text-center py-24">
      <div className="mx-auto w-10 h-10 rounded-lg border border-dashed border-border" />
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}


