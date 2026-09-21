import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: cookies => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  // Org-scoped RLS means a signed-out visitor resolves to no organization and would
  // otherwise see empty content lists, so these paths now require a session too.
  const privatePaths = ['/profile', '/discuss', '/home', '/classes', '/sermons']
  const privatePath = privatePaths.some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))
  if (privatePath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ['/profile/:path*', '/discuss/:path*', '/home/:path*', '/classes/:path*', '/sermons/:path*'],
}
