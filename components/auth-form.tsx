'use client'

import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signInWithIdentifier } from '@/app/actions'

const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/
const USERNAME_FORMAT_ERROR = 'Usernames are 3–20 characters, start with a letter, and use only lowercase letters, numbers, and underscores.'

type UsernameNote = { message: string; kind: 'ok' | 'error' | null }

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

async function usernameCheck(value: string): Promise<{ ok: boolean; note: UsernameNote }> {
  const normalized = normalizeUsername(value)
  if (!normalized) return { ok: true, note: { message: '', kind: null } }
  if (!USERNAME_PATTERN.test(normalized)) return { ok: false, note: { message: USERNAME_FORMAT_ERROR, kind: 'error' } }
  const { data, error } = await createClient().rpc('username_available', { p_username: normalized })
  if (error) return { ok: true, note: { message: '', kind: null } }
  if (data === true) return { ok: true, note: { message: 'Username is available.', kind: 'ok' } }
  return { ok: false, note: { message: 'That username is already taken.', kind: 'error' } }
}

export default function AuthForm({ mode, next }: { mode: 'sign-in' | 'sign-up'; next?: string }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usernameNote, setUsernameNote] = useState<UsernameNote>({ message: '', kind: null })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const latestUsername = useRef('')

  async function handleUsernameBlur() {
    const normalized = normalizeUsername(username)
    if (!normalized) return
    const result = await usernameCheck(normalized)
    if (normalizeUsername(latestUsername.current) === normalized) setUsernameNote(result.note)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    if (mode === 'sign-in') {
      const result = await signInWithIdentifier(identifier, password)
      setBusy(false)
      if (result.error) return setMessage(result.error)
      window.location.assign(next && /^\/[^/]/.test(next) ? next : '/home')
      return
    }
    const normalizedUsername = normalizeUsername(username)
    if (normalizedUsername) {
      const check = await usernameCheck(normalizedUsername)
      setUsernameNote(check.note)
      if (!check.ok) {
        setBusy(false)
        return
      }
    }
    const supabase = createClient()
    const result = await supabase.auth.signUp({
      email: identifier,
      password,
      options: {
        data: { name, ...(normalizedUsername ? { username: normalizedUsername } : {}) },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setBusy(false)
    if (result.error) {
      if (result.error.message?.includes('username already taken') || result.error.message?.includes('duplicate key')) return setMessage('That username is already taken.')
      return setMessage(result.error.message)
    }
    if (!result.data.session) return setMessage('Check your email to confirm your account.')
    window.location.assign('/home')
  }

  return <main className="page-wrap auth-page"><div className="auth-card paper-card"><span className="brand-glyph">B</span><h1>{mode === 'sign-in' ? <>Welcome<br /><em>back.</em></> : <>Make room<br /><em>to listen.</em></>}</h1><p>{mode === 'sign-in' ? 'Sign in to continue your formation.' : 'Create your Berean account with email.'}</p><form onSubmit={submit}>{mode === 'sign-up' && <><input required value={name} onChange={event => setName(event.target.value)} placeholder="Name" autoComplete="name" /><input value={username} onChange={event => { latestUsername.current = event.target.value; setUsername(event.target.value); setUsernameNote({ message: '', kind: null }) }} onBlur={handleUsernameBlur} placeholder="Username (optional)" autoComplete="username" />{usernameNote.message && <p className={`field-message ${usernameNote.kind === 'ok' ? 'ok' : 'error'}`} role="status">{usernameNote.message}</p>}</>}<input required type={mode === 'sign-in' ? 'text' : 'email'} value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder={mode === 'sign-in' ? 'Email or username' : 'Email'} autoComplete={mode === 'sign-in' ? 'username' : 'email'} /><div className="password-field"><input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><button className="primary-button" disabled={busy}>{busy ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></form>{message && <p role="status">{message}</p>}<p>{mode === 'sign-in' ? 'New here? ' : 'Already have an account? '}<Link className="text-action" href={mode === 'sign-in' ? '/auth/sign-up' : '/auth/sign-in'}>{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</Link></p></div></main>
}
