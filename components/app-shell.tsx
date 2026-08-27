import type { ReactNode } from 'react'
import BottomNav from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/server'

export default async function AppShell({ children }: { children: ReactNode }) {
  const { data: { user } } = await (await createClient()).auth.getUser()
  return <div className="app-shell">{children}<BottomNav authenticated={Boolean(user)} /></div>
}
