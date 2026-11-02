import type { ReactNode } from 'react'
import AppShellClient from '@/components/app-shell-client'
import { createClient } from '@/lib/supabase/server'

export default async function AppShell({ children }: { children: ReactNode }) {
  const { data: { user } } = await (await createClient()).auth.getUser()

  return <AppShellClient authenticated={Boolean(user)}>{children}</AppShellClient>
}
