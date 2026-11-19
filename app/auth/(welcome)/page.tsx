import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthChooserPage() {
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (user) redirect('/home')

  return (
    <main className="page-wrap auth-page auth-page--welcome">
      <header className="auth-intro">
        <h1 className="auth-title">Welcome to Berean</h1>
        <p className="auth-description">A place to read and learn with your church.</p>
      </header>
      <nav className="auth-choices" aria-label="Get started">
        <Link className="btn btn--primary" href="/auth/sign-in">Sign in</Link>
        <Link className="btn btn--secondary" href="/auth/sign-up">Join with an invite code</Link>
        <Link className="btn btn--secondary" href="/auth/start-a-new-church">Start a new church</Link>
      </nav>
    </main>
  )
}
