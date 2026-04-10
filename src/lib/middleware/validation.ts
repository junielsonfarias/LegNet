import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateData, validateQuery, validateParams } from '../validation/schemas'
import { apiLogger } from '@/lib/logging/logger'

// Tipos para middleware
export interface ValidationOptions {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
}

export interface ApiError {
  success: false
  message: string
  errors?: string[]
  code?: string
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// Middleware de validação
export function withValidation(options: ValidationOptions) {
  return function validationMiddleware(
    handler: (
      request: NextRequest,
      context: {
        validatedBody?: any
        validatedQuery?: any
        validatedParams?: any
      }
    ) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, routeParams?: any) => {
      try {
        const context: any = {}

        // Validar body se fornecido
        if (options.body) {
          const body = await request.json().catch(() => ({}))
          const validation = validateData(options.body, body)
          
          if (!validation.success) {
            return createErrorResponse(
              'Dados inválidos',
              400,
              'VALIDATION_ERROR',
              validation.errors
            )
          }
          
          context.validatedBody = validation.data
        }

        // Validar query parameters se fornecido
        if (options.query) {
          const url = new URL(request.url)
          const queryParams = Object.fromEntries(url.searchParams.entries())
          const validation = validateQuery(options.query, queryParams)
          
          if (!validation.success) {
            return createErrorResponse(
              'Parâmetros de consulta inválidos',
              400,
              'QUERY_VALIDATION_ERROR',
              validation.errors
            )
          }
          
          context.validatedQuery = validation.data
        }

        // Validar parâmetros de rota se fornecido
        if (options.params && routeParams) {
          const validation = validateParams(options.params, routeParams)
          
          if (!validation.success) {
            return createErrorResponse(
              'Parâmetros de rota inválidos',
              400,
              'PARAMS_VALIDATION_ERROR',
              validation.errors
            )
          }
          
          context.validatedParams = validation.data
        }

        // Executar handler com dados validados
        return await handler(request, context)
      } catch (error) {
        apiLogger.error('Erro no middleware de validacao', error)
        return createErrorResponse(
          'Erro interno do servidor',
          500,
          'INTERNAL_SERVER_ERROR'
        )
      }
    }
  }
}

// Função para criar resposta de erro
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string,
  errors?: string[]
): NextResponse {
  const response: ApiError = {
    success: false,
    message,
    code,
    errors
  }

  return NextResponse.json(response, { status })
}

// Função para criar resposta de sucesso
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: ApiSuccess<T>['meta']
): NextResponse {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    message,
    meta
  }

  return NextResponse.json(response)
}

// Middleware para tratamento de erros
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request)
    } catch (error) {
      apiLogger.error('Erro na API', error)
      
      if (error instanceof Error) {
        // Erro de validação conhecido
        if (error.name === 'ValidationError') {
          return createErrorResponse(
            'Dados inválidos',
            400,
            'VALIDATION_ERROR',
            [error.message]
          )
        }
        
        // Erro de não encontrado
        if (error.message.includes('não encontrado') || error.message.includes('not found')) {
          return createErrorResponse(
            error.message,
            404,
            'NOT_FOUND'
          )
        }
        
        // Erro de conflito
        if (error.message.includes('já existe') || error.message.includes('already exists')) {
          return createErrorResponse(
            error.message,
            409,
            'CONFLICT'
          )
        }
        
        // Erro de permissão
        if (error.message.includes('permissão') || error.message.includes('unauthorized')) {
          return createErrorResponse(
            'Acesso negado',
            403,
            'FORBIDDEN'
          )
        }
      }
      
      // Erro genérico
      return createErrorResponse(
        'Erro interno do servidor',
        500,
        'INTERNAL_SERVER_ERROR'
      )
    }
  }
}

// Middleware para logging
export function withLogging(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const start = Date.now()
    const method = request.method
    const url = request.url
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'Unknown'

    try {
      const response = await handler(request)
      const duration = Date.now() - start
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      apiLogger.error(`${method} ${url} - ERROR`, error, { duration, method, path: url })
      throw error
    }
  }
}

// Middleware para rate limiting (simples)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
) {
  return function rateLimitMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      
      const now = Date.now()
      const key = `${ip}:${request.url}`
      
      const current = rateLimitMap.get(key)
      
      if (!current || now > current.resetTime) {
        // Reset ou primeira requisição
        rateLimitMap.set(key, {
          count: 1,
          resetTime: now + windowMs
        })
      } else {
        // Incrementar contador
        current.count++
        
        if (current.count > maxRequests) {
          return createErrorResponse(
            'Muitas requisições. Tente novamente mais tarde.',
            429,
            'RATE_LIMIT_EXCEEDED'
          )
        }
        
        rateLimitMap.set(key, current)
      }
      
      return await handler(request)
    }
  }
}

// Middleware para CORS
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const response = await handler(request)
    
    // Adicionar headers CORS - restringir ao domínio configurado
    const allowedOrigins = [
      process.env.NEXTAUTH_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      'http://localhost:3000',
    ].filter(Boolean) as string[]
    const origin = request.headers.get('origin') || ''
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || ''
    if (!corsOrigin) {
      // Rejeitar requisição se nenhuma origem permitida configurada
      response.headers.delete('Access-Control-Allow-Origin')
      return response
    }
    response.headers.set('Access-Control-Allow-Origin', corsOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }
}

// Middleware para cache
export function withCache(
  maxAge: number = 300, // 5 minutos
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const response = await handler(request)
    
    // Adicionar headers de cache apenas para GET
    if (request.method === 'GET') {
      response.headers.set('Cache-Control', `public, max-age=${maxAge}`)
      response.headers.set('ETag', `"${Date.now()}"`)
    }
    
    return response
  }
}

// Função utilitária para combinar middlewares
export function combineMiddlewares(...middlewares: Array<(handler: any) => any>) {
  return function combinedMiddleware(handler: any) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Middleware padrão para APIs
export const defaultApiMiddleware = combineMiddlewares(
  withCors,
  withLogging,
  withErrorHandling,
  withRateLimit(100, 15 * 60 * 1000) // 100 req/15min
)

// Middleware para APIs públicas (sem rate limiting)
export const publicApiMiddleware = combineMiddlewares(
  withCors,
  withLogging,
  withErrorHandling
)

// Middleware para APIs administrativas (rate limiting mais restritivo)
export const adminApiMiddleware = combineMiddlewares(
  withCors,
  withLogging,
  withErrorHandling,
  withRateLimit(50, 15 * 60 * 1000) // 50 req/15min
)
