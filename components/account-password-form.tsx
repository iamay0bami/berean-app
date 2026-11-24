'use client'

import { FormEvent, useState } from 'react'
import { changePassword } from '@/app/actions'
import PasswordField from '@/components/password-field'

function focusField(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus())
}

export default function AccountPasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [currentError, setCurrentError] = useState('')
  const [nextError, setNextError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  function setError(message: string) {
    if (message === 'Enter your current password.' || message === 'Current password is incorrect.') {
      setCurrentError(message)
      focusField('current-password')
    } else if (
      message === 'Enter a new password.' ||
      message === 'Password must be at least 6 characters.' ||
      message === 'That password is too easy to guess. Choose a stronger one.' ||
      message === 'Choose a password different from your current one.'
    ) {
      setNextError(message)
      focusField('new-password')
    } else if (message === 'Confirm your new password.' || message === 'Passwords do not match.') {
      setConfirmError(message)
      focusField('confirm-password')
    } else {
      setStatus(message)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setCurrentError('')
    setNextError('')
    setConfirmError('')
    setStatus('')

    if (!current) return setError('Enter your current password.')
    if (!next) return setError('Enter a new password.')
    if (next.length < 6) return setError('Password must be at least 6 characters.')
    if (!confirm) return setError('Confirm your new password.')
    if (next !== confirm) return setError('Passwords do not match.')

    setBusy(true)
    try {
      const result = await changePassword(current, next, confirm)
      if (result.error) return setError(result.error)

      setCurrent('')
      setNext('')
      setConfirm('')
      setStatus(result.message ?? 'Password changed. You can also sign out other devices below.')
    } catch {
      setStatus("We couldn't change your password. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="settings-form-card card card--borderless" aria-labelledby="password-title">
      <h2 className="card__title" id="password-title">Password</h2>
      <form className="settings-form" onSubmit={submit} noValidate aria-busy={busy}>
        <div className="field">
          <label className="field__label" htmlFor="current-password">Current password</label>
          <PasswordField id="current-password" name="current-password" label="current password" value={current} onChange={value => { setCurrent(value); setCurrentError(''); setStatus('') }} placeholder="" autoComplete="current-password" describedBy={currentError ? 'current-password-status' : undefined} invalid={Boolean(currentError)} inputClassName="field__input" />
          {currentError ? <p className="field__status error" id="current-password-status" role="status" aria-live="polite" aria-atomic="true">{currentError}</p> : null}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="new-password">New password</label>
          <PasswordField id="new-password" name="new-password" label="new password" value={next} onChange={value => { setNext(value); setNextError(''); setStatus('') }} placeholder="" autoComplete="new-password" describedBy={nextError ? 'new-password-hint new-password-status' : 'new-password-hint'} invalid={Boolean(nextError)} inputClassName="field__input" />
          <p className="field__hint" id="new-password-hint">Use at least 6 characters.</p>
          {nextError ? <p className="field__status error" id="new-password-status" role="status" aria-live="polite" aria-atomic="true">{nextError}</p> : null}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="confirm-password">Confirm new password</label>
          <PasswordField id="confirm-password" name="confirm-password" label="confirm password" value={confirm} onChange={value => { setConfirm(value); setConfirmError(''); setStatus('') }} placeholder="" autoComplete="new-password" describedBy={confirmError ? 'confirm-password-status' : undefined} invalid={Boolean(confirmError)} inputClassName="field__input" />
          {confirmError ? <p className="field__status error" id="confirm-password-status" role="status" aria-live="polite" aria-atomic="true">{confirmError}</p> : null}
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy}><span aria-hidden={busy}>Change password</span><span aria-hidden={!busy}>Changing…</span></button>
      </form>
      <div className="settings-form__result" role="status" aria-live="polite" aria-atomic="true">
        {busy || status ? <p className={`settings-form__status${status && !status.startsWith('Password changed.') ? ' error' : ''}`}>{busy ? 'Changing…' : status}</p> : null}
      </div>
    </section>
  )
}
