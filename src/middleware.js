import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// ── Coming Soon ───────────────────────────────────────────────────────────────
const COMING_SOON  = true
const PREVIEW_TOKEN = 'sk-launch-2026-xk9m'  // change this to anything hard to guess
const COOKIE_NAME   = 'ss_preview'

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
      const cookie = request.cookies.get(COOKIE_NAME)
      if (!cookie || cookie.value !== 'granted') {
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
