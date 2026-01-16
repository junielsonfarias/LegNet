import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logAuditError } from '@/lib/audit'
import { authOptions } from '@/lib/auth'

export interface ApiError {
  success: false
  error: string
  details?: any
  timestamp: string
  path?: string
  data?: never // For type compatibility
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
  message?: string
  total?: number
  error?: string // For type compatibility in error handling
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// Tipos de erro personalizados

// Erro base com código de status HTTP
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} não encontrado`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Não autorizado') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Acesso negado') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Muitas requisições. Tente novamente mais tarde.') {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Função para criar resposta de erro
export function createErrorResponse(
  error: unknown,
  path?: string
): NextResponse<ApiError> {
  const timestamp = new Date().toISOString()
  
  // Erro de validação Zod
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
        timestamp,
        path
      },
      { status: 400 }
    )
  }
  
  // Erro de validação customizado
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.details,
        timestamp,
        path
      },
      { status: 400 }
    )
  }
  
  // Erro de não encontrado
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp,
        path
      },
      { status: 404 }
    )
  }
  
  // Erro de conflito
  if (error instanceof ConflictError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp,
        path
      },
      { status: 409 }
    )
  }
  
  // Erro de não autorizado
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp,
        path
      },
      { status: 401 }
    )
  }

  // Erro de acesso negado
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp,
        path
      },
      { status: 403 }
    )
  }

  // Erro de rate limit
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp,
        path
      },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // Erro de aplicação genérico com status code customizado
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(error.code && { code: error.code }),
        ...(error.details && { details: error.details }),
        timestamp,
        path
      },
      { status: error.statusCode }
    )
  }

  // Erro genérico
  const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor'
  const errorStack = error instanceof Error ? error.stack : undefined
  
  console.error('Erro não tratado:', {
    message: errorMessage,
    stack: errorStack,
    error,
    path
  })
  
  // Em desenvolvimento, retornar mais detalhes
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return NextResponse.json(
    {
      success: false,
      error: isDevelopment ? errorMessage : 'Erro interno do servidor',
      ...(isDevelopment && errorStack && { details: errorStack }),
      timestamp,
      path
    },
    { status: 500 }
  )
}

// Função para criar resposta de sucesso
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  total?: number,
  status: number = 200,
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
): NextResponse<ApiSuccess<T>> {
  const response: ApiSuccess<T> = {
    success: true,
    data
  }
  
  if (message) {
    response.message = message
  }
  
  if (total !== undefined) {
    response.total = total
  }
  
  if (meta) {
    response.meta = meta
  }
  
  return NextResponse.json(response, { status })
}

// Wrapper para handlers de API
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      try {
        const request = args[0] as NextRequest | Request
        const url = request ? new URL(request.url) : null
        const path = url?.pathname || 'unknown'

        let session: any = null

        if (process.env.NODE_ENV !== 'test') {
          try {
            const { getServerSession } = await import('next-auth')
            session = await getServerSession(authOptions)
          } catch (sessionError) {
            console.error('Erro ao obter sessão para auditoria de falha:', sessionError)
          }
        }

        try {
          await logAuditError({
            request,
            session,
            entity: path,
            error,
            metadata: {
              method: request?.method,
              searchParams: url ? Object.fromEntries(url.searchParams.entries()) : undefined
            }
          })
        } catch (auditError) {
          console.error('Erro ao registrar auditoria de falha:', auditError)
        }

        return createErrorResponse(error, path)
      } catch (err) {
        // Fallback se não conseguir extrair o path
        console.error('Erro ao processar erro:', err)
        return createErrorResponse(error, 'unknown')
      }
    }
  }
}

// Função para validar ID
export function validateId(id: string | undefined, resource: string = 'Recurso'): string {
  if (!id) {
    throw new ValidationError(`ID do ${resource.toLowerCase()} é obrigatório`)
  }
  
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new ValidationError(`ID do ${resource.toLowerCase()} deve ser uma string válida`)
  }
  
  return id.trim()
}

// Função para sanitizar entrada
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

// Função para validar email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para validar telefone brasileiro
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}
