import type { ReactNode } from 'react'
import Link from 'next/link'
import { AuthHeader } from '@/components/shared'

export function AuthFrame({
  title,
  description,
  children,
  backHref = '/auth',
  backLabel = 'Back to choices',
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  backHref?: string
  backLabel?: string
  footer?: ReactNode
}) {
  return (
    <main className="page-wrap auth-page auth-page--flow">
      <AuthHeader />
      <div className="auth-content">
        <Link className="btn btn--quiet" href={backHref}>{backLabel}</Link>
        <header className="auth-intro">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-description">{description}</p>
        </header>
        <div className="auth-card card card--borderless">{children}</div>
        {footer}
      </div>
    </main>
  )
}
