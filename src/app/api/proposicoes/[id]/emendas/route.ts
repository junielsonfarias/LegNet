import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  criarEmenda,
  listarEmendasProposicao,
  getEstatisticasEmendas,
  verificarPrazoEmendas,
  gerarTextoConsolidado
} from '@/lib/services/emenda-service'

export const dynamic = 'force-dynamic'

const CriarEmendaSchema = z.object({
  autorId: z.string().min(1, 'Autor é obrigatório'),
  coautores: z.array(z.string()).optional(),
  tipo: z.enum(['ADITIVA', 'MODIFICATIVA', 'SUPRESSIVA', 'SUBSTITUTIVA', 'EMENDA_DE_REDACAO', 'AGLUTINATIVA']),
  artigo: z.string().optional(),
  paragrafo: z.string().optional(),
  inciso: z.string().optional(),
  alinea: z.string().optional(),
  dispositivo: z.string().optional(),
  textoOriginal: z.string().optional(),
  textoNovo: z.string().min(1, 'Texto novo é obrigatório'),
  justificativa: z.string().min(1, 'Justificativa é obrigatória'),
  turnoApresentacao: z.number().optional(),
  prazoEmenda: z.string().datetime().transform(val => new Date(val)).optional()
})

/**
 * GET - Listar emendas da proposição ou buscar informações
 * SEGURANÇA: Requer autenticação
 */
export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const proposicaoId = validateId(rawId, 'Proposição')
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')

  // Estatísticas
  if (acao === 'estatisticas') {
    const stats = await getEstatisticasEmendas(proposicaoId)
    return createSuccessResponse(stats, 'Estatísticas de emendas')
  }

  // Verificar prazo
  if (acao === 'prazo') {
    const prazo = await verificarPrazoEmendas(proposicaoId)
    return createSuccessResponse(prazo, 'Prazo de emendas')
  }

  // Texto consolidado
  if (acao === 'texto-consolidado') {
    const texto = await gerarTextoConsolidado(proposicaoId)
    return createSuccessResponse(texto, 'Texto consolidado')
  }

  // Listar emendas
  const turno = searchParams.get('turno')
  const emendas = await listarEmendasProposicao(
    proposicaoId,
    turno ? parseInt(turno) : undefined
  )

  return createSuccessResponse(emendas, 'Emendas da proposição')
}, { permissions: 'proposicao.view' })

/**
 * POST - Criar nova emenda
 * SEGURANÇA: Requer autenticação e permissão de gestão
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const proposicaoId = validateId(rawId, 'Proposição')

  // Verificar prazo
  const prazo = await verificarPrazoEmendas(proposicaoId)
  if (prazo.prazoDeterminado && prazo.prazoVencido) {
    throw new ValidationError('Prazo para apresentação de emendas encerrado')
  }

  const body = await request.json()
  const validatedData = CriarEmendaSchema.parse(body)

  const emenda = await criarEmenda({
    ...validatedData,
    proposicaoId
  })

  return createSuccessResponse(emenda, 'Emenda criada com sucesso')
}, { permissions: 'proposicao.manage' })
