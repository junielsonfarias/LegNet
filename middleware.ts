import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type RateLimitEntry = {
  count: number
  expires: number
}

type RateLimiter = Map<string, RateLimitEntry>

const getLimiter = (): RateLimiter => {
  const global = globalThis as any
  if (!global.__CAMARA_RATE_LIMITER__) {
    global.__CAMARA_RATE_LIMITER__ = new Map<string, RateLimitEntry>()
  }
  return global.__CAMARA_RATE_LIMITER__
}

const allowRequest = (key: string, limit: number, windowMs: number) => {
  const limiter = getLimiter()
  const current = limiter.get(key)
  const now = Date.now()

  if (!current || current.expires < now) {
    limiter.set(key, { count: 1, expires: now + windowMs })
    return true
  }

  if (current.count >= limit) {
    return false
  }

  current.count += 1
  limiter.set(key, current)
  return true
}

const buildRateLimitKey = (request: NextRequest) => {
  const ip =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  const userAgent = request.headers.get('user-agent') ?? 'anonymous'
  return `${ip}:${userAgent}`
}

const respondTooManyRequests = (isApi: boolean) => {
  if (isApi) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Aguarde e tente novamente.' },
      { status: 429 }
    )
  }

  return new NextResponse('Too many requests', {
    status: 429,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}

const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 }
const API_RATE_LIMIT = { limit: 120, windowMs: 60 * 1000 }

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api')

  if (isApi) {
    const key = `${buildRateLimitKey(request)}:${pathname}`
    if (!allowRequest(key, API_RATE_LIMIT.limit, API_RATE_LIMIT.windowMs)) {
      return respondTooManyRequests(true)
    }

    if (pathname.startsWith('/api/auth')) {
      const authKey = `${buildRateLimitKey(request)}:auth`
      if (!allowRequest(authKey, LOGIN_RATE_LIMIT.limit, LOGIN_RATE_LIMIT.windowMs)) {
        return respondTooManyRequests(true)
      }
    }
  }

  // Proteger rotas /admin/* (exceto /admin/login)
  if (!isApi && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token =
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token')

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}