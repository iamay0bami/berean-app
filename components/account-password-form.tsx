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
          <PasswordField id="current-password" name="current-password" label="current password" value={current} onChange={value => { setCurrent(value); setCurrentError(''); setStatus('') }} placeholder="" autoComplete="current-password" describedBy="current-password-status" invalid={Boolean(currentError)} inputClassName="field__input" />
          <p className={`field__status${currentError ? ' error' : ''}`} id="current-password-status" data-reserve="Current password is incorrect."><span data-status-text>{currentError}</span></p>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="new-password">New password</label>
          <PasswordField id="new-password" name="new-password" label="new password" value={next} onChange={value => { setNext(value); setNextError(''); setStatus('') }} placeholder="" autoComplete="new-password" describedBy="new-password-hint new-password-status" invalid={Boolean(nextError)} inputClassName="field__input" />
          <p className="field__hint" id="new-password-hint">Use at least 6 characters.</p>
          <p className={`field__status${nextError ? ' error' : ''}`} id="new-password-status" data-reserve="That password is too easy to guess. Choose a stronger one."><span data-status-text>{nextError}</span></p>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="confirm-password">Confirm new password</label>
          <PasswordField id="confirm-password" name="confirm-password" label="confirm password" value={confirm} onChange={value => { setConfirm(value); setConfirmError(''); setStatus('') }} placeholder="" autoComplete="new-password" describedBy="confirm-password-status" invalid={Boolean(confirmError)} inputClassName="field__input" />
          <p className={`field__status${confirmError ? ' error' : ''}`} id="confirm-password-status" data-reserve="Confirm your new password."><span data-status-text>{confirmError}</span></p>
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy}><span aria-hidden={busy}>Change password</span><span aria-hidden={!busy}>Changing…</span></button>
        <p className={`settings-form__status${status && !status.startsWith('Password changed.') ? ' error' : ''}`} role="status" aria-live="polite" data-reserve="Password changed. You can also sign out other devices below."><span data-status-text>{busy ? 'Changing…' : status}</span></p>
      </form>
    </section>
  )
}
