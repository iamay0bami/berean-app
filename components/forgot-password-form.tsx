'use client'

import { AuthFrame } from '@/components/auth-presentation'
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

  const failureText = failure === RATE_LIMIT_MESSAGE
    ? 'Too many reset requests. Wait a few minutes and try again.'
    : failure

  return (
    <AuthFrame
      title="Reset your password"
      description="Enter your email to get a reset link."
      backHref="/auth/sign-in"
      backLabel="Back to sign in"
    >
      <form className="auth-form auth-form--recovery" onSubmit={submit} aria-busy={busy}>
        <div className="field">
          <label className="field__label" htmlFor="forgot-password-email">Email</label>
          <input
            className="field__input"
            id="forgot-password-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            aria-describedby={failure || message ? 'forgot-password-result' : undefined}
          />
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy} aria-busy={busy}>
          <span aria-hidden={busy}>Send reset link</span>
          <span aria-hidden={!busy}>Sending…</span>
        </button>
        {failure && <p className="auth-form__status error" id="forgot-password-result" role="status" aria-live="polite" aria-atomic="true">{failureText}</p>}
        {message && <p className="auth-form__status" id="forgot-password-result" role="status" aria-live="polite" aria-atomic="true">{message}</p>}
      </form>
    </AuthFrame>
  )
}
