'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('A page data request failed', { digest: error.digest })
  }, [error])

  return <main className="page-wrap error-page"><div><span className="brand-glyph">B</span><h1>We couldn&apos;t<br /><em>open this page.</em></h1><p>Something went wrong while loading this content. Please try again.</p><button className="primary-button" onClick={reset}>Try again</button></div></main>
}
