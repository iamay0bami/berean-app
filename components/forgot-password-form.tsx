'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const GENERIC_MESSAGE = 'If an account exists for that email, a reset link has been sent.'
const RATE_LIMIT_MESSAGE = 'Too many reset requests. Please wait a few minutes and try again.'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setFailure('')
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback` })
    setBusy(false)
    if (error?.status === 429) return setFailure(RATE_LIMIT_MESSAGE)
    if (error) console.error('[forgotPassword] reset request failed', error.message)
    setMessage(GENERIC_MESSAGE)
  }

  return <main className="page-wrap auth-page"><div className="auth-card card card--borderless"><span className="brand-glyph">B</span><h1 className="auth-title">Reset your <em>password.</em></h1><p className="auth-description">Enter your email to get a reset link.</p><form className="auth-form" onSubmit={submit}><input className="field__input" required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" autoComplete="email" /><button className="btn btn--primary" disabled={busy}>{busy ? 'Working...' : 'Send reset link'}</button></form>{failure && <p className="field-message error" role="status">{failure}</p>}{message && <p className="field-message" role="status">{message}</p>}<p className="auth-description">Remembered it? <Link className="btn btn--quiet" href="/auth/sign-in">Sign in</Link></p></div></main>
}
