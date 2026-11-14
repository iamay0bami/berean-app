'use client'

import { FormEvent, useState } from 'react'
import { signOut, signOutOtherDevices } from '@/app/actions'

export default function AccountSessionForms() {
  const [othersStatus, setOthersStatus] = useState('')
  const [othersBusy, setOthersBusy] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('')
  const [currentBusy, setCurrentBusy] = useState(false)

  async function submitOthers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (othersBusy) return
    setOthersStatus('')
    setOthersBusy(true)
    try {
      const result = await signOutOtherDevices()
      setOthersStatus(result.error ?? result.message ?? 'Other devices signed out.')
    } catch {
      setOthersStatus("We couldn't sign out other devices. Try again.")
    } finally {
      setOthersBusy(false)
    }
  }

  async function submitCurrent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (currentBusy) return
    setCurrentStatus('')
    setCurrentBusy(true)
    try {
      const result = await signOut()
      if (result?.error) {
        setCurrentBusy(false)
        setCurrentStatus(result.error)
      }
    } catch {
      setCurrentBusy(false)
      setCurrentStatus("We couldn't sign you out. Try again.")
    }
  }

  return (
    <>
      <section className="settings-form-card card card--borderless" aria-labelledby="sessions-title">
        <h2 className="card__title" id="sessions-title">Sessions</h2>
        <form className="settings-form" onSubmit={submitOthers} aria-busy={othersBusy}>
          <p className="card__meta">Your current device stays signed in.</p>
          <button className="btn btn--secondary" type="submit" disabled={othersBusy}><span aria-hidden={othersBusy}>Sign out on other devices</span><span aria-hidden={!othersBusy}>Signing out…</span></button>
          <p className={`settings-form__status${othersStatus && othersStatus !== 'Other devices signed out.' ? ' error' : ''}`} role="status" aria-live="polite" data-reserve="We couldn't sign out other devices. Try again."><span data-status-text>{othersBusy ? 'Signing out…' : othersStatus}</span></p>
        </form>
      </section>
      <section className="settings-form-card card card--borderless" aria-labelledby="current-session-title">
        <h2 className="card__title" id="current-session-title">Current session</h2>
        <form className="settings-form" onSubmit={submitCurrent} aria-busy={currentBusy}>
          <button className="btn btn--danger" type="submit" disabled={currentBusy}><span aria-hidden={currentBusy}>Sign out</span><span aria-hidden={!currentBusy}>Signing out…</span></button>
          <p className={`settings-form__status${currentStatus ? ' error' : ''}`} role="status" aria-live="polite" data-reserve="Your session has expired. Sign in again."><span data-status-text>{currentBusy ? 'Signing out…' : currentStatus}</span></p>
        </form>
      </section>
    </>
  )
}
