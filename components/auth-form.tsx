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

function signupDisplayCopy(message: string) {
  switch (message) {
    case USERNAME_FORMAT_ERROR:
      return 'Use 3–20 characters. Start with a letter and use lowercase letters, numbers or underscores.'
    case 'That username is already taken.':
      return 'That username is taken. Try another.'
    case 'Username is available.':
    case 'Enter your invite code.':
    case 'Invite code accepted.':
    case 'Check your email to confirm your account.':
      return message
    case "That invite code isn't valid.":
      return "That invite code isn't valid. Ask your church admin for a current code."
    default:
      return message
  }
}

export default function AuthForm({
  mode,
  next,
  notice,
  invite,
  initialJoinMode = 'join',
}: {
  mode: 'sign-in' | 'sign-up'
  next?: string
  notice?: string
  invite?: string
  initialJoinMode?: JoinMode
}) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameNote, setUsernameNote] = useState<UsernameNote>({ message: '', kind: null })
  const joinMode = initialJoinMode
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
      const errorCode = result.error.code ?? ''
      // The trigger is authoritative for the check-to-submit race window; the
      // on-blur RPC only covers the common case with friendlier feedback.
      if (errorMessage.includes('username already taken') || errorMessage.includes('duplicate key')) return setMessage('That username is already taken.')
      if (errorMessage.includes('invalid invite code')) return setMessage("That invite code isn't valid.")
      if (errorMessage.includes('organization required') || errorMessage.includes('could not create organization')) return setMessage("We couldn't create your church. Try a different name.")
      if (result.error.status === 429 || errorCode === 'over_email_send_rate_limit' || errorMessage.includes('over_email_send_rate_limit')) return setMessage('Too many sign-up emails right now. Wait a few minutes and try again.')
      return setMessage("We couldn't create your account. Check your details and try again.")
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
          {message && <p
            className="auth-form__status error"
            id="sign-in-result"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          ><span data-status-text>{resultText}</span></p>}
        </form>
      </AuthFrame>
    )
  }

  const isStart = joinMode === 'start'
  const usernameMessage = signupDisplayCopy(usernameNote.message)
  const inviteMessage = signupDisplayCopy(inviteNote.message)
  const resultMessage = signupDisplayCopy(message)
  const usernameDescription = usernameNote.message ? `${joinMode}-username-hint ${joinMode}-username-status` : `${joinMode}-username-hint`
  const inviteDescription = inviteNote.message ? 'join-invite-hint join-invite-status' : 'join-invite-hint'
  const resultIsSuccess = message === 'Check your email to confirm your account.'

  return (
    <AuthFrame
      title={isStart ? 'Start a new church' : 'Join with an invite code'}
      description={isStart ? 'Create a Berean space for your church.' : 'Create your account using the code from your church admin.'}
      backHref="/auth"
      backLabel="Back to choices"
      footer={<div className="auth-footer">
        <Link className="btn btn--quiet" href={isStart ? '/auth/sign-up' : '/auth/start-a-new-church'}>
          {isStart ? 'Joining a church? Join with an invite code' : 'Starting a church instead? Start a new church'}
        </Link>
        <Link className="btn btn--quiet" href="/auth/sign-in">Already have an account? Sign in</Link>
      </div>}
    >
      <form className="auth-form auth-form--signup" onSubmit={submit} aria-busy={busy}>
        <div className="field">
          <label className="field__label" htmlFor={`${joinMode}-name`}>Name</label>
          <input className="field__input" id={`${joinMode}-name`} name="name" type="text" inputMode="text" required value={name} onChange={event => setName(event.target.value)} autoComplete="name" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${joinMode}-username`}>Username (optional)</label>
          <input className="field__input" id={`${joinMode}-username`} name="username" type="text" inputMode="text" value={username} onChange={event => { latestUsername.current = event.target.value; setUsername(event.target.value); setUsernameNote({ message: '', kind: null }) }} onBlur={handleUsernameBlur} autoComplete="username" autoCapitalize="none" spellCheck={false} aria-invalid={usernameNote.kind === 'error' || undefined} aria-describedby={usernameDescription} />
          <p className="field__hint" id={`${joinMode}-username-hint`}>Use 3–20 characters. Start with a letter and use lowercase letters, numbers or underscores.</p>
          {usernameNote.message && <p className={`field__status${usernameNote.kind === 'ok' ? ' ok' : ' error'}`} id={`${joinMode}-username-status`} role="status" aria-live="polite" aria-atomic="true">{usernameMessage}</p>}
        </div>
        {isStart ? <>
          <div className="field">
            <label className="field__label" htmlFor="start-church-name">Church name</label>
            <input className="field__input" id="start-church-name" name="church-name" type="text" inputMode="text" required value={orgName} onChange={event => setOrgName(event.target.value)} autoComplete="organization" />
          </div>
          <div className="auth-founder">
            <p className="auth-note">You&apos;ll be your church&apos;s admin on Berean. If your church already uses Berean, join with an invite code instead.</p>
            <label className="auth-confirm">
              <input className="auth-confirm__input" type="checkbox" name="confirm-new-church" required checked={confirmedNewChurch} onChange={event => setConfirmedNewChurch(event.target.checked)} />
              <span className="auth-confirm__text">I&apos;m setting up a new church</span>
            </label>
            {!confirmedNewChurch && <p className="field__hint">Confirm below that you&apos;re setting up a new church before creating your account.</p>}
          </div>
        </> : <div className="field">
          <label className="field__label" htmlFor="join-invite-code">Invite code</label>
          <input className="field__input" id="join-invite-code" name="invite-code" type="text" inputMode="text" required value={inviteCode} onChange={event => { latestInvite.current = event.target.value; setInviteCode(event.target.value); setInviteNote({ message: '', kind: null }) }} onBlur={handleInviteBlur} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-invalid={inviteNote.kind === 'error' || undefined} aria-describedby={inviteDescription} />
          <p className="field__hint" id="join-invite-hint">Ask your church admin for an invite code.</p>
          {inviteNote.message && <p className={`field__status${inviteNote.kind === 'ok' ? ' ok' : ' error'}`} id="join-invite-status" role="status" aria-live="polite" aria-atomic="true">{inviteMessage}</p>}
        </div>}
        <div className="field">
          <label className="field__label" htmlFor={`${joinMode}-email`}>Email</label>
          <input className="field__input" id={`${joinMode}-email`} name="email" type="email" inputMode="email" required value={identifier} onChange={event => setIdentifier(event.target.value)} autoComplete="email" autoCapitalize="none" spellCheck={false} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${joinMode}-password`}>Password</label>
          <PasswordField id={`${joinMode}-password`} name="password" label="password" inputClassName="field__input" value={password} onChange={setPassword} placeholder="" autoComplete="new-password" describedBy={`${joinMode}-password-hint`} />
          <p className="field__hint" id={`${joinMode}-password-hint`}>Use at least 6 characters.</p>
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy || (isStart && !confirmedNewChurch)} aria-busy={busy}>
          <span aria-hidden={busy}>{isStart ? 'Create church and account' : 'Create account'}</span>
          <span aria-hidden={!busy}>{isStart ? 'Creating church…' : 'Creating account…'}</span>
        </button>
        {message && <p className={`auth-form__status${resultIsSuccess ? '' : ' error'}`} role="status" aria-live="polite" aria-atomic="true">{resultMessage}</p>}
      </form>
    </AuthFrame>
  )
}
