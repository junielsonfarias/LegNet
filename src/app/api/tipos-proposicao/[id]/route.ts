/**
 * API de Tipos de Proposição - Operações por ID
 * GET, PUT, DELETE para um tipo específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema de validação para atualizar tipo de proposição
const TipoProposicaoUpdateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  sigla: z.string().min(1, 'Sigla é obrigatória').max(10, 'Sigla deve ter no máximo 10 caracteres').optional(),
  descricao: z.string().optional().nullable(),
  prazoLimite: z.number().int().min(0).optional().nullable(),
  requerVotacao: z.boolean().optional(),
  requerSancao: z.boolean().optional(),
  numeracaoAnual: z.boolean().optional(),
  prefixoNumeracao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
  corBadge: z.string().optional().nullable(),
  icone: z.string().optional().nullable()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar tipo por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    const tipo = await prisma.tipoProposicaoConfig.findUnique({
      where: { id }
    })

    if (!tipo) {
      return NextResponse.json(
        { success: false, error: 'Tipo de proposição não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tipo
    })
  } catch (error) {
    console.error('Erro ao buscar tipo de proposição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar tipo de proposição' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar tipo de proposição
export const PUT = withAuth(async (
  request: NextRequest,
  context: RouteParams
) => {
  try {
    const { id } = await context.params
    const body = await request.json()
    const validatedData = TipoProposicaoUpdateSchema.parse(body)

    // Verificar se existe
    const existente = await prisma.tipoProposicaoConfig.findUnique({
      where: { id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Tipo de proposição não encontrado' },
        { status: 404 }
      )
    }

    const tipo = await prisma.tipoProposicaoConfig.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: tipo,
      message: 'Tipo de proposição atualizado com sucesso'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar tipo de proposição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar tipo de proposição' },
      { status: 500 }
    )
  }
}, { permissions: 'config.manage' })

// DELETE - Excluir tipo de proposição
export const DELETE = withAuth(async (
  request: NextRequest,
  context: RouteParams
) => {
  try {
    const { id } = await context.params

    // Verificar se existe
    const existente = await prisma.tipoProposicaoConfig.findUnique({
      where: { id }
    })

    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Tipo de proposição não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há proposições usando este tipo
    const proposicoesCount = await prisma.proposicao.count({
      where: { tipo: existente.codigo }
    })

    if (proposicoesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Não é possível excluir. Existem ${proposicoesCount} proposição(ões) usando este tipo.`,
          details: { proposicoesCount }
        },
        { status: 400 }
      )
    }

    await prisma.tipoProposicaoConfig.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Tipo de proposição excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir tipo de proposição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir tipo de proposição' },
      { status: 500 }
    )
  }
}, { permissions: 'config.manage' })
