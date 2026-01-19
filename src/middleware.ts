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
  // 2. Verificação de Autenticação (apenas rotas /admin)
  // =========================================================================

  if (pathname.startsWith('/admin')) {
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

    // Verifica se tem role permitida
    const allowedRoles = ['ADMIN', 'EDITOR', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA']
    const userRole = token.role as string

    if (!allowedRoles.includes(userRole)) {
      // Usuário autenticado mas sem permissão
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Adiciona informações do usuário aos headers
    response.headers.set('x-user-role', userRole)
    response.headers.set('x-user-id', token.sub || '')
  }

  // =========================================================================
  // 3. Headers de Segurança
  // =========================================================================

  // Adiciona headers de segurança básicos
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')

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
