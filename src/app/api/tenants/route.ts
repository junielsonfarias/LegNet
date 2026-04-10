/**
 * API Route: /api/tenants
 *
 * CRUD de tenants (apenas para administradores)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  listActiveTenants,
  createTenant,
  slugExists,
  domainExists,
  subdomainExists
} from '@/lib/tenant'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError, ConflictError } from '@/lib/error-handler'

// Schema de validação para criar tenant
const createTenantSchema = z.object({
  slug: z.string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  sigla: z.string().max(20).nullish().transform(v => v ?? undefined),
  cnpj: z.string().nullish().transform(v => v ?? undefined),
  dominio: z.string().nullish().transform(v => v ?? undefined),
  subdominio: z.string().nullish().transform(v => v ?? undefined),
  cidade: z.string().nullish().transform(v => v ?? undefined),
  estado: z.string().max(2).nullish().transform(v => v ?? undefined),
  logoUrl: z.string().url().nullish().transform(v => v ?? undefined),
  corPrimaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  corSecundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  plano: z.enum(['BASICO', 'PROFISSIONAL', 'ENTERPRISE']).nullish().transform(v => v ?? undefined),
})

/**
 * GET /api/tenants
 * Lista todos os tenants ativos (apenas admin)
 */
export const GET = withAuth(async (_request: NextRequest) => {
  const tenants = await listActiveTenants()
  return NextResponse.json({ tenants })
}, { roles: ['ADMIN'] })

/**
 * POST /api/tenants
 * Cria um novo tenant (apenas admin)
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Valida dados de entrada
  const validationResult = createTenantSchema.safeParse(body)

  if (!validationResult.success) {
    throw new ValidationError('Dados inválidos', validationResult.error.flatten().fieldErrors)
  }

  const data = validationResult.data

  // Verifica se slug já existe
  if (await slugExists(data.slug)) {
    throw new ConflictError('Este slug já está em uso')
  }

  // Verifica se domínio já existe
  if (data.dominio && await domainExists(data.dominio)) {
    throw new ConflictError('Este domínio já está em uso')
  }

  // Verifica se subdomínio já existe
  if (data.subdominio && await subdomainExists(data.subdominio)) {
    throw new ConflictError('Este subdomínio já está em uso')
  }

  // Cria o tenant
  const tenant = await createTenant(data)

  return createSuccessResponse(tenant, 'Tenant criado com sucesso', undefined, 201)
}, { roles: ['ADMIN'] })
