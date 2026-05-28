import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { usuarioDbService } from '@/lib/services/usuario-db-service'
import { createLogger } from '@/lib/logging/logger'
import { PaginationSchema } from '@/lib/validation/query-schemas'

const log = createLogger('api/admin/usuarios')

export const dynamic = 'force-dynamic'

const CreateUsuarioSchema = z.object({
  name: z.string().nullish().transform(v => v ?? undefined),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA', 'AUXILIAR_LEGISLATIVO']),
  parlamentarId: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().default(true)
})

// Schema para query params de listagem
const ListUsuariosQuerySchema = PaginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA', 'AUXILIAR_LEGISLATIVO']).nullish().transform(v => v ?? undefined),
  ativo: z.coerce.boolean().optional(),
  search: z.string().nullish().transform(v => v ?? undefined)
})

// GET - Listar todos os usuários (REQUER ADMIN ou SECRETARIA)
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // Validar query params
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const validation = ListUsuariosQuerySchema.safeParse(params)
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Parâmetros inválidos', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { page, limit, role, ativo, search } = validation.data

  const result = await usuarioDbService.paginate(
    { role, ativo, search },
    { page, limit }
  )

  return NextResponse.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  })
}, { permissions: 'user.view' })

// POST - Criar novo usuário (REQUER ADMIN - operação sensível)
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  const validatedData = CreateUsuarioSchema.parse(body)

  // Verificar se email já existe
  const emailExists = await usuarioDbService.checkEmailExists(validatedData.email)
  if (emailExists) {
    log.warn('Criação de usuário bloqueada: email duplicado', {
      action: 'usuario_validation_failed',
      motivo: 'email_duplicado'
    })
    throw new ValidationError('Email já está em uso')
  }

  // Verificar se parlamentar já tem usuário vinculado
  if (validatedData.role === 'PARLAMENTAR' && validatedData.parlamentarId) {
    const parlamentarVinculado = await usuarioDbService.checkParlamentarVinculado(validatedData.parlamentarId)
    if (parlamentarVinculado) {
      log.warn('Criação de usuário bloqueada: parlamentar já vinculado', {
        action: 'usuario_validation_failed',
        motivo: 'parlamentar_ja_vinculado',
        parlamentarId: validatedData.parlamentarId
      })
      throw new ValidationError('Este parlamentar já possui um usuário vinculado')
    }
  }

  const novoUsuario = await usuarioDbService.create(validatedData)

  log.info('Usuário criado', {
    action: 'usuario_create',
    id: novoUsuario.id,
    role: novoUsuario.role,
    ativo: novoUsuario.ativo
  })

  return createSuccessResponse(novoUsuario, 'Usuário criado com sucesso')
}, { permissions: 'user.manage' })
