import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// ── Coming Soon ───────────────────────────────────────────────────────────────
const COMING_SOON   = true
const PREVIEW_TOKEN = 'sk-launch-2026-xk9m'  // change this to anything hard to guess
const COOKIE_NAME   = 'ss_preview'

const ALLOWED_IPS = [
  '73.131.213.38',  // home network
]

const COMING_SOON_BYPASS = [
  '/coming-soon',
  '/preview/',
  '/_next/',
  '/favicon',
  '/api/',
]

// ── Main middleware ───────────────────────────────────────────────────────────
export async function middleware(request) {
  const { pathname } = request.nextUrl

  // ── Coming soon gate (runs before auth) ──────────────────────────────────
  if (COMING_SOON) {
    const isBypassed = COMING_SOON_BYPASS.some(p => pathname.startsWith(p))

    if (!isBypassed) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || request.headers.get('x-real-ip')
        || ''

      const isAllowedIP = ALLOWED_IPS.includes(ip)
      const cookie = request.cookies.get(COOKIE_NAME)
      const hasCookie = cookie?.value === 'granted'

      // Authenticated users always get through — checked later in the auth block
      // We use a lightweight cookie check here; full auth verify happens below
      const hasAuthCookie = [...request.cookies.getAll()].some(c => c.name.includes('auth-token') || c.name.includes('sb-'))

      if (!isAllowedIP && !hasCookie && !hasAuthCookie) {
        return NextResponse.rewrite(new URL('/coming-soon', request.url))
      }
    }
  }

  // ── Existing Supabase auth (unchanged) ────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
