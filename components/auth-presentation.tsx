import { Fragment, type ReactNode } from 'react'
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
  backHref?: string | null
  backLabel?: string
  footer?: ReactNode
}) {
  return (
    <main className="page-wrap auth-page auth-page--flow">
      <AuthHeader />
      <div className="auth-content">
        {backHref && <Link className="btn btn--quiet" href={backHref}>{backLabel}</Link>}
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

type AuthLoadingVariant = 'chooser' | 'sign-in' | 'join' | 'start' | 'forgot' | 'update'
type LoadingField = { hint?: 'short' | 'long'; password?: boolean }

const AUTH_LOADING_STATUS: Record<AuthLoadingVariant, string> = {
  chooser: 'Loading choices…',
  'sign-in': 'Loading sign in…',
  join: 'Loading join with an invite code…',
  start: 'Loading start a new church…',
  forgot: 'Loading password reset…',
  update: 'Loading new password…',
}

const AUTH_LOADING_FIELDS: Record<Exclude<AuthLoadingVariant, 'chooser'>, LoadingField[]> = {
  'sign-in': [{}, { password: true }],
  join: [{}, { hint: 'long' }, { hint: 'short' }, {}, { password: true, hint: 'short' }],
  start: [{}, { hint: 'long' }, {}, {}, { password: true, hint: 'short' }],
  forgot: [{}],
  update: [{ password: true, hint: 'short' }, { password: true }],
}

function LoadingLines({ className, lines = 1 }: { className: string; lines?: number }) {
  return <div className={className}>{Array.from({ length: lines }, (_, index) => <div className="skeleton-block auth-skeleton__line" key={index} />)}</div>
}

function LoadingFieldShape({ hint, password }: LoadingField) {
  return (
    <div className="field">
      <LoadingLines className="field__label auth-skeleton__label" />
      <div className={password ? 'password-field' : undefined}>
        <div className="field__input skeleton-block"><div className="auth-skeleton__strut" /></div>
        {password && <div className="password-toggle skeleton-block auth-skeleton__toggle" />}
      </div>
      {hint && <LoadingLines className={`field__hint auth-skeleton__hint${hint === 'long' ? ' auth-skeleton__hint--long' : ''}`} lines={hint === 'long' ? 2 : 1} />}
    </div>
  )
}

/** Static server-compatible fallback: fixed initial geometry, never route/session data. */
export function AuthLoading({ variant }: { variant: AuthLoadingVariant }) {
  const chooser = variant === 'chooser'
  const fields = chooser ? [] : AUTH_LOADING_FIELDS[variant]
  const twoDescriptionLines = variant === 'join' || variant === 'update'
  const intro = (
    <div className="auth-intro">
      <LoadingLines className="auth-title auth-skeleton__title" lines={variant === 'sign-in' ? 1 : 2} />
      <LoadingLines className="auth-description auth-skeleton__description" lines={twoDescriptionLines ? 2 : 1} />
    </div>
  )

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{AUTH_LOADING_STATUS[variant]}</p>
      <div className={`auth-skeleton auth-skeleton--${variant}`} aria-hidden="true" inert>
        <main className={`page-wrap auth-page ${chooser ? 'auth-page--welcome' : 'auth-page--flow'}`}>
          {chooser ? <>
            {intro}
            <div className="auth-choices">
              <div className="btn skeleton-block" />
              <div className="btn skeleton-block" />
              <div className="btn skeleton-block" />
            </div>
          </> : <>
            <div className="auth-header"><div className="brand-mark"><div className="brand-glyph skeleton-block" /><div className="skeleton-block auth-skeleton__line" /></div></div>
            <div className="auth-content">
              {variant !== 'update' && <div className="btn btn--quiet skeleton-block auth-skeleton__back" />}
              {intro}
              <div className="auth-card card card--borderless">
                <div className={`auth-form ${variant === 'sign-in' ? 'auth-form--sign-in' : variant === 'forgot' || variant === 'update' ? 'auth-form--recovery' : 'auth-form--signup'}`}>
                  {fields.map((field, index) => <Fragment key={index}>
                    <LoadingFieldShape {...field} />
                    {variant === 'start' && index === 2 && <div className="auth-founder">
                      <LoadingLines className="auth-note auth-skeleton__note" lines={3} />
                      <div className="auth-confirm"><div className="auth-confirm__input skeleton-block" /><div className="skeleton-block auth-skeleton__line" /></div>
                      <LoadingLines className="field__hint auth-skeleton__hint auth-skeleton__hint--long" lines={2} />
                    </div>}
                  </Fragment>)}
                  {variant === 'sign-in' && <div className="btn btn--quiet skeleton-block auth-skeleton__forgot" />}
                  <div className="btn skeleton-block" />
                </div>
              </div>
              {variant === 'sign-in' && <div className="btn btn--quiet skeleton-block auth-skeleton__footer" />}
              {(variant === 'join' || variant === 'start') && <div className="auth-footer"><div className="btn btn--quiet skeleton-block" /><div className="btn btn--quiet skeleton-block" /></div>}
            </div>
          </>}
        </main>
      </div>
    </>
  )
}
