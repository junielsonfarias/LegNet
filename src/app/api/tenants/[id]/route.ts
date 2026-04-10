/**
 * API Route: /api/tenants/[id]
 *
 * Operações em um tenant específico (apenas admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  findTenantById,
  updateTenant,
  deactivateTenant,
  domainExists,
  subdomainExists
} from '@/lib/tenant'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError, ValidationError, ConflictError, AppError } from '@/lib/error-handler'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Schema de validação para atualizar tenant
const updateTenantSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .optional(),
  sigla: z.string().max(20).nullish().transform(v => v ?? undefined),
  cnpj: z.string().nullish().transform(v => v ?? undefined),
  dominio: z.string().nullish().transform(v => v ?? undefined),
  subdominio: z.string().nullish().transform(v => v ?? undefined),
  cidade: z.string().nullish().transform(v => v ?? undefined),
  estado: z.string().max(2).nullish().transform(v => v ?? undefined),
  logoUrl: z.string().url().nullish().transform(v => v ?? undefined),
  faviconUrl: z.string().url().nullish().transform(v => v ?? undefined),
  corPrimaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  corSecundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  plano: z.enum(['BASICO', 'PROFISSIONAL', 'ENTERPRISE']).nullish().transform(v => v ?? undefined),
  ativo: z.boolean().nullish().transform(v => v ?? undefined),
})

/**
 * GET /api/tenants/[id]
 * Busca um tenant específico (apenas admin)
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  const { id } = await params
  const tenant = await findTenantById(id)

  if (!tenant) {
    throw new NotFoundError('Tenant')
  }

  return NextResponse.json({ tenant })
}, { roles: ['ADMIN'] })

/**
 * PUT /api/tenants/[id]
 * Atualiza um tenant (apenas admin)
 */
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  const { id } = await params
  const body = await request.json()

  // Verifica se tenant existe
  const existingTenant = await findTenantById(id)

  if (!existingTenant) {
    throw new NotFoundError('Tenant')
  }

  // Valida dados de entrada
  const validationResult = updateTenantSchema.safeParse(body)

  if (!validationResult.success) {
    throw new ValidationError('Dados inválidos', validationResult.error.flatten().fieldErrors)
  }

  const data = validationResult.data

  // Verifica se domínio já existe (excluindo o tenant atual)
  if (data.dominio && await domainExists(data.dominio, id)) {
    throw new ConflictError('Este domínio já está em uso por outro tenant')
  }

  // Verifica se subdomínio já existe (excluindo o tenant atual)
  if (data.subdominio && await subdomainExists(data.subdominio, id)) {
    throw new ConflictError('Este subdomínio já está em uso por outro tenant')
  }

  // Atualiza o tenant
  const tenant = await updateTenant(id, data)

  if (!tenant) {
    throw new AppError('Erro ao atualizar tenant', 500)
  }

  return createSuccessResponse(tenant, 'Tenant atualizado com sucesso')
}, { roles: ['ADMIN'] })

/**
 * DELETE /api/tenants/[id]
 * Desativa um tenant (soft delete, apenas admin)
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  const { id } = await params

  // Verifica se tenant existe
  const existingTenant = await findTenantById(id)

  if (!existingTenant) {
    throw new NotFoundError('Tenant')
  }

  // Não permite desativar tenant padrão
  if (existingTenant.slug === 'default') {
    throw new ValidationError('Não é possível desativar o tenant padrão')
  }

  // Desativa o tenant (soft delete)
  const success = await deactivateTenant(id)

  if (!success) {
    throw new AppError('Erro ao desativar tenant', 500)
  }

  return createSuccessResponse({ deactivated: true }, 'Tenant desativado com sucesso')
}, { roles: ['ADMIN'] })
