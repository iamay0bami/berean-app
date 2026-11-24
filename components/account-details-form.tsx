'use client'

import { FormEvent, useState } from 'react'
import { updateOwnAccount } from '@/app/actions'
import { normalizeHumanText } from '@/lib/text'

const USERNAME_FORMAT_ERROR = 'Usernames are 3–20 characters, start with a letter, and use only lowercase letters, numbers, and underscores.'
const NAME_ERROR = 'Name must be between 1 and 80 characters.'

function focusField(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus())
}

export default function AccountDetailsForm({ initialName, initialUsername, email }: { initialName: string; initialUsername: string; email: string }) {
  const [name, setName] = useState(initialName)
  const [username, setUsername] = useState(initialUsername)
  const [nameError, setNameError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const normalizedName = normalizeHumanText(name)
    const normalizedUsername = username.trim().toLowerCase()
    setNameError('')
    setUsernameError('')
    setStatus('')

    if (Array.from(normalizedName).length < 1 || Array.from(normalizedName).length > 80) {
      setNameError(NAME_ERROR)
      focusField('account-name')
      return
    }

    setBusy(true)
    try {
      const result = await updateOwnAccount(normalizedName, normalizedUsername)
      if (result.error) {
        if (result.error === NAME_ERROR) {
          setNameError(result.error)
          focusField('account-name')
        } else if (result.error === USERNAME_FORMAT_ERROR || result.error === 'That username is already taken.') {
          setUsernameError(result.error)
          focusField('account-username')
        } else {
          setStatus(result.error)
        }
        return
      }

      setName(normalizedName)
      setUsername(normalizedUsername)
      setStatus(result.message ?? 'Changes saved.')
    } catch {
      setStatus("We couldn't save your changes. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="settings-form-card card card--borderless" aria-labelledby="personal-details-title">
      <h2 className="card__title" id="personal-details-title">Personal details</h2>
      <form className="settings-form" onSubmit={submit} noValidate aria-busy={busy}>
        <div className="field">
          <label className="field__label" htmlFor="account-name">Name</label>
          <input className="field__input" id="account-name" name="name" value={name} onChange={event => { setName(event.target.value); setNameError(''); setStatus('') }} autoComplete="name" aria-invalid={Boolean(nameError) || undefined} aria-describedby={nameError ? 'account-name-status' : undefined} />
          {nameError ? <p className="field__status error" id="account-name-status" role="status" aria-live="polite" aria-atomic="true">{nameError}</p> : null}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="account-username">Username</label>
          <input className="field__input" id="account-username" name="username" value={username} onChange={event => { setUsername(event.target.value); setUsernameError(''); setStatus('') }} autoComplete="username" autoCapitalize="none" spellCheck={false} aria-invalid={Boolean(usernameError) || undefined} aria-describedby={usernameError ? 'account-username-hint account-username-status' : 'account-username-hint'} />
          <p className="field__hint" id="account-username-hint">Optional. Use 3–20 characters, start with a letter, and use only lowercase letters, numbers, and underscores.</p>
          {usernameError ? <p className="field__status error" id="account-username-status" role="status" aria-live="polite" aria-atomic="true">{usernameError}</p> : null}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="account-email">Email</label>
          <input className="field__input" id="account-email" name="email" type="email" value={email} readOnly aria-readonly="true" autoComplete="email" aria-describedby="account-email-hint" />
          <p className="field__hint" id="account-email-hint">Your email cannot be changed here.</p>
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy}><span aria-hidden={busy}>Save changes</span><span aria-hidden={!busy}>Saving…</span></button>
      </form>
      <div className="settings-form__result" role="status" aria-live="polite" aria-atomic="true">
        {busy || status ? <p className={`settings-form__status${status && resultIsError(status) ? ' error' : ''}`}><span className={status === 'No changes to save.' ? 'field__hint' : undefined}>{busy ? 'Saving…' : status}</span></p> : null}
      </div>
    </section>
  )
}

function resultIsError(message: string) {
  return message !== 'Changes saved.' && message !== 'No changes to save.'
}
