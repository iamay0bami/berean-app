import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UpdatePasswordForm from '@/components/update-password-form'

export default async function UpdatePasswordPage() {
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) redirect('/auth/forgot-password')
  return <UpdatePasswordForm />
}
