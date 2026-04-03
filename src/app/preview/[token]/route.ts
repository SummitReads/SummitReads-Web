import { NextRequest, NextResponse } from 'next/server'

// These must match middleware.ts exactly
const PREVIEW_TOKEN = 'sk-launch-2026-xk9m'
const COOKIE_NAME   = 'ss_preview'
const COOKIE_TTL    = 60 * 60 * 72   // 72 hours

export function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  if (params.token !== PREVIEW_TOKEN) {
    // Wrong token — send to coming soon, no cookie set
    return NextResponse.redirect(new URL('/coming-soon', request.url))
  }

  // Valid token — set cookie and redirect to the live site
  const response = NextResponse.redirect(new URL('/', request.url))

  response.cookies.set(COOKIE_NAME, 'granted', {
    maxAge:   COOKIE_TTL,
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    path:     '/',
  })

  return response
}
