'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PasswordField from '@/components/password-field'
import { AuthFrame } from '@/components/auth-presentation'

function updatePasswordMessageCopy(message: string) {
  if (message.toLowerCase().includes('new password should be different from the old password')) return message
  return "We couldn't update your password. Try again."
}

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const mismatch = confirm.length > 0 && password !== confirm

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (password !== confirm) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setBusy(false)
      return setMessage(error.message)
    }
    await supabase.auth.signOut()
    window.location.assign('/auth/sign-in?reset=1')
  }

  return (
    <AuthFrame
      title="Choose a new password"
      description="Set a new password for your Berean account."
      backHref={null}
    >
      <form className="auth-form auth-form--recovery" onSubmit={submit} aria-busy={busy}>
        <div className="field">
          <label className="field__label" htmlFor="update-password-new">New password</label>
          <PasswordField
            id="update-password-new"
            name="new-password"
            inputClassName="field__input"
            value={password}
            onChange={setPassword}
            placeholder=""
            autoComplete="new-password"
            describedBy={message ? 'update-password-hint update-password-result' : 'update-password-hint'}
          />
          <p className="field__hint" id="update-password-hint">Use at least 6 characters.</p>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="update-password-confirm">Confirm password</label>
          <PasswordField
            id="update-password-confirm"
            name="confirm-password"
            inputClassName="field__input"
            value={confirm}
            onChange={setConfirm}
            placeholder=""
            autoComplete="new-password"
            label="confirm password"
            describedBy={mismatch ? 'update-password-mismatch' : undefined}
            invalid={mismatch}
          />
          {mismatch && <p className="field__status error" id="update-password-mismatch" role="status" aria-live="polite" aria-atomic="true">Passwords don&apos;t match. Enter the same password in both fields.</p>}
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy} aria-busy={busy}>
          <span aria-hidden={busy}>Update password</span>
          <span aria-hidden={!busy}>Updating…</span>
        </button>
        {message && <p className="auth-form__status error" id="update-password-result" role="status" aria-live="polite" aria-atomic="true">{updatePasswordMessageCopy(message)}</p>}
      </form>
    </AuthFrame>
  )
}
