import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import {
  extractTenantIdentifier,
  TENANT_HEADERS,
  DEFAULT_TENANT_SLUG,
} from '@/lib/tenant/tenant-resolver'
import { allowRequest } from '@/lib/rate-limit'

// =========================================================================
// Rate Limiter — backend em @/lib/rate-limit (Upstash REST ou memória)
// =========================================================================

const buildRateLimitKey = (request: NextRequest) => {
  const ip =
    (request as any).ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  return ip
}

const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 }
const API_RATE_LIMIT = { limit: 120, windowMs: 60 * 1000 }

/**
 * Middleware principal que:
 * 1. Rate limiting para APIs
 * 2. Identifica o tenant a partir do hostname
 * 3. Adiciona headers com informações do tenant (propagados para API routes)
 * 4. Verifica autenticação para rotas /admin e /parlamentar
 * 5. Headers de segurança (CSP, HSTS, etc.)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || 'localhost'

  // =========================================================================
  // 0. Rate Limiting
  // =========================================================================

  const isApi = pathname.startsWith('/api')

  if (isApi) {
    // Rotas internas do NextAuth não precisam de rate limit
    const isNextAuthInternal = pathname.startsWith('/api/auth/') &&
      !pathname.startsWith('/api/auth/callback') &&
      pathname !== '/api/auth/signin'

    if (!isNextAuthInternal) {
      const rlKey = `${buildRateLimitKey(request)}:${pathname}`
      if (!(await allowRequest(rlKey, API_RATE_LIMIT.limit, API_RATE_LIMIT.windowMs))) {
        return NextResponse.json(
          { success: false, error: 'Muitas requisições. Aguarde e tente novamente.' },
          { status: 429 }
        )
      }
    }

    // Rate limit apenas para login/signin (não para session, csrf, _log, etc.)
    if (pathname === '/api/auth/callback/credentials' || pathname === '/api/auth/signin') {
      const authKey = `${buildRateLimitKey(request)}:auth-login`
      if (!(await allowRequest(authKey, LOGIN_RATE_LIMIT.limit, LOGIN_RATE_LIMIT.windowMs))) {
        return NextResponse.json(
          { success: false, error: 'Muitas tentativas de login. Aguarde 5 minutos.' },
          { status: 429 }
        )
      }
    }
  }

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

  // Headers internos não precisam ir para o cliente

  // =========================================================================
  // 2. Verificação de Autenticação (rotas /admin e /parlamentar)
  // =========================================================================

  // Rotas que requerem autenticação
  // IMPORTANTE: /parlamentares (público) vs /parlamentar (área restrita do parlamentar)
  const isProtectedRoute = pathname.startsWith('/admin') || (pathname.startsWith('/parlamentar') && !pathname.startsWith('/parlamentares'))

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

      // RN-144 / Fase 1 C4: ADMIN e SECRETARIA DEVEM ter 2FA habilitado.
      // Se nao tem, redirect para a pagina de setup. Permite navegar so na propria
      // pagina de seguranca ate fazer enrollment. APIs de 2FA tambem permitidas.
      // Politica global (Configuracao seguranca.2fa.enabled) controla se a regra
      // esta ativa: quando OFF, ninguem e forcado a fazer enrollment.
      const globalTwoFactorEnabled = Boolean(token.globalTwoFactorEnabled)
      const requiresTwoFactor = globalTwoFactorEnabled && (userRole === 'ADMIN' || userRole === 'SECRETARIA')
      const hasTwoFactor = Boolean(token.twoFactorEnabled)
      const isOn2faSetupPage = pathname === '/admin/configuracoes/seguranca'

      if (requiresTwoFactor && !hasTwoFactor && !isOn2faSetupPage) {
        const setupUrl = new URL('/admin/configuracoes/seguranca', request.url)
        setupUrl.searchParams.set('enroll', '1')
        return NextResponse.redirect(setupUrl)
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
  // Apenas quando o site está realmente rodando em HTTPS (com domínio e SSL)
  const siteUrl = process.env.NEXTAUTH_URL || process.env.SITE_URL || ''
  if (process.env.NODE_ENV === 'production' && siteUrl.startsWith('https://')) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Content-Security-Policy - Previne XSS e injeção de código
  //
  // F2.7 (PLANO-CORRECOES-MAIO-2026): roll-out gradual para remover
  // `script-src 'unsafe-inline'`. Estrategia:
  //
  // 1. Sempre envia `Content-Security-Policy` (enforcing) com `'unsafe-inline'`
  //    — politica atual, nao quebra Next.js.
  // 2. Adicionalmente envia `Content-Security-Policy-Report-Only` SEM
  //    `'unsafe-inline'` para mapear o que esta inline. Browser nao bloqueia,
  //    apenas reporta no console — usado para validar antes de enforce.
  // 3. Quando `CSP_STRICT_ENFORCE=true`, troca enforcing para a versao
  //    estrita (sem unsafe-inline). Roll-out controlado.
  //
  // Pre-requisitos para passar de step 2 para step 3:
  //  - VLibras (script externo) liberado por host (https://vlibras.gov.br)
  //  - Scripts inline de Next.js (hydration) precisam de nonce — ver
  //    documentacao Next 15 sobre nonce em middleware + Script component.

  const cspStrictEnforce = process.env.CSP_STRICT_ENFORCE === 'true'
  const upgradeInsecureDirective: string[] =
    process.env.NODE_ENV === 'production' && siteUrl.startsWith('https://')
      ? ['upgrade-insecure-requests']
      : []

  const baseDirectives = [
    "default-src 'self'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://vlibras.gov.br",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://vlibras.gov.br",
    "frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://vlibras.gov.br",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    ...upgradeInsecureDirective,
  ]

  const stylesPermissive = [
    "style-src 'self' 'unsafe-inline' https://vlibras.gov.br",
    "style-src-elem 'self' 'unsafe-inline' https://vlibras.gov.br",
  ]
  // VLibras: o plugin servido por vlibras.gov.br carrega um script secundario
  // de cdn.jsdelivr.net (spbgovbr-vlibras/vlibras-portal) — precisa ser liberado
  // em script-src/script-src-elem, senao o widget de Libras nao inicializa.
  const scriptsPermissive = [
    `script-src 'self' 'unsafe-inline' https://vlibras.gov.br https://cdn.jsdelivr.net${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
    "script-src-elem 'self' 'unsafe-inline' https://vlibras.gov.br https://cdn.jsdelivr.net",
  ]
  // Estrita: sem unsafe-inline em scripts (mantemos em styles porque Tailwind
  // gera inline styles em runtime — quebrar style-src inviabilizaria o portal).
  const scriptsStrict = [
    `script-src 'self' https://vlibras.gov.br https://cdn.jsdelivr.net${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
    "script-src-elem 'self' https://vlibras.gov.br https://cdn.jsdelivr.net",
  ]

  const enforcingDirectives = [...baseDirectives, ...stylesPermissive, ...(cspStrictEnforce ? scriptsStrict : scriptsPermissive)]
  response.headers.set('Content-Security-Policy', enforcingDirectives.join('; '))

  if (!cspStrictEnforce) {
    const reportOnlyDirectives = [...baseDirectives, ...stylesPermissive, ...scriptsStrict]
    response.headers.set('Content-Security-Policy-Report-Only', reportOnlyDirectives.join('; '))
  }

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
