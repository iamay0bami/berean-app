import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next')
  const safeNext = next && /^\/[^/]/.test(next) ? next : null
  if (!code) return NextResponse.redirect(new URL('/auth/sign-in?link=invalid', request.url))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL('/auth/sign-in?link=invalid', request.url))
  const redirectType = (data as { redirectType?: string | null } | null)?.redirectType
  if (redirectType === 'recovery') return NextResponse.redirect(new URL('/auth/update-password', request.url))
  return NextResponse.redirect(new URL(safeNext ?? '/home', request.url))
}
