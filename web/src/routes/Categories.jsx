import React, { useEffect } from 'react'
import CategoryCard from '../ui/CategoryCard'

const categories = [
  { slug: 'english', title: 'English', color: 'from-pink-500 to-rose-500' },
  { slug: 'math', title: 'Math', color: 'from-blue-500 to-cyan-500' },
  { slug: 'science', title: 'Science', color: 'from-green-600 to-emerald-500' }
]

export default function Categories() {
  useEffect(() => { document.title = 'Learning Hub — Categories' }, [])
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(c => (
          <CategoryCard key={c.slug} slug={c.slug} title={c.title} color={c.color} />
        ))}
      </div>
    </div>
  )
}



