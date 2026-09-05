import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthForm from '@/components/auth-form'

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (user) redirect('/home')
  return <AuthForm mode="sign-in" next={next} />
}
