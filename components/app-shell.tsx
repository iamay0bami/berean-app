import type { ReactNode } from 'react'
import BottomNav from '@/components/bottom-nav'

export default function AppShell({ children }: { children: ReactNode }) {
  return <div className="app-shell">{children}<BottomNav /></div>
}
