'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  ['/admin/members', 'Members'],
  ['/admin/invite', 'Invite code'],
] as const

export default function AdminNav() {
  const pathname = usePathname()
  return <nav className="admin-nav" aria-label="Administration">{items.map(([href, label]) => <Link className={pathname === href ? 'current' : ''} href={href} key={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav>
}
