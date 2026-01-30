import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
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

const RegraSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  condicoes: z.record(z.any()).default({}),
  acoes: z.record(z.any()),
  excecoes: z.record(z.any()).optional(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0).default(0),
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

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')

  const where: any = {}

  if (ativo !== null) {
    where.ativo = ativo === 'true'
  }

  const regras = await prisma.regraTramitacao.findMany({
    where,
    include: {
      etapas: {
        orderBy: { ordem: 'asc' }
      }
    },
    orderBy: { ordem: 'asc' }
  })

  return createSuccessResponse(regras, 'Regras de tramitação carregadas com sucesso', regras.length)
}, { permissions: 'tramitacao.view' })

export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const payload = RegraSchema.parse(body)

  const etapas = payload.etapas ?? []
  await validateEtapas(etapas)

  const regra = await prisma.regraTramitacao.create({
    data: {
      nome: payload.nome,
      descricao: payload.descricao,
      condicoes: payload.condicoes,
      acoes: payload.acoes,
      excecoes: payload.excecoes ?? {},
      ativo: payload.ativo,
      ordem: payload.ordem,
      etapas: {
        create: etapas.sort((a, b) => a.ordem - b.ordem).map((etapa, index) => ({
          ordem: etapa.ordem ?? index,
          nome: etapa.nome,
          descricao: etapa.descricao,
          tipoTramitacaoId: etapa.tipoTramitacaoId,
          unidadeId: etapa.unidadeId,
          notificacoes: etapa.notificacoes,
          alertas: etapa.alertas,
          prazoDias: etapa.prazoDias
        }))
      }
    },
    include: {
      etapas: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'REGRA_TRAMITACAO_CREATE',
    entity: 'RegraTramitacao',
    entityId: regra.id,
    metadata: {
      nome: regra.nome,
      etapas: regra.etapas.length
    }
  })

  return createSuccessResponse(
    regra,
    'Regra de tramitação criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'tramitacao.manage' })
