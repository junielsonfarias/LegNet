/**
 * API Route: /api/tenants
 *
 * CRUD de tenants (apenas para administradores)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  listActiveTenants,
  createTenant,
  slugExists,
  domainExists,
  subdomainExists
} from '@/lib/tenant'
import { z } from 'zod'

// Schema de validação para criar tenant
const createTenantSchema = z.object({
  slug: z.string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  sigla: z.string().max(20).optional(),
  cnpj: z.string().optional(),
  dominio: z.string().optional(),
  subdominio: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  logoUrl: z.string().url().optional(),
  corPrimaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  corSecundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  plano: z.enum(['BASICO', 'PROFISSIONAL', 'ENTERPRISE']).optional(),
})

/**
 * GET /api/tenants
 * Lista todos os tenants ativos (apenas admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Apenas ADMIN pode listar tenants
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const tenants = await listActiveTenants()

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Erro ao listar tenants:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenants
 * Cria um novo tenant (apenas admin)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Apenas ADMIN pode criar tenants
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Valida dados de entrada
    const validationResult = createTenantSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verifica se slug já existe
    if (await slugExists(data.slug)) {
      return NextResponse.json(
        { error: 'Este slug já está em uso' },
        { status: 409 }
      )
    }

    // Verifica se domínio já existe
    if (data.dominio && await domainExists(data.dominio)) {
      return NextResponse.json(
        { error: 'Este domínio já está em uso' },
        { status: 409 }
      )
    }

    // Verifica se subdomínio já existe
    if (data.subdominio && await subdomainExists(data.subdominio)) {
      return NextResponse.json(
        { error: 'Este subdomínio já está em uso' },
        { status: 409 }
      )
    }

    // Cria o tenant
    const tenant = await createTenant(data)

    return NextResponse.json(
      { tenant, message: 'Tenant criado com sucesso' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
