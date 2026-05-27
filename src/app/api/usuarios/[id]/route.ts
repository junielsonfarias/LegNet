import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { usuarioDbService } from '@/lib/services/usuario-db-service'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/admin/usuarios-detalhe')

export const dynamic = 'force-dynamic'

const UpdateUsuarioSchema = z.object({
  name: z.string().nullish().transform(v => v ?? undefined),
  email: z.string().email('Email inválido').nullish().transform(v => v ?? undefined),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').nullish().transform(v => v ?? undefined),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA', 'AUXILIAR_LEGISLATIVO']).nullish().transform(v => v ?? undefined),
  parlamentarId: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().nullish().transform(v => v ?? undefined)
})

// GET - Buscar usuário por ID
export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Usuário')

  const usuario = await usuarioDbService.getById(id)
  if (!usuario) {
    throw new NotFoundError('Usuário')
  }

  return createSuccessResponse(usuario, 'Usuário encontrado com sucesso')
}, { permissions: 'user.manage' })

// PUT - Atualizar usuário
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Usuário')
  const body = await request.json()

  const validatedData = UpdateUsuarioSchema.parse(body)

  const existing = await usuarioDbService.getById(id)
  if (!existing) {
    throw new NotFoundError('Usuário')
  }

  // Verificar se email já está em uso por outro usuário
  if (validatedData.email && validatedData.email !== existing.email) {
    const emailEmUso = await usuarioDbService.checkEmailExists(validatedData.email, id)
    if (emailEmUso) {
      log.warn('Atualização de usuário bloqueada: email duplicado', {
        action: 'usuario_update_validation_failed',
        id,
        motivo: 'email_duplicado'
      })
      throw new ValidationError('Email já está em uso por outro usuário')
    }
  }

  // Verificar se parlamentar já tem usuário vinculado
  if (validatedData.role === 'PARLAMENTAR' && validatedData.parlamentarId) {
    const parlamentarVinculado = await usuarioDbService.checkParlamentarVinculado(validatedData.parlamentarId, id)
    if (parlamentarVinculado) {
      log.warn('Atualização de usuário bloqueada: parlamentar já vinculado', {
        action: 'usuario_update_validation_failed',
        id,
        motivo: 'parlamentar_ja_vinculado',
        parlamentarId: validatedData.parlamentarId
      })
      throw new ValidationError('Este parlamentar já possui um usuário vinculado')
    }
  }

  const usuarioAtualizado = await usuarioDbService.update(id, validatedData)

  log.info('Usuário atualizado', {
    action: 'usuario_update',
    id,
    role: usuarioAtualizado.role,
    ativo: usuarioAtualizado.ativo,
    senhaAlterada: !!validatedData.password
  })

  return createSuccessResponse(usuarioAtualizado, 'Usuário atualizado com sucesso')
}, { permissions: 'user.manage' })

// DELETE - Excluir usuário
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Usuário')

  const existing = await usuarioDbService.getById(id)
  if (!existing) {
    throw new NotFoundError('Usuário')
  }

  await usuarioDbService.remove(id)

  log.info('Usuário excluído', {
    action: 'usuario_delete',
    id,
    role: existing.role
  })

  return createSuccessResponse(null, 'Usuário excluído com sucesso')
}, { permissions: 'user.manage' })
