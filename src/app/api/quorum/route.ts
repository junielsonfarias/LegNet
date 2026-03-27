import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  listarConfiguracoesQuorumFiltrado,
  checkConfiguracaoQuorumExistente,
  criarConfiguracaoQuorum
} from '@/lib/services/quorum-service'

export const dynamic = 'force-dynamic'

const TiposQuorum = [
  'MAIORIA_SIMPLES',
  'MAIORIA_ABSOLUTA',
  'DOIS_TERCOS',
  'TRES_QUINTOS',
  'UNANIMIDADE'
] as const

const AplicacoesQuorum = [
  'INSTALACAO_SESSAO',
  'VOTACAO_SIMPLES',
  'VOTACAO_ABSOLUTA',
  'VOTACAO_QUALIFICADA',
  'VOTACAO_URGENCIA',
  'VOTACAO_COMISSAO',
  'DERRUBADA_VETO'
] as const

const CreateQuorumSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  aplicacao: z.enum(AplicacoesQuorum),
  tipoQuorum: z.enum(TiposQuorum).default('MAIORIA_SIMPLES'),
  percentualMinimo: z.number().min(0).max(100).optional(),
  numeroMinimo: z.number().int().min(1).optional(),
  baseCalculo: z.enum(['PRESENTES', 'TOTAL_MEMBROS', 'TOTAL_MANDATOS']).default('PRESENTES'),
  tiposProposicao: z.array(z.string()).optional(),
  permitirAbstencao: z.boolean().default(true),
  abstencaoContaContra: z.boolean().default(false),
  requererVotacaoNominal: z.boolean().default(false),
  mensagemAprovacao: z.string().optional(),
  mensagemRejeicao: z.string().optional(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().default(0)
})

// GET - Listar configuracoes de quorum
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')
  const aplicacao = searchParams.get('aplicacao')

  const filters: { ativo?: boolean; aplicacao?: string } = {}

  if (ativo !== null) {
    filters.ativo = ativo === 'true'
  }

  if (aplicacao) {
    filters.aplicacao = aplicacao
  }

  const configuracoes = await listarConfiguracoesQuorumFiltrado(filters)

  return createSuccessResponse(configuracoes, 'Configuracoes de quorum listadas com sucesso')
})

// POST - Criar nova configuracao de quorum
// SEGURANÇA: Requer autenticação e permissão de configuração
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateQuorumSchema.parse(body)

  // Verificar se ja existe uma configuracao para esta aplicacao
  const existente = await checkConfiguracaoQuorumExistente(validatedData.aplicacao)

  if (existente) {
    throw new ValidationError(
      `Ja existe uma configuracao de quorum para ${validatedData.aplicacao}. Use PUT para atualizar.`
    )
  }

  // Criar a configuracao
  const configuracao = await criarConfiguracaoQuorum({
    nome: validatedData.nome,
    descricao: validatedData.descricao,
    aplicacao: validatedData.aplicacao,
    tipoQuorum: validatedData.tipoQuorum,
    percentualMinimo: validatedData.percentualMinimo,
    numeroMinimo: validatedData.numeroMinimo,
    baseCalculo: validatedData.baseCalculo,
    tiposProposicao: validatedData.tiposProposicao
      ? JSON.stringify(validatedData.tiposProposicao)
      : null,
    permitirAbstencao: validatedData.permitirAbstencao,
    abstencaoContaContra: validatedData.abstencaoContaContra,
    requererVotacaoNominal: validatedData.requererVotacaoNominal,
    mensagemAprovacao: validatedData.mensagemAprovacao,
    mensagemRejeicao: validatedData.mensagemRejeicao,
    ativo: validatedData.ativo,
    ordem: validatedData.ordem
  })

  return createSuccessResponse(configuracao, 'Configuracao de quorum criada com sucesso')
}, { permissions: 'config.manage' })
