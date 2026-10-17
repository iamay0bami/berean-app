import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'

export function Meta({ children }: { children: ReactNode }) {
  return <span className="meta">{children}</span>
}

export function Rule() {
  return <div className="rule" aria-hidden="true" />
}

function Brand() {
  return (
    <span className="brand-mark">
      <span className="brand-glyph">B</span>
      <span className="brand-name">Berean</span>
    </span>
  )
}

// Header — the app chrome. Brand and theme only; there is no notification
// surface, so there is no bell.
export function Header() {
  return (
    <header className="topbar">
      <Brand />
      <ThemeToggle />
    </header>
  )
}

// ReadingHeader — sticky and glass. The trailing slot keeps the title centred;
// passing nothing renders a matching spacer.
export function ReadingHeader({
  backHref,
  backLabel,
  title,
  action,
}: {
  backHref: string
  backLabel: string
  title: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="reading-header">
      <Link className="icon-button" href={backHref} aria-label={backLabel}>
        <ArrowLeft size={20} strokeWidth={1.8} />
      </Link>
      <span className="reading-header__title">{title}</span>
      <span className="reading-header__slot">{action}</span>
    </header>
  )
}

// FormHeader — sticky and deliberately not glass: a translucent bar behind a
// focused input is the legibility failure the glass rule exists to prevent.
export function FormHeader({ backHref, title }: { backHref: string; title: string }) {
  return (
    <header className="form-header">
      <Link className="icon-button" href={backHref} aria-label="Back">
        <ArrowLeft size={20} strokeWidth={1.8} />
      </Link>
      <span className="form-header__title">{title}</span>
    </header>
  )
}

export function AuthHeader() {
  return (
    <header className="auth-header">
      <Brand />
    </header>
  )
}
