'use client'

import { BookOpen, Home, MessageCircle, NotebookPen, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  ['/home', 'Home', Home],
  ['/classes', 'Classes', BookOpen],
  ['/sermons', 'Sermons', NotebookPen],
  ['/discuss', 'Discuss', MessageCircle],
  ['/profile', 'Profile', UserRound],
] as const

export default function BottomNav({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname()
  const currentIndex = items.findIndex(
    ([href]) => pathname === href || (href !== '/home' && pathname.startsWith(`${href}/`)),
  )

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {/* One bar for the whole nav, translated between equal columns. A
          ::before on the current item could not animate between items. */}
      {currentIndex >= 0 && (
        <span
          className="nav-indicator"
          aria-hidden="true"
          style={{ transform: `translateX(${currentIndex * 100}%)` }}
        />
      )}
      {items.map(([href, label, Icon]) => {
        const current = pathname === href || (href !== '/home' && pathname.startsWith(`${href}/`))
        const target = href === '/profile' && !authenticated ? '/auth/sign-in?next=/profile' : href
        return (
          <Link
            className={current ? 'current' : ''}
            href={target}
            key={href}
            aria-current={current ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={current ? 2 : 1.7} fill={current ? 'currentColor' : 'none'} />
            <span>{href === '/profile' && !authenticated ? 'Sign in' : label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
