import React from 'react'

 export function Card({ children, className = '', interactive = false, ...props }) {
   if (interactive) {
     return (
      <div className={`rounded-lg bg-gradient-to-r from-accent/85 to-sky-600/85 hover:from-accent/95 hover:to-sky-700/95 text-white shadow-card p-5 transition-colors duration-200 hover:shadow-lg cursor-pointer ${className}`} {...props}>
        {children}
      </div>
     )
   }
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


