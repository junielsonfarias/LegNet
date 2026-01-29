import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware de proteção CSRF (Cross-Site Request Forgery)
 *
 * Verifica se a requisição vem de uma origem confiável através dos headers:
 * - Origin: Preferencial, mais seguro
 * - Referer: Fallback para quando Origin não está disponível
 *
 * IMPORTANTE: Este middleware deve ser aplicado APENAS em rotas de mutação (POST, PUT, PATCH, DELETE)
 * Rotas GET são seguras por definição (não modificam estado)
 *
 * @example
 * ```typescript
 * // Em um route handler
 * import { validateCsrf, CsrfError } from '@/lib/middleware/csrf'
 *
 * export async function POST(request: NextRequest) {
 *   const csrfError = validateCsrf(request)
 *   if (csrfError) return csrfError
 *
 *   // ... resto da lógica
 * }
 * ```
 */

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * Obtém a lista de origens permitidas
 * Em produção, apenas o domínio da aplicação
 * Em desenvolvimento, permite localhost
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = []

  // URL base da aplicação
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      const url = new URL(appUrl)
      origins.push(url.origin)
    } catch {
      // URL inválida, ignorar
    }
  }

  // Em desenvolvimento, permitir localhost
  if (process.env.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    )
  }

  // Vercel preview deployments
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`)
  }

  // Domínio de produção
  if (process.env.NEXT_PUBLIC_DOMAIN) {
    origins.push(`https://${process.env.NEXT_PUBLIC_DOMAIN}`)
  }

  return origins
}

/**
 * Extrai a origem de uma requisição
 * Prioriza Origin, usa Referer como fallback
 */
function getRequestOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin')
  if (origin) return origin

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const url = new URL(referer)
      return url.origin
    } catch {
      return null
    }
  }

  return null
}

/**
 * Classe de erro CSRF para tratamento específico
 */
export class CsrfError extends Error {
  constructor(message: string = 'Requisição rejeitada por falha na validação CSRF') {
    super(message)
    this.name = 'CsrfError'
  }
}

/**
 * Valida proteção CSRF para uma requisição
 *
 * @param request - Requisição Next.js
 * @returns null se válido, NextResponse de erro se inválido
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  // Métodos seguros não precisam de validação CSRF
  if (SAFE_METHODS.includes(request.method)) {
    return null
  }

  const origin = getRequestOrigin(request)
  const allowedOrigins = getAllowedOrigins()

  // Se não há origem e não é uma requisição de API pública
  // Em desenvolvimento, ser mais permissivo para ferramentas como Postman
  if (!origin) {
    if (process.env.NODE_ENV === 'development') {
      // Permitir em desenvolvimento (para testes com Postman, curl, etc.)
      console.warn('[CSRF] Requisição sem Origin/Referer permitida em desenvolvimento')
      return null
    }

    // Em produção, rejeitar requisições sem origem
    console.warn('[CSRF] Requisição rejeitada: sem Origin ou Referer', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Requisição rejeitada: origem não identificada'
      },
      { status: 403 }
    )
  }

  // Verificar se a origem está na lista de permitidos
  if (!allowedOrigins.includes(origin)) {
    console.warn('[CSRF] Requisição rejeitada: origem não permitida', {
      origin,
      allowedOrigins,
      method: request.method,
      url: request.url
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Requisição rejeitada: origem não autorizada'
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Wrapper para handlers de API que adiciona proteção CSRF
 *
 * @example
 * ```typescript
 * export const POST = withCsrf(async (request: NextRequest) => {
 *   // Handler já está protegido
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export function withCsrf<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const csrfError = validateCsrf(request)
    if (csrfError) return csrfError

    return handler(request, ...args)
  }
}

/**
 * Headers de segurança recomendados para respostas de API
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

/**
 * Adiciona headers de segurança a uma resposta
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}
