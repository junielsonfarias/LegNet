import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import {
  extractTenantIdentifier,
  TENANT_HEADERS,
  DEFAULT_TENANT_SLUG,
} from '@/lib/tenant/tenant-resolver'

/**
 * Middleware principal que:
 * 1. Identifica o tenant a partir do hostname
 * 2. Adiciona headers com informações do tenant (propagados para API routes)
 * 3. Verifica autenticação para rotas /admin
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || 'localhost'

  // =========================================================================
  // 1. Identificação do Tenant
  // =========================================================================

  const { type, identifier } = extractTenantIdentifier(hostname)

  // Determina o slug do tenant (com suporte a override em dev)
  let tenantSlug = identifier
  const overrideTenant = request.headers.get('x-tenant-override')
  if (overrideTenant && process.env.NODE_ENV === 'development') {
    tenantSlug = overrideTenant
  }

  // Clona os headers do request e adiciona os do tenant
  // Isso permite que as API routes acessem os headers via request.headers.get()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(TENANT_HEADERS.TENANT_SLUG, tenantSlug)
  requestHeaders.set('x-tenant-type', type)

  // Cria response propagando os novos headers para as API routes
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Também adiciona headers no response (para o cliente)
  response.headers.set(TENANT_HEADERS.TENANT_SLUG, tenantSlug)
  response.headers.set('x-tenant-type', type)

  // =========================================================================
  // 2. Verificação de Autenticação (rotas /admin e /parlamentar)
  // =========================================================================

  // Rotas que requerem autenticação
  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/parlamentar')

  if (isProtectedRoute) {
    // Obtém token de autenticação
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Se não está autenticado, redireciona para login
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = token.role as string

    // Regras específicas para rotas /parlamentar
    if (pathname.startsWith('/parlamentar')) {
      // Apenas usuários com role PARLAMENTAR podem acessar /parlamentar
      if (userRole !== 'PARLAMENTAR') {
        // Redireciona para área apropriada
        if (['ADMIN', 'EDITOR', 'OPERADOR', 'SECRETARIA'].includes(userRole)) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // Regras para rotas /admin
    if (pathname.startsWith('/admin')) {
      // Verifica se tem role permitida para admin
      const allowedRolesAdmin = ['ADMIN', 'EDITOR', 'OPERADOR', 'SECRETARIA']

      // PARLAMENTAR não pode acessar /admin diretamente (exceto se for página de login)
      if (userRole === 'PARLAMENTAR') {
        return NextResponse.redirect(new URL('/parlamentar', request.url))
      }

      if (!allowedRolesAdmin.includes(userRole)) {
        // Usuário autenticado mas sem permissão
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // Adiciona informações do usuário aos headers
    response.headers.set('x-user-role', userRole)
    response.headers.set('x-user-id', token.sub || '')
  }

  // =========================================================================
  // 3. Headers de Segurança
  // =========================================================================

  // X-Frame-Options - Previne clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')

  // X-Content-Type-Options - Previne MIME-sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // X-XSS-Protection - Proteção XSS legada (ainda útil para browsers antigos)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer-Policy - Controla informações enviadas no header Referer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy - Restringe APIs do navegador
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Strict-Transport-Security (HSTS) - Força HTTPS
  // Apenas em produção para não afetar desenvolvimento local
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Content-Security-Policy - Previne XSS e injeção de código
  // Configuração permissiva para Next.js mas ainda segura
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self + inline (necessário para Next.js) + eval (necessário para alguns recursos)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Estilos: self + inline (necessário para Tailwind e componentes)
    "style-src 'self' 'unsafe-inline'",
    // Imagens: self + data URIs + HTTPS (para imagens externas)
    "img-src 'self' data: https: blob:",
    // Fonts: self + data URIs
    "font-src 'self' data:",
    // Conexões: self + Supabase + WebSockets
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
    // Frames: apenas self (para PDFs embarcados)
    "frame-src 'self' blob:",
    // Base URI: apenas self
    "base-uri 'self'",
    // Form actions: apenas self
    "form-action 'self'",
    // Frame ancestors: apenas self (equivalente ao X-Frame-Options)
    "frame-ancestors 'self'",
    // Object sources: nenhum (previne plugins)
    "object-src 'none'",
    // Upgrade insecure requests em produção
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : [])
  ]

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))

  return response
}

/**
 * Configuração do matcher - define quais rotas o middleware processa
 *
 * - Processa todas as rotas exceto:
 *   - _next (arquivos internos do Next.js)
 *   - Arquivos estáticos (imagens, etc)
 *   - Favicon
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
