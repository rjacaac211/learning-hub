import React from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`rounded-lg border border-border bg-white shadow-card p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children }) {
  return <div className="text-base font-medium">{children}</div>
}

export function CardSubtitle({ children }) {
  return <div className="text-sm text-fg-muted">{children}</div>
}


