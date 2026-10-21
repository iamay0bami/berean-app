import type { Metadata, Viewport } from 'next'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import './globals.css'
import { readTheme } from '@/lib/theme'

// All three subsets on both families. `ẹ` (U+1EB9) and `ọ` (U+1ECD), and the
// combining tone marks, live in Google's *vietnamese* block — not latin-ext.
// Requesting only latin + latin-ext leaves Yoruba text in a fallback face.
//
// `subsets` controls *preloading*, not what is fetched: next/font pulls the full
// CSS2 response (every subset, each with its own unicode-range) and marks only
// the named subsets' files for preload. Latin only, therefore — it is what the
// critical path renders — while latin-ext and vietnamese stay in the CSS and
// download only when a glyph needs them.
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-interface', display: 'swap' })

export const metadata: Metadata = {
  title: 'Berean — A little room to listen, learn, and live the Word',
  description: 'A discipleship companion for the Berean church community.',
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await readTheme()
  return {
    // Both schemes are supported in CSS; the meta only tells the UA so.
    colorScheme: 'light dark',
    // An explicit choice has one known ground; `system` lets the browser pick.
    themeColor: theme === 'dark' ? '#141A29'
      : theme === 'light' ? '#F5F4F2'
      : [
          { media: '(prefers-color-scheme: light)', color: '#F5F4F2' },
          { media: '(prefers-color-scheme: dark)', color: '#141A29' },
        ],
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = await readTheme()
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable}`}
      data-theme={theme === 'system' ? undefined : theme}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}
