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

export default function BottomNav() {
  const pathname = usePathname()
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(([href, label, Icon]) => {
    const current = pathname === href || (href !== '/home' && pathname.startsWith(`${href}/`))
    return <Link className={current ? 'current' : ''} href={href} key={href}><Icon size={19} strokeWidth={current ? 2.3 : 1.7} /><span>{label}</span></Link>
  })}</nav>
}
