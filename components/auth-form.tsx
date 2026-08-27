'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const supabase = createClient()
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
    setBusy(false)
    if (result.error) return setMessage(result.error.message)
    if (mode === 'sign-up' && !result.data.session) return setMessage('Check your email to confirm your account.')
    window.location.assign('/home')
  }

  return <main className="page-wrap auth-page"><div className="auth-card paper-card"><span className="brand-glyph">B</span><h1>{mode === 'sign-in' ? <>Welcome<br /><em>back.</em></> : <>Make room<br /><em>to listen.</em></>}</h1><p>{mode === 'sign-in' ? 'Sign in to continue your formation.' : 'Create your Berean account with email.'}</p><form onSubmit={submit}>{mode === 'sign-up' && <input required value={name} onChange={event => setName(event.target.value)} placeholder="Name" autoComplete="name" />}<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" autoComplete="email" /><input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /><button className="primary-button" disabled={busy}>{busy ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></form>{message && <p role="status">{message}</p>}<Link href={mode === 'sign-in' ? '/auth/sign-up' : '/auth/sign-in'}>{mode === 'sign-in' ? 'Need an account?' : 'Already have an account?'}</Link></div></main>
}
