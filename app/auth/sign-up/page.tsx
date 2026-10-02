import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthForm from '@/components/auth-form'

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (user) redirect('/home')
  return <AuthForm mode="sign-up" invite={invite} />
}
