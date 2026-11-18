'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizeHumanText } from '@/lib/text'
import { signInWithIdentifier } from '@/app/actions'
import PasswordField from '@/components/password-field'
import { AuthFrame } from '@/components/auth-presentation'

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

function signInMessageCopy(message: string) {
  switch (message) {
    case 'Invalid email/username or password':
      return "That email or username and password don't match. Check both and try again."
    case 'Please confirm your email before signing in — check your inbox.':
      return 'Confirm your email before signing in. Check your inbox.'
    default:
      return message
  }
}

function signInNoticeCopy(notice?: string) {
  switch (notice) {
    case 'That link is invalid or has expired. Please request a new one.':
      return 'That link is invalid or has expired. Request a new link.'
    case 'Password updated — sign in with your new password.':
      return 'Password updated. Sign in with your new password.'
    default:
      return notice ?? ''
  }
}

const SIGN_IN_RESULT_RESERVE = signInMessageCopy('Invalid email/username or password')

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

    const data: Record<string, string> = { name: normalizeHumanText(name) }
    if (normalizedUsername) data.username = normalizedUsername
    if (joinMode === 'start') {
      if (!confirmedNewChurch) {
        setBusy(false)
        return setMessage("Confirm that you're setting up a new church.")
      }
      const church = normalizeHumanText(orgName)
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

  if (mode === 'sign-in') {
    const noticeText = signInNoticeCopy(notice)
    const resultText = signInMessageCopy(message)
    const invalidLinkNotice = notice === 'That link is invalid or has expired. Please request a new one.'

    return (
      <AuthFrame
        title="Sign in"
        description="Use your email address or username."
        backHref="/auth"
        backLabel="Back to choices"
        footer={<Link className="btn btn--quiet" href="/auth/sign-up">New here? Create an account</Link>}
      >
        <form className="auth-form auth-form--sign-in" onSubmit={submit} aria-busy={busy}>
          {noticeText && <p
            className={`auth-form__status${invalidLinkNotice ? ' error' : ''}`}
            id="sign-in-notice"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          ><span data-status-text>{noticeText}</span></p>}
          <div className="field">
            <label className="field__label" htmlFor="sign-in-identifier">Email or username</label>
            <input
              className="field__input"
              id="sign-in-identifier"
              name="identifier"
              type="text"
              required
              value={identifier}
              onChange={event => setIdentifier(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="sign-in-result"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sign-in-password">Password</label>
            <PasswordField
              id="sign-in-password"
              name="password"
              label="password"
              inputClassName="field__input"
              value={password}
              onChange={setPassword}
              placeholder=""
              autoComplete="current-password"
              describedBy="sign-in-result"
            />
          </div>
          <Link className="btn btn--quiet" href="/auth/forgot-password">Forgot password?</Link>
          <button className="btn btn--primary" type="submit" disabled={busy} aria-busy={busy}>
            <span aria-hidden={busy}>Sign in</span>
            <span aria-hidden={!busy}>Signing in…</span>
          </button>
          <p
            className={`auth-form__status${message ? ' error' : ''}`}
            id="sign-in-result"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-reserve={SIGN_IN_RESULT_RESERVE}
          ><span data-status-text>{resultText}</span></p>
        </form>
      </AuthFrame>
    )
  }

  return <main className="page-wrap auth-page"><div className="auth-card card card--borderless"><span className="brand-glyph">B</span><h1 className="auth-title">{<>Make room <em>to listen.</em></>}</h1><p className="auth-description">{'Create your Berean account with email.'}</p><form className="auth-form" onSubmit={submit}>{mode === 'sign-up' && <><div className="auth-toggle" role="group" aria-label="How are you joining?"><button type="button" className={`btn btn--secondary${joinMode === 'join' ? ' active' : ''}`} aria-pressed={joinMode === 'join'} onClick={() => chooseJoinMode('join')}>Join with invite code</button><button type="button" className={`btn btn--secondary${joinMode === 'start' ? ' active' : ''}`} aria-pressed={joinMode === 'start'} onClick={() => chooseJoinMode('start')}>Start a new church</button></div><input className="field__input" required value={name} onChange={event => setName(event.target.value)} placeholder="Name" autoComplete="name" /><input className="field__input" value={username} onChange={event => { latestUsername.current = event.target.value; setUsername(event.target.value); setUsernameNote({ message: '', kind: null }) }} onBlur={handleUsernameBlur} placeholder="Username (optional)" autoComplete="username" />{usernameNote.message && <p className={`field-message ${usernameNote.kind === 'ok' ? 'ok' : 'error'}`} role="status">{usernameNote.message}</p>}{joinMode === 'join' ? <><input className="field__input" required value={inviteCode} onChange={event => { latestInvite.current = event.target.value; setInviteCode(event.target.value); setInviteNote({ message: '', kind: null }) }} onBlur={handleInviteBlur} placeholder="Invite code" autoComplete="off" />{inviteNote.message && <p className={`field-message ${inviteNote.kind === 'ok' ? 'ok' : 'error'}`} role="status">{inviteNote.message}</p>}</> : <><p className="auth-note">You&apos;re creating a new organization on Berean and will become its administrator. Only do this if you&apos;re setting up your own church, not joining an existing one.</p><input className="field__input" required value={orgName} onChange={event => setOrgName(event.target.value)} placeholder="Church name" autoComplete="organization" /><label className="auth-confirm"><input type="checkbox" required checked={confirmedNewChurch} onChange={event => setConfirmedNewChurch(event.target.checked)} /><span>I&apos;m setting up a new church</span></label></>}</>}<input className="field__input" required type="email" value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="Email" autoComplete="email" /><PasswordField inputClassName="field__input" value={password} onChange={setPassword} placeholder="Password" autoComplete="new-password" /><button className="btn btn--primary" disabled={busy || (mode === 'sign-up' && joinMode === 'start' && !confirmedNewChurch)}>{busy ? 'Working...' : 'Create account'}</button></form>{notice && <p className="auth-description" role="status">{notice}</p>}{message && <p className="auth-description" role="status">{message}</p>}<p className="auth-description">{'Already have an account? '}<Link className="btn btn--quiet" href="/auth/sign-in">{'Sign in'}</Link></p></div></main>
}
