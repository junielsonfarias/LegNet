import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

const TramitacaoUnidadeTipoEnum = z.enum([
  'COMISSAO',
  'MESA_DIRETORA',
  'PLENARIO',
  'PREFEITURA',
  'OUTROS'
])

const UnidadeCreateSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  sigla: z.string().optional(),
  descricao: z.string().optional(),
  tipo: TramitacaoUnidadeTipoEnum,
  ativo: z.boolean().optional().default(true),
  ordem: z.number().optional().default(0)
})

const UnidadeUpdateSchema = z.object({
  id: z.string(),
  nome: z.string().min(1).optional(),
  sigla: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  tipo: TramitacaoUnidadeTipoEnum.optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().optional()
})

/**
 * GET /api/admin/configuracoes/unidades-tramitacao
 * Lista todas as unidades de tramitacao
 */
export const GET = withAuth(async (
  request: NextRequest
) => {
  const { searchParams } = new URL(request.url)
  const apenasAtivos = searchParams.get('ativo') !== 'false'
  const tipo = searchParams.get('tipo')

  const where: Record<string, unknown> = {}

  if (apenasAtivos) {
    where.ativo = true
  }

  if (tipo) {
    const parseResult = TramitacaoUnidadeTipoEnum.safeParse(tipo)
    if (parseResult.success) {
      where.tipo = parseResult.data
    }
  }

  const unidades = await prisma.tramitacaoUnidade.findMany({
    where,
    orderBy: [
      { tipo: 'asc' },
      { ordem: 'asc' },
      { nome: 'asc' }
    ]
  })

  return createSuccessResponse(unidades, 'Unidades carregadas com sucesso')
}, { permissions: 'config.view' })

/**
 * POST /api/admin/configuracoes/unidades-tramitacao
 * Cria uma nova unidade de tramitacao
 */
export const POST = withAuth(async (
  request: NextRequest,
  _context,
  session
) => {
  const body = await request.json()

  const payload = UnidadeCreateSchema.safeParse(body)
  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados invalidos')
  }

  const unidade = await prisma.tramitacaoUnidade.create({
    data: {
      nome: payload.data.nome,
      sigla: payload.data.sigla || null,
      descricao: payload.data.descricao || null,
      tipo: payload.data.tipo,
      ativo: payload.data.ativo,
      ordem: payload.data.ordem
    }
  })

  await logAudit({
    request,
    session,
    action: 'UNIDADE_TRAMITACAO_CRIADA',
    entity: 'TramitacaoUnidade',
    entityId: unidade.id,
    metadata: { nome: unidade.nome, tipo: unidade.tipo }
  })

  return createSuccessResponse(unidade, 'Unidade criada com sucesso')
}, { permissions: 'config.manage' })

/**
 * PUT /api/admin/configuracoes/unidades-tramitacao
 * Atualiza uma unidade de tramitacao existente
 */
export const PUT = withAuth(async (
  request: NextRequest,
  _context,
  session
) => {
  const body = await request.json()

  const payload = UnidadeUpdateSchema.safeParse(body)
  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados invalidos')
  }

  const { id, ...data } = payload.data

  const existente = await prisma.tramitacaoUnidade.findUnique({
    where: { id }
  })

  if (!existente) {
    throw new NotFoundError('Unidade nao encontrada')
  }

  const unidade = await prisma.tramitacaoUnidade.update({
    where: { id },
    data: {
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.sigla !== undefined && { sigla: data.sigla }),
      ...(data.descricao !== undefined && { descricao: data.descricao }),
      ...(data.tipo !== undefined && { tipo: data.tipo }),
      ...(data.ativo !== undefined && { ativo: data.ativo }),
      ...(data.ordem !== undefined && { ordem: data.ordem })
    }
  })

  await logAudit({
    request,
    session,
    action: 'UNIDADE_TRAMITACAO_ATUALIZADA',
    entity: 'TramitacaoUnidade',
    entityId: unidade.id,
    metadata: { nome: unidade.nome, alteracoes: data }
  })

  return createSuccessResponse(unidade, 'Unidade atualizada com sucesso')
}, { permissions: 'config.manage' })

/**
 * DELETE /api/admin/configuracoes/unidades-tramitacao
 * Exclui uma unidade de tramitacao
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  _context,
  session
) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('ID da unidade e obrigatorio')
  }

  const existente = await prisma.tramitacaoUnidade.findUnique({
    where: { id }
  })

  if (!existente) {
    throw new NotFoundError('Unidade nao encontrada')
  }

  // Verificar se ha tramitacoes usando esta unidade
  const tramitacoes = await prisma.tramitacao.count({
    where: { unidadeId: id }
  })

  if (tramitacoes > 0) {
    throw new ValidationError(
      `Esta unidade possui ${tramitacoes} tramitacao(oes) vinculada(s) e nao pode ser excluida`
    )
  }

  // Verificar se ha etapas de fluxo usando esta unidade
  const etapas = await prisma.fluxoTramitacaoEtapa.count({
    where: { unidadeId: id }
  })

  if (etapas > 0) {
    throw new ValidationError(
      `Esta unidade possui ${etapas} etapa(s) de fluxo vinculada(s) e nao pode ser excluida`
    )
  }

  await prisma.tramitacaoUnidade.delete({
    where: { id }
  })

  await logAudit({
    request,
    session,
    action: 'UNIDADE_TRAMITACAO_EXCLUIDA',
    entity: 'TramitacaoUnidade',
    entityId: id,
    metadata: { nome: existente.nome }
  })

  return createSuccessResponse(null, 'Unidade excluida com sucesso')
}, { permissions: 'config.manage' })
