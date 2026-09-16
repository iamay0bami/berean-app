import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthForm from '@/components/auth-form'

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; link?: string }> }) {
  const { next, reset, link } = await searchParams
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (user) redirect('/home')
  const notice = link === 'invalid' ? 'That link is invalid or has expired. Please request a new one.' : reset === '1' ? 'Password updated — sign in with your new password.' : undefined
  return <AuthForm mode="sign-in" next={next} notice={notice} />
}
