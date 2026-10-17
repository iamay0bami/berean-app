'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useCallback, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

const ORDER: Theme[] = ['light', 'dark', 'system']
const LABELS: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' }
const EVENT = 'berean-theme-change'
const COOKIE = 'berean-theme'

// The cookie is the single source of truth (lib/theme.ts). Reading it through
// useSyncExternalStore gives React a server snapshot ('system') for hydration and
// the cookie value on the client, so the icon cannot mismatch the DOM on load.
function read(): Theme {
  const match = document.cookie.match(/(?:^|;\s*)berean-theme=(light|dark|system)/)
  return (match?.[1] as Theme | undefined) ?? 'system'
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => 'system' as Theme)
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  const cycle = useCallback(() => {
    const current = read()
    const chosen = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
    document.cookie = `${COOKIE}=${chosen}; path=/; max-age=31536000; samesite=lax`
    const root = document.documentElement
    // Suppress every colour transition for the one frame that repaints the new
    // theme; otherwise all of them fire at once and the screen smears.
    root.classList.add('theme-switching')
    // 'system' removes the attribute so the prefers-color-scheme block decides.
    if (chosen === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', chosen)
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return (
    <button
      className="icon-button"
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next]}.`}
      title={`Theme: ${LABELS[theme]}`}
    >
      <Icon size={20} strokeWidth={1.8} />
    </button>
  )
}
