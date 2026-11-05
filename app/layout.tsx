import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { readTheme } from '@/lib/theme'

const bereanSerif = localFont({
  src: './fonts/berean-serif/BereanSerif-SemiBold.woff2',
  variable: '--font-serif',
  weight: '600',
  style: 'normal',
  display: 'swap',
  preload: true,
  fallback: ['Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
})
const hanken = localFont({
  src: './fonts/hanken/HankenGrotesk-Yoruba.woff2',
  variable: '--font-interface',
  weight: '100 900',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Berean — A little room to listen, learn, and live the Word',
  description: 'A discipleship companion for the Berean church community.',
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await readTheme()
  return {
    // Both schemes are supported in CSS; the meta only tells the UA so.
    colorScheme: 'light dark',
    viewportFit: 'cover',
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
      className={`${bereanSerif.variable} ${hanken.variable}`}
      data-theme={theme === 'system' ? undefined : theme}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}
