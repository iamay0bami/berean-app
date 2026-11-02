export const NAV_ITEMS = [
  { tab: 'home', href: '/home', label: 'Home' },
  { tab: 'classes', href: '/classes', label: 'Classes' },
  { tab: 'sermons', href: '/sermons', label: 'Sermons' },
  { tab: 'discuss', href: '/discuss', label: 'Discuss' },
  { tab: 'profile', href: '/profile', label: 'Profile' },
] as const

export type NavTab = (typeof NAV_ITEMS)[number]['tab']

const AUTHOR_LESSON_FORM_PATH = /^\/author\/lessons\/[^/]+\/?$/

function isRouteOrChild(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function getActiveNavTab(pathname: string): NavTab | null {
  if (isRouteOrChild(pathname, '/home')) return 'home'
  if (isRouteOrChild(pathname, '/classes') || isRouteOrChild(pathname, '/class')) return 'classes'
  if (isRouteOrChild(pathname, '/sermons')) return 'sermons'
  if (isRouteOrChild(pathname, '/discuss')) return 'discuss'
  if (isRouteOrChild(pathname, '/profile')) return 'profile'
  return null
}

export function shouldHideBottomNav(pathname: string) {
  return AUTHOR_LESSON_FORM_PATH.test(pathname)
}
