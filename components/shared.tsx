import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'

export function Meta({ children }: { children: ReactNode }) {
  return <span className="meta">{children}</span>
}

export function Rule() {
  return <div className="rule" aria-hidden="true" />
}

export function Header() {
  return <header className="topbar"><div className="brand-mark"><span className="brand-glyph">B</span><span className="brand-name">Berean</span></div><button className="icon-button" aria-label="Notifications"><Bell size={19} strokeWidth={1.8} /></button></header>
}
