'use client'

import { useEffect, useState } from 'react'

const DEFAULT_PHRASES = ["Turning the page…", "Setting the table…", "Gathering this week's word…"]

export default function BrandedLoading({ phrases = DEFAULT_PHRASES }: { phrases?: string[] }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (phrases.length < 2) return
    const id = setInterval(() => setIndex(i => (i + 1) % phrases.length), 3200)
    return () => clearInterval(id)
  }, [phrases.length])

  return (
    <main className="page-wrap loading-page">
      <div>
        <span className="loading-brand" aria-hidden="true">B</span>
        <div className="loading-phrases" aria-hidden="true">
          {phrases.map((phrase, i) => (
            <p key={phrase} className={i === index ? 'current' : ''}>{phrase}</p>
          ))}
        </div>
        <div className="loading-line" aria-hidden="true"><span /></div>
        <p className="sr-only" role="status">Loading…</p>
      </div>
    </main>
  )
}
