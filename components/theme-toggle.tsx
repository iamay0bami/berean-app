'use client'

import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useCallback, useSyncExternalStore } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

const ORDER: ThemeChoice[] = ['light', 'dark', 'system']
const LABELS: Record<ThemeChoice, string> = { light: 'Light', dark: 'Dark', system: 'System' }
const EVENT = 'berean-theme-change'
const COOKIE = 'berean-theme'

// The cookie is the single source of truth (lib/theme.ts). Reading it through
// useSyncExternalStore keeps every mounted theme control in step with the same
// custom event while the server-applied root attribute owns the first paint.
function read(): ThemeChoice {
  const match = document.cookie.match(/(?:^|;\s*)berean-theme=(light|dark|system)/)
  return (match?.[1] as ThemeChoice | undefined) ?? 'system'
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

function chooseTheme(chosen: ThemeChoice) {
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
}

export default function ThemeToggle({ className }: { className?: string } = {}) {
  const theme = useSyncExternalStore(subscribe, read, () => 'system' as ThemeChoice)
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  const cycle = useCallback(() => {
    const current = read()
    chooseTheme(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])
  }, [])

  return (
    <button
      className={`icon-button${className ? ` ${className}` : ''}`}
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next]}.`}
      title={`Theme: ${LABELS[theme]}`}
    >
      <Icon size={20} strokeWidth={1.8} />
    </button>
  )
}

export function ThemeChoices({ initialTheme }: { initialTheme: ThemeChoice }) {
  const serverSnapshot = useCallback(() => initialTheme, [initialTheme])
  const theme = useSyncExternalStore(subscribe, read, serverSnapshot)

  return (
    <fieldset className="settings-list card card--borderless">
      <legend className="sr-only">Theme</legend>
      {ORDER.map(choice => {
        const selected = theme === choice
        return (
          <label className="settings-theme-choice row row--plain" key={choice}>
            <input
              className="settings-theme-choice__input"
              type="radio"
              name="theme"
              value={choice}
              checked={selected}
              onChange={() => chooseTheme(choice)}
            />
            <span className="row__main">
              <span className="row__title">{LABELS[choice]}</span>
            </span>
            <Check
              className={`settings-theme-choice__check${selected ? ' is-selected' : ''}`}
              size={20}
              strokeWidth={2}
              aria-hidden="true"
            />
          </label>
        )
      })}
    </fieldset>
  )
}
