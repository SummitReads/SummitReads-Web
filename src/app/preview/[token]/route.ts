import { NextRequest, NextResponse } from 'next/server'

const PREVIEW_TOKEN = 'sk-launch-2026-xk9m'
const COOKIE_NAME   = 'ss_preview'
const COOKIE_TTL    = 60 * 60 * 72   // 72 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (token !== PREVIEW_TOKEN) {
    return NextResponse.redirect(new URL('/coming-soon', request.url))
  }

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
