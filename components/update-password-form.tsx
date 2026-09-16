'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PasswordField from '@/components/password-field'

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

  return <main className="page-wrap auth-page"><div className="auth-card paper-card"><span className="brand-glyph">B</span><h1>Choose a new<br /><em>password.</em></h1><p>Set a new password for your Berean account.</p><form onSubmit={submit}><PasswordField value={password} onChange={setPassword} placeholder="New password" autoComplete="new-password" /><PasswordField value={confirm} onChange={setConfirm} placeholder="Confirm password" autoComplete="new-password" label="confirm password" />{mismatch && <p className="field-message error" role="status">Passwords do not match.</p>}<button className="primary-button" disabled={busy}>{busy ? 'Working...' : 'Update password'}</button></form>{message && <p role="status">{message}</p>}</div></main>
}
