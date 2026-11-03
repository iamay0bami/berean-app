'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/bottom-nav'
import { shouldHideBottomNav } from '@/lib/nav'

export default function AppShellClient({
  authenticated,
  children,
}: {
  authenticated: boolean
  children: ReactNode
}) {
  const pathname = usePathname()
  const navHidden = shouldHideBottomNav(pathname)

  return (
    <div className={`app-shell${navHidden ? ' app-shell--nav-hidden' : ''}`}>
      {children}
      {!navHidden && <BottomNav authenticated={authenticated} />}
    </div>
  )
}
