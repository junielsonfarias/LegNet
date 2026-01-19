/**
 * API Route: /api/tenants/[id]
 *
 * Operações em um tenant específico (apenas admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  findTenantById,
  updateTenant,
  deactivateTenant,
  slugExists,
  domainExists,
  subdomainExists
} from '@/lib/tenant'
import { z } from 'zod'

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
  sigla: z.string().max(20).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  dominio: z.string().optional().nullable(),
  subdominio: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().max(2).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  corPrimaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  corSecundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  plano: z.enum(['BASICO', 'PROFISSIONAL', 'ENTERPRISE']).optional(),
  ativo: z.boolean().optional(),
})

/**
 * GET /api/tenants/[id]
 * Busca um tenant específico (apenas admin)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params
    const tenant = await findTenantById(id)

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tenant })
  } catch (error) {
    console.error('Erro ao buscar tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tenants/[id]
 * Atualiza um tenant (apenas admin)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verifica se tenant existe
    const existingTenant = await findTenantById(id)

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      )
    }

    // Valida dados de entrada
    const validationResult = updateTenantSchema.safeParse(body)

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

    // Verifica se domínio já existe (excluindo o tenant atual)
    if (data.dominio && await domainExists(data.dominio, id)) {
      return NextResponse.json(
        { error: 'Este domínio já está em uso por outro tenant' },
        { status: 409 }
      )
    }

    // Verifica se subdomínio já existe (excluindo o tenant atual)
    if (data.subdominio && await subdomainExists(data.subdominio, id)) {
      return NextResponse.json(
        { error: 'Este subdomínio já está em uso por outro tenant' },
        { status: 409 }
      )
    }

    // Atualiza o tenant
    const tenant = await updateTenant(id, data)

    if (!tenant) {
      return NextResponse.json(
        { error: 'Erro ao atualizar tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tenant, message: 'Tenant atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tenants/[id]
 * Desativa um tenant (soft delete, apenas admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verifica se tenant existe
    const existingTenant = await findTenantById(id)

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      )
    }

    // Não permite desativar tenant padrão
    if (existingTenant.slug === 'default') {
      return NextResponse.json(
        { error: 'Não é possível desativar o tenant padrão' },
        { status: 400 }
      )
    }

    // Desativa o tenant (soft delete)
    const success = await deactivateTenant(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao desativar tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Tenant desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
