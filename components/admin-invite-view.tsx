'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { createOrgInviteCode } from '@/app/actions'
import AdminNav from '@/components/admin-nav'
import { Header, Meta } from '@/components/shared'

type CopyTarget = 'code' | 'link'

export default function AdminInviteView({ initialCode }: { initialCode: string | null }) {
  const [code, setCode] = useState(initialCode)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState<CopyTarget | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const copiedTimer = useRef<number | null>(null)

  // The shareable link needs the real host, which is only known in the browser.
  // Setting it in an effect rather than during render avoids a hydration mismatch.
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => () => {
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
  }, [])

  const link = code ? `${origin}/auth/sign-up?invite=${code}` : ''

  async function copy(value: string, target: CopyTarget) {
    setError(null)
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      setError('Copy failed — select the text and copy it manually.')
      return
    }
    setCopied(target)
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => setCopied(null), 2000)
  }

  function generate() {
    setError(null)
    setConfirming(false)
    startTransition(async () => {
      const result = await createOrgInviteCode()
      if (result.error) return setError(result.error)
      setCode(result.code)
    })
  }

  return <div className="page-wrap"><Header /><main><section className="page-intro"><AdminNav /><Meta>ADMINISTRATION</Meta><h1>Invite people</h1><p>Share this code with people who should join your church on Berean.</p></section><section className="paper-card invite-card">{code === null ? <><p className="auth-note">Your church has no invite code yet. Generate one to give people a way to join.</p><div className="invite-actions"><button className="primary-button" disabled={isPending} onClick={generate}>{isPending ? 'Generating...' : 'Generate invite code'}</button></div></> : <><Meta>INVITE CODE</Meta><div className="invite-code-row"><p className="invite-code">{code}</p><button className="outline-button invite-copy" aria-label="Copy invite code" onClick={() => copy(code, 'code')}>{copied === 'code' ? <Check size={16} /> : <Copy size={16} />}<span>{copied === 'code' ? 'Copied' : 'Copy'}</span></button></div><div><Meta>SHAREABLE LINK</Meta><div className="share-input"><input readOnly aria-label="Invite link" value={origin ? link : 'Loading link...'} onFocus={event => event.target.select()} /><button aria-label="Copy invite link" disabled={!origin} onClick={() => copy(link, 'link')}>{copied === 'link' ? <Check size={17} /> : <Copy size={17} />}</button></div></div><div className="invite-actions"><button className="outline-button" disabled={isPending} onClick={() => { setError(null); setConfirming(true) }}>Regenerate</button></div>{confirming && <div className="invite-warning" role="alert"><p>Generating a new code invalidates the current code and every link already shared with it, immediately. Anyone who has not yet signed up will need the new code.</p><div className="invite-actions"><button className="primary-button" onClick={generate}>Yes, generate a new code</button><button className="outline-button" onClick={() => setConfirming(false)}>Cancel</button></div></div>}</>}{error && <p className="field-message error" role="status">{error}</p>}<p className="sr-only" role="status">{copied === 'code' ? 'Invite code copied.' : copied === 'link' ? 'Invite link copied.' : ''}</p></section></main></div>
}
