'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signInWithIdentifier } from '@/app/actions'
import PasswordField from '@/components/password-field'

const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/
const USERNAME_FORMAT_ERROR = 'Usernames are 3–20 characters, start with a letter, and use only lowercase letters, numbers, and underscores.'

type UsernameNote = { message: string; kind: 'ok' | 'error' | null }
type JoinMode = 'join' | 'start'

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase()
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

async function inviteCodeCheck(value: string): Promise<{ ok: boolean; note: UsernameNote }> {
  const normalized = normalizeInviteCode(value)
  if (!normalized) return { ok: true, note: { message: '', kind: null } }
  const { data, error } = await createClient().rpc('org_invite_code_valid', { p_code: normalized })
  if (error) return { ok: true, note: { message: '', kind: null } }
  if (data === true) return { ok: true, note: { message: 'Invite code accepted.', kind: 'ok' } }
  return { ok: false, note: { message: "That invite code isn't valid.", kind: 'error' } }
}

export default function AuthForm({ mode, next, notice, invite }: { mode: 'sign-in' | 'sign-up'; next?: string; notice?: string; invite?: string }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameNote, setUsernameNote] = useState<UsernameNote>({ message: '', kind: null })
  const [joinMode, setJoinMode] = useState<JoinMode>('join')
  const [orgName, setOrgName] = useState('')
  const [confirmedNewChurch, setConfirmedNewChurch] = useState(false)
  const [inviteCode, setInviteCode] = useState(invite ?? '')
  const [inviteNote, setInviteNote] = useState<UsernameNote>({ message: '', kind: null })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const latestUsername = useRef('')
  const latestInvite = useRef(invite ?? '')

  async function handleUsernameBlur() {
    const normalized = normalizeUsername(username)
    if (!normalized) return
    const result = await usernameCheck(normalized)
    if (normalizeUsername(latestUsername.current) === normalized) setUsernameNote(result.note)
  }

  async function runInviteCheck(value: string) {
    const normalized = normalizeInviteCode(value)
    if (!normalized) return
    const result = await inviteCodeCheck(normalized)
    if (normalizeInviteCode(latestInvite.current) === normalized) setInviteNote(result.note)
  }

  async function handleInviteBlur() {
    await runInviteCheck(inviteCode)
  }

  // A prefilled code from /auth/sign-up?invite=… deserves its note without the
  // user having to blur the field to get it. Mount-only: `invite` is a fixed
  // prop for the life of this page.
  useEffect(() => {
    if (mode !== 'sign-up' || !invite) return
    void runInviteCheck(invite)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function chooseJoinMode(nextMode: JoinMode) {
    setJoinMode(nextMode)
    setInviteNote({ message: '', kind: null })
    setMessage('')
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

    const data: Record<string, string> = { name }
    if (normalizedUsername) data.username = normalizedUsername
    if (joinMode === 'start') {
      if (!confirmedNewChurch) {
        setBusy(false)
        return setMessage("Confirm that you're setting up a new church.")
      }
      const church = orgName.trim()
      if (!church) {
        setBusy(false)
        return setMessage('Enter your church name.')
      }
      data.founding_org_name = church
    } else {
      const code = normalizeInviteCode(inviteCode)
      if (!code) {
        setBusy(false)
        return setMessage('Enter your invite code.')
      }
      const check = await inviteCodeCheck(code)
      setInviteNote(check.note)
      if (!check.ok) {
        setBusy(false)
        return setMessage("That invite code isn't valid.")
      }
      data.invite_code = code
    }

    const supabase = createClient()
    const result = await supabase.auth.signUp({
      email: identifier,
      password,
      options: {
        data,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setBusy(false)
    if (result.error) {
      const errorMessage = result.error.message ?? ''
      // The trigger is authoritative for the check-to-submit race window; the
      // on-blur RPC only covers the common case with friendlier feedback.
      if (errorMessage.includes('username already taken') || errorMessage.includes('duplicate key')) return setMessage('That username is already taken.')
      if (errorMessage.includes('invalid invite code')) return setMessage("That invite code isn't valid.")
      if (errorMessage.includes('organization required') || errorMessage.includes('could not create organization')) return setMessage('We could not create your church. Try a different name.')
      return setMessage(result.error.message)
    }
    if (!result.data.session) return setMessage('Check your email to confirm your account.')
    window.location.assign('/home')
  }

  return <main className="page-wrap auth-page"><div className="auth-card paper-card"><span className="brand-glyph">B</span><h1>{mode === 'sign-in' ? <>Welcome <em>back.</em></> : <>Make room <em>to listen.</em></>}</h1><p>{mode === 'sign-in' ? 'Sign in to continue your formation.' : 'Create your Berean account with email.'}</p><form onSubmit={submit}>{mode === 'sign-up' && <><div className="auth-toggle" role="group" aria-label="How are you joining?"><button type="button" className={joinMode === 'join' ? 'active' : ''} aria-pressed={joinMode === 'join'} onClick={() => chooseJoinMode('join')}>Join with invite code</button><button type="button" className={joinMode === 'start' ? 'active' : ''} aria-pressed={joinMode === 'start'} onClick={() => chooseJoinMode('start')}>Start a new church</button></div><input required value={name} onChange={event => setName(event.target.value)} placeholder="Name" autoComplete="name" /><input value={username} onChange={event => { latestUsername.current = event.target.value; setUsername(event.target.value); setUsernameNote({ message: '', kind: null }) }} onBlur={handleUsernameBlur} placeholder="Username (optional)" autoComplete="username" />{usernameNote.message && <p className={`field-message ${usernameNote.kind === 'ok' ? 'ok' : 'error'}`} role="status">{usernameNote.message}</p>}{joinMode === 'join' ? <><input required value={inviteCode} onChange={event => { latestInvite.current = event.target.value; setInviteCode(event.target.value); setInviteNote({ message: '', kind: null }) }} onBlur={handleInviteBlur} placeholder="Invite code" autoComplete="off" />{inviteNote.message && <p className={`field-message ${inviteNote.kind === 'ok' ? 'ok' : 'error'}`} role="status">{inviteNote.message}</p>}</> : <><p className="auth-note">You&apos;re creating a new organization on Berean and will become its administrator. Only do this if you&apos;re setting up your own church, not joining an existing one.</p><input required value={orgName} onChange={event => setOrgName(event.target.value)} placeholder="Church name" autoComplete="organization" /><label className="auth-confirm"><input type="checkbox" required checked={confirmedNewChurch} onChange={event => setConfirmedNewChurch(event.target.checked)} /><span>I&apos;m setting up a new church</span></label></>}</>}<input required type={mode === 'sign-in' ? 'text' : 'email'} value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder={mode === 'sign-in' ? 'Email or username' : 'Email'} autoComplete={mode === 'sign-in' ? 'username' : 'email'} /><PasswordField value={password} onChange={setPassword} placeholder="Password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} />{mode === 'sign-in' && <p><Link className="small-link" href="/auth/forgot-password">Forgot password?</Link></p>}<button className="primary-button" disabled={busy || (mode === 'sign-up' && joinMode === 'start' && !confirmedNewChurch)}>{busy ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></form>{notice && <p role="status">{notice}</p>}{message && <p role="status">{message}</p>}<p>{mode === 'sign-in' ? 'New here? ' : 'Already have an account? '}<Link className="text-action" href={mode === 'sign-in' ? '/auth/sign-up' : '/auth/sign-in'}>{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</Link></p></div></main>
}
