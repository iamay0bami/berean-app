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

  return <main className="page-wrap auth-page"><div className="auth-card paper-card"><span className="brand-glyph">B</span><h1>Reset your <em>password.</em></h1><p>Enter your email to get a reset link.</p><form onSubmit={submit}><input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" autoComplete="email" /><button className="primary-button" disabled={busy}>{busy ? 'Working...' : 'Send reset link'}</button></form>{failure && <p className="field-message error" role="status">{failure}</p>}{message && <p className="field-message" role="status">{message}</p>}<p>Remembered it? <Link className="text-action" href="/auth/sign-in">Sign in</Link></p></div></main>
}
