import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { z } from 'zod'
import { tiposProposicaoDbService } from '@/lib/services/tipos-proposicao-db-service'

export const dynamic = 'force-dynamic'

const APLICACOES_QUORUM = [
  'VOTACAO_SIMPLES', 'VOTACAO_ABSOLUTA', 'VOTACAO_QUALIFICADA', 'VOTACAO_URGENCIA'
] as const

const TipoProposicaoUpdateSchema = z.object({
  nome: z.string().min(3).optional(),
  sigla: z.string().min(1).max(10).optional(),
  descricao: z.string().optional().nullable(),
  prazoLimite: z.number().int().min(0).optional().nullable(),
  requerVotacao: z.boolean().optional(),
  requerSancao: z.boolean().optional(),
  numeracaoAnual: z.boolean().optional(),
  prefixoNumeracao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
  corBadge: z.string().optional().nullable(),
  icone: z.string().optional().nullable(),
  quorumAplicacao: z.enum(APLICACOES_QUORUM).optional().nullable(),
  quorumAplicacao2Turno: z.enum(APLICACOES_QUORUM).optional().nullable(),
  totalTurnos: z.number().int().min(1).max(2).optional(),
  intersticioDias: z.number().int().min(0).max(30).optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const tipo = await tiposProposicaoDbService.getById(id)
    if (!tipo) {
      return NextResponse.json({ success: false, error: 'Tipo de proposição não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: tipo })
  } catch (error) {
    console.error('Erro ao buscar tipo de proposição:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar tipo de proposição' }, { status: 500 })
  }
}

export const PUT = withAuth(async (request: NextRequest, context: RouteParams) => {
  try {
    const { id } = await context.params
    const body = await request.json()
    const validatedData = TipoProposicaoUpdateSchema.parse(body)

    const existente = await tiposProposicaoDbService.getById(id)
    if (!existente) {
      return NextResponse.json({ success: false, error: 'Tipo de proposição não encontrado' }, { status: 404 })
    }

    const tipo = await tiposProposicaoDbService.update(id, validatedData)
    return NextResponse.json({ success: true, data: tipo, message: 'Tipo de proposição atualizado com sucesso' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Erro ao atualizar tipo de proposição:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar tipo de proposição' }, { status: 500 })
  }
}, { permissions: 'config.manage' })

export const DELETE = withAuth(async (request: NextRequest, context: RouteParams) => {
  try {
    const { id } = await context.params

    const existente = await tiposProposicaoDbService.getById(id)
    if (!existente) {
      return NextResponse.json({ success: false, error: 'Tipo de proposição não encontrado' }, { status: 404 })
    }

    const proposicoesCount = await prisma.proposicao.count({ where: { tipo: existente.codigo } })
    if (proposicoesCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Não é possível excluir. Existem ${proposicoesCount} proposição(ões) usando este tipo.`,
        details: { proposicoesCount }
      }, { status: 400 })
    }

    await tiposProposicaoDbService.remove(id)
    return NextResponse.json({ success: true, message: 'Tipo de proposição excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir tipo de proposição:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir tipo de proposição' }, { status: 500 })
  }
}, { permissions: 'config.manage' })
