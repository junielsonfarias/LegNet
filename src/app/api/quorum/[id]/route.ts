import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  validateId
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const TiposQuorum = [
  'MAIORIA_SIMPLES',
  'MAIORIA_ABSOLUTA',
  'DOIS_TERCOS',
  'TRES_QUINTOS',
  'UNANIMIDADE'
] as const

const UpdateQuorumSchema = z.object({
  nome: z.string().min(3).optional(),
  descricao: z.string().optional(),
  tipoQuorum: z.enum(TiposQuorum).optional(),
  percentualMinimo: z.number().min(0).max(100).optional().nullable(),
  numeroMinimo: z.number().int().min(1).optional().nullable(),
  baseCalculo: z.enum(['PRESENTES', 'TOTAL_MEMBROS', 'TOTAL_MANDATOS']).optional(),
  tiposProposicao: z.array(z.string()).optional().nullable(),
  permitirAbstencao: z.boolean().optional(),
  abstencaoContaContra: z.boolean().optional(),
  requererVotacaoNominal: z.boolean().optional(),
  mensagemAprovacao: z.string().optional().nullable(),
  mensagemRejeicao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional()
})

// GET - Obter configuracao por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Configuracao de Quorum')

  const configuracao = await prisma.configuracaoQuorum.findUnique({
    where: { id }
  })

  if (!configuracao) {
    throw new NotFoundError('Configuracao de Quorum')
  }

  return createSuccessResponse(configuracao, 'Configuracao de quorum obtida com sucesso')
})

// PUT - Atualizar configuracao
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Configuracao de Quorum')
  const body = await request.json()
  const validatedData = UpdateQuorumSchema.parse(body)

  const existente = await prisma.configuracaoQuorum.findUnique({
    where: { id }
  })

  if (!existente) {
    throw new NotFoundError('Configuracao de Quorum')
  }

  // Preparar dados para atualizacao
  const updateData: any = {}

  if (validatedData.nome !== undefined) updateData.nome = validatedData.nome
  if (validatedData.descricao !== undefined) updateData.descricao = validatedData.descricao
  if (validatedData.tipoQuorum !== undefined) updateData.tipoQuorum = validatedData.tipoQuorum
  if (validatedData.percentualMinimo !== undefined) updateData.percentualMinimo = validatedData.percentualMinimo
  if (validatedData.numeroMinimo !== undefined) updateData.numeroMinimo = validatedData.numeroMinimo
  if (validatedData.baseCalculo !== undefined) updateData.baseCalculo = validatedData.baseCalculo
  if (validatedData.tiposProposicao !== undefined) {
    updateData.tiposProposicao = validatedData.tiposProposicao
      ? JSON.stringify(validatedData.tiposProposicao)
      : null
  }
  if (validatedData.permitirAbstencao !== undefined) updateData.permitirAbstencao = validatedData.permitirAbstencao
  if (validatedData.abstencaoContaContra !== undefined) updateData.abstencaoContaContra = validatedData.abstencaoContaContra
  if (validatedData.requererVotacaoNominal !== undefined) updateData.requererVotacaoNominal = validatedData.requererVotacaoNominal
  if (validatedData.mensagemAprovacao !== undefined) updateData.mensagemAprovacao = validatedData.mensagemAprovacao
  if (validatedData.mensagemRejeicao !== undefined) updateData.mensagemRejeicao = validatedData.mensagemRejeicao
  if (validatedData.ativo !== undefined) updateData.ativo = validatedData.ativo
  if (validatedData.ordem !== undefined) updateData.ordem = validatedData.ordem

  const configuracao = await prisma.configuracaoQuorum.update({
    where: { id },
    data: updateData
  })

  return createSuccessResponse(configuracao, 'Configuracao de quorum atualizada com sucesso')
})

// DELETE - Excluir configuracao
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Configuracao de Quorum')

  const configuracao = await prisma.configuracaoQuorum.findUnique({
    where: { id }
  })

  if (!configuracao) {
    throw new NotFoundError('Configuracao de Quorum')
  }

  await prisma.configuracaoQuorum.delete({
    where: { id }
  })

  return createSuccessResponse(null, 'Configuracao de quorum excluida com sucesso')
})
