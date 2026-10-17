import { cookies } from 'next/headers'

export const THEME_COOKIE = 'berean-theme'

export type Theme = 'light' | 'dark' | 'system'

// The cookie is the single source of truth. 'system' writes no data-theme
// attribute, so the prefers-color-scheme media query decides — which is why the
// server render and the first paint already agree, with no client correction.
export async function readTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value
  return value === 'light' || value === 'dark' ? value : 'system'
}
