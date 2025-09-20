import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function CategoryCard({ slug, title, color }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/category/${slug}`)}
      className={`group w-full aspect-[4/3] rounded-xl bg-gradient-to-br ${color} text-white p-6 shadow hover:shadow-lg transition-shadow focus-visible:ring-2 focus-visible:ring-white`}
      aria-label={`Open ${title}`}
    >
      <div className="flex h-full items-end">
        <div>
          <div className="text-2xl font-bold">{title}</div>
          <div className="opacity-80 text-sm">Explore resources</div>
        </div>
      </div>
    </button>
  )
}



