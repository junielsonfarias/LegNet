import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  criarProtocolo,
  listarProtocolos,
  getEstatisticasProtocolo,
  listarProtocolosPendentes,
  listarProtocolosVencidos
} from '@/lib/services/protocolo-service'

export const dynamic = 'force-dynamic'

const CriarProtocoloSchema = z.object({
  tipo: z.enum(['ENTRADA', 'SAIDA', 'INTERNO']),
  nomeRemetente: z.string().min(2, 'Nome do remetente é obrigatório'),
  cpfCnpjRemetente: z.string().nullish().transform(v => v ?? undefined),
  tipoRemetente: z.enum(['PESSOA_FISICA', 'PESSOA_JURIDICA', 'ORGAO_PUBLICO', 'PARLAMENTAR', 'EXECUTIVO']).nullish().transform(v => v ?? undefined),
  enderecoRemetente: z.string().nullish().transform(v => v ?? undefined),
  telefoneRemetente: z.string().nullish().transform(v => v ?? undefined),
  emailRemetente: z.string().email().nullish().or(z.literal('')),
  assunto: z.string().min(5, 'Assunto é obrigatório'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  tipoDocumento: z.string().nullish().transform(v => v ?? undefined),
  numeroDocOrigem: z.string().nullish().transform(v => v ?? undefined),
  prazoResposta: z.string().datetime().nullish().transform(v => v ?? undefined),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).nullish().transform(v => v ?? undefined),
  sigiloso: z.boolean().nullish().transform(v => v ?? undefined)
})

const FiltrosSchema = z.object({
  tipo: z.enum(['ENTRADA', 'SAIDA', 'INTERNO']).nullish().transform(v => v ?? undefined),
  situacao: z.enum(['ABERTO', 'EM_TRAMITACAO', 'RESPONDIDO', 'ARQUIVADO', 'DEVOLVIDO', 'CANCELADO']).nullish().transform(v => v ?? undefined),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).nullish().transform(v => v ?? undefined),
  ano: z.coerce.number().optional(),
  dataInicio: z.string().datetime().nullish().transform(v => v ?? undefined),
  dataFim: z.string().datetime().nullish().transform(v => v ?? undefined),
  busca: z.string().nullish().transform(v => v ?? undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

/**
 * GET - Listar protocolos com filtros ou buscar estatísticas
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')

  // Estatísticas
  if (acao === 'estatisticas') {
    const ano = searchParams.get('ano')
    const stats = await getEstatisticasProtocolo(ano ? parseInt(ano) : undefined)
    return createSuccessResponse(stats, 'Estatísticas de protocolo')
  }

  // Pendentes
  if (acao === 'pendentes') {
    const pendentes = await listarProtocolosPendentes()
    return createSuccessResponse(pendentes, 'Protocolos pendentes')
  }

  // Vencidos
  if (acao === 'vencidos') {
    const vencidos = await listarProtocolosVencidos()
    return createSuccessResponse(vencidos, 'Protocolos vencidos')
  }

  // Listar com filtros
  const filtrosRaw: Record<string, string | undefined> = {}
  searchParams.forEach((value, key) => {
    filtrosRaw[key] = value
  })

  const filtros = FiltrosSchema.parse(filtrosRaw)

  const resultado = await listarProtocolos(
    {
      tipo: filtros.tipo,
      situacao: filtros.situacao,
      prioridade: filtros.prioridade,
      ano: filtros.ano,
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
      busca: filtros.busca
    },
    filtros.page,
    filtros.limit
  )

  return createSuccessResponse(resultado, 'Protocolos listados')
})

/**
 * POST - Criar novo protocolo
 * SEGURANÇA: Requer autenticação e permissão de protocolo
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CriarProtocoloSchema.parse(body)

  const resultado = await criarProtocolo({
    ...validatedData,
    prazoResposta: validatedData.prazoResposta ? new Date(validatedData.prazoResposta) : undefined,
    emailRemetente: validatedData.emailRemetente || undefined
  })

  return createSuccessResponse(resultado, 'Protocolo criado com sucesso')
}, { permissions: 'protocolo.manage' })
