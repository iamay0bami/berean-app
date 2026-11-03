'use client'

import type { CSSProperties } from 'react'
import { BookOpen, Home, MessageCircle, NotebookPen, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getActiveNavTab, NAV_ITEMS, shouldHideBottomNav, type NavTab } from '@/lib/nav'

const icons = {
  home: Home,
  classes: BookOpen,
  sermons: NotebookPen,
  discuss: MessageCircle,
  profile: UserRound,
} satisfies Record<NavTab, typeof Home>

type NavStyle = CSSProperties & { '--active-index'?: number }

export default function BottomNav({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname()
  if (shouldHideBottomNav(pathname)) return null

  const activeTab = getActiveNavTab(pathname)
  const activeIndex = NAV_ITEMS.findIndex(item => item.tab === activeTab)
  const style: NavStyle | undefined = activeIndex >= 0 ? { '--active-index': activeIndex } : undefined

  return (
    <nav className="bottom-nav" aria-label="Main navigation" style={style}>
      {NAV_ITEMS.map(item => {
        const Icon = icons[item.tab]
        const current = item.tab === activeTab
        const target = item.tab === 'profile' && !authenticated ? '/auth/sign-in?next=/profile' : item.href
        const label = item.tab === 'profile' && !authenticated ? 'Sign in' : item.label
        return (
          <Link
            className={`bottom-nav__link${current ? ' current' : ''}`}
            href={target}
            key={item.tab}
            aria-current={current ? 'page' : undefined}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={current ? 2 : 1.7} fill={current ? 'currentColor' : 'none'} />
            <span>{label}</span>
          </Link>
        )
      })}
      {activeIndex >= 0 && <span className="nav-capsule" aria-hidden="true" />}
    </nav>
  )
}
