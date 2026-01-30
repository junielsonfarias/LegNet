import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const RegraEtapaSchema = z.object({
  id: z.string().optional(),
  ordem: z.number().int().min(0).default(0),
  nome: z.string().min(1, 'Nome da etapa é obrigatório'),
  descricao: z.string().optional(),
  tipoTramitacaoId: z.string().optional(),
  unidadeId: z.string().optional(),
  notificacoes: z.any().optional(),
  alertas: z.any().optional(),
  prazoDias: z.number().int().nullable().optional()
})

const UpdateRegraSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  condicoes: z.record(z.any()).optional(),
  acoes: z.record(z.any()).optional(),
  excecoes: z.record(z.any()).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().min(0).optional(),
  etapas: z.array(RegraEtapaSchema).optional()
})

const validateEtapas = async (etapas: z.infer<typeof RegraEtapaSchema>[]) => {
  for (const etapa of etapas) {
    if (etapa.tipoTramitacaoId) {
      const tipo = await prisma.tramitacaoTipo.findUnique({
        where: { id: etapa.tipoTramitacaoId }
      })
      if (!tipo) {
        throw new ValidationError(`Tipo de tramitação não encontrado para a etapa ${etapa.nome}`)
      }
    }

    if (etapa.unidadeId) {
      const unidade = await prisma.tramitacaoUnidade.findUnique({
        where: { id: etapa.unidadeId }
      })
      if (!unidade) {
        throw new ValidationError(`Unidade responsável não encontrada para a etapa ${etapa.nome}`)
      }
    }
  }
}

export const GET = withAuth(async (_request: NextRequest, { params }) => {
  const { id } = await params

  const regra = await prisma.regraTramitacao.findUnique({
    where: { id },
    include: {
      etapas: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  if (!regra) {
    throw new NotFoundError('Regra de tramitação')
  }

  return createSuccessResponse(regra, 'Regra de tramitação encontrada')
}, { permissions: 'tramitacao.view' })

export const PUT = withAuth(async (request: NextRequest, { params }, session) => {
  const { id } = await params
  const body = await request.json()
  const payload = UpdateRegraSchema.parse(body)

  const regraAtual = await prisma.regraTramitacao.findUnique({
    where: { id }
  })

  if (!regraAtual) {
    throw new NotFoundError('Regra de tramitação')
  }

  const etapas = payload.etapas
  if (etapas) {
    await validateEtapas(etapas)
  }

  // Preparar dados para atualização
  const updateData: any = {}
  if (payload.nome !== undefined) updateData.nome = payload.nome
  if (payload.descricao !== undefined) updateData.descricao = payload.descricao
  if (payload.condicoes !== undefined) updateData.condicoes = payload.condicoes
  if (payload.acoes !== undefined) updateData.acoes = payload.acoes
  if (payload.excecoes !== undefined) updateData.excecoes = payload.excecoes
  if (payload.ativo !== undefined) updateData.ativo = payload.ativo
  if (payload.ordem !== undefined) updateData.ordem = payload.ordem

  // Usar transação para atualizar regra e etapas
  const regraAtualizada = await prisma.$transaction(async (tx) => {
    // Atualizar a regra
    const regra = await tx.regraTramitacao.update({
      where: { id },
      data: updateData
    })

    // Se houver etapas, remover antigas e criar novas
    if (etapas) {
      await tx.regraTramitacaoEtapa.deleteMany({
        where: { regraId: id }
      })

      await tx.regraTramitacaoEtapa.createMany({
        data: etapas.sort((a, b) => a.ordem - b.ordem).map((etapa, index) => ({
          regraId: id,
          ordem: etapa.ordem ?? index,
          nome: etapa.nome,
          descricao: etapa.descricao,
          tipoTramitacaoId: etapa.tipoTramitacaoId,
          unidadeId: etapa.unidadeId,
          notificacoes: etapa.notificacoes,
          alertas: etapa.alertas,
          prazoDias: etapa.prazoDias
        }))
      })
    }

    // Buscar regra completa com etapas
    return tx.regraTramitacao.findUnique({
      where: { id },
      include: {
        etapas: {
          orderBy: { ordem: 'asc' }
        }
      }
    })
  })

  await logAudit({
    request,
    session,
    action: 'REGRA_TRAMITACAO_UPDATE',
    entity: 'RegraTramitacao',
    entityId: id,
    metadata: {
      nome: regraAtualizada?.nome,
      etapas: regraAtualizada?.etapas.length ?? 0
    }
  })

  return createSuccessResponse(regraAtualizada, 'Regra de tramitação atualizada com sucesso')
}, { permissions: 'tramitacao.manage' })

export const DELETE = withAuth(async (request: NextRequest, { params }, session) => {
  const { id } = await params

  const regra = await prisma.regraTramitacao.findUnique({
    where: { id }
  })

  if (!regra) {
    throw new NotFoundError('Regra de tramitação')
  }

  // A deleção em cascata já está configurada no schema Prisma
  await prisma.regraTramitacao.delete({
    where: { id }
  })

  await logAudit({
    request,
    session,
    action: 'REGRA_TRAMITACAO_DELETE',
    entity: 'RegraTramitacao',
    entityId: id,
    metadata: {
      nome: regra.nome
    }
  })

  return createSuccessResponse({ id }, 'Regra de tramitação removida com sucesso')
}, { permissions: 'tramitacao.manage' })
