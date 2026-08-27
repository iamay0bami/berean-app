import Link from 'next/link'
import AppShell from '@/components/app-shell'
import { Meta } from '@/components/shared'

export default function NotFound() {
  return <AppShell><div className="page-wrap"><main className="page-intro"><Meta>A QUIET DETOUR</Meta><h1>This page wandered a little.</h1><p>Let&apos;s bring you back to a little room to listen, learn, and live the Word.</p><Link className="text-action" href="/home">Back home <span aria-hidden="true">→</span></Link></main></div></AppShell>
}
