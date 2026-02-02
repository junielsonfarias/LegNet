import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  ConflictError,
  NotFoundError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { gerarSlugProposicao } from '@/lib/utils/proposicao-slug'
import { getFluxoByTipoProposicao, getEtapaInicial } from '@/lib/services/fluxo-tramitacao-service'
import { iniciarTramitacaoComFluxo, iniciarTramitacaoPadrao, iniciarTramitacaoComUnidade } from '@/lib/services/tramitacao-service'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('proposicoes-api')

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para proposição
// O campo 'tipo' aceita qualquer código de tipo cadastrado em TipoProposicaoConfig
// A validação contra tipos existentes é feita na criação/atualização
const ProposicaoSchema = z.object({
  numero: z.string().min(1, 'Número da proposição é obrigatório'),
  ano: z.number().min(1900, 'Ano deve ser válido'), // Permite anos anteriores para dados históricos
  tipo: z.string().min(1, 'Tipo da proposição é obrigatório').max(50, 'Código do tipo deve ter no máximo 50 caracteres'),
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  ementa: z.string().min(10, 'Ementa deve ter pelo menos 10 caracteres'),
  texto: z.string().optional(),
  urlDocumento: z.string().url('URL deve ser válida').optional().or(z.literal('')), // URL externa do documento
  status: z.enum(['APRESENTADA', 'EM_TRAMITACAO', 'APROVADA', 'REJEITADA', 'ARQUIVADA', 'VETADA']).default('APRESENTADA'),
  dataApresentacao: z.string().min(1, 'Data de apresentação é obrigatória'),
  dataVotacao: z.string().optional(),
  resultado: z.enum(['APROVADA', 'REJEITADA', 'EMPATE']).optional(),
  sessaoId: z.string().optional(),
  autorId: z.string().min(1, 'ID do autor é obrigatório'),
  unidadeInicialId: z.string().optional() // RN-038: Unidade inicial para tramitação (prioridade sobre fluxo)
})

// GET - Listar proposições
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')
  const autorId = searchParams.get('autorId')
  const ano = searchParams.get('ano')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // Construir filtros
  const where: any = {}
  
  if (status) {
    where.status = status
  }
  
  if (tipo) {
    where.tipo = tipo
  }
  
  if (autorId) {
    where.autorId = autorId
  }
  
  if (ano) {
    where.ano = parseInt(ano)
  }

  const [proposicoes, total] = await Promise.all([
    prisma.proposicao.findMany({
      where,
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            apelido: true,
            partido: true
          }
        },
        sessao: {
          select: {
            id: true,
            numero: true,
            data: true
          }
        }
      },
      orderBy: [
        { ano: 'desc' },
        { numero: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.proposicao.count({ where })
  ])

  return createSuccessResponse(
    proposicoes,
    'Proposições listadas com sucesso',
    total,
    200,
    {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  )
})

// POST - Criar proposição (requer autenticação e permissão)
// SEGURANÇA: Requer autenticação e permissão 'proposicao.manage'
export const POST = withAuth(async (request: NextRequest, _context, session) => {
  const body = await request.json()

  // Validar dados
  const validatedData = ProposicaoSchema.parse(body)
  
  // Verificar se já existe proposição com mesmo tipo/número/ano
  const existingProposicao = await prisma.proposicao.findUnique({
    where: {
      tipo_numero_ano: {
        tipo: validatedData.tipo,
        numero: validatedData.numero,
        ano: validatedData.ano
      }
    }
  })

  if (existingProposicao) {
    throw new ConflictError('Já existe uma proposição deste tipo com este número e ano')
  }
  
  // Verificar se o autor existe
  const autor = await prisma.parlamentar.findUnique({
    where: { id: validatedData.autorId }
  })
  
  if (!autor) {
    throw new NotFoundError('Autor')
  }

  // Gerar slug amigável
  const slug = gerarSlugProposicao(validatedData.tipo, validatedData.numero, validatedData.ano)

  const proposicao = await prisma.proposicao.create({
    data: {
      slug,
      numero: validatedData.numero,
      ano: validatedData.ano,
      tipo: validatedData.tipo,
      titulo: validatedData.titulo,
      ementa: validatedData.ementa,
      texto: validatedData.texto || null,
      urlDocumento: validatedData.urlDocumento || null,
      status: validatedData.status || 'APRESENTADA',
      dataApresentacao: new Date(validatedData.dataApresentacao),
      dataVotacao: validatedData.dataVotacao ? new Date(validatedData.dataVotacao) : null,
      resultado: validatedData.resultado || null,
      sessaoId: validatedData.sessaoId || null,
      autorId: validatedData.autorId
    },
    include: {
      autor: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    }
  })

  // Auto-iniciar tramitação ao criar proposição
  // RN-038: Prioridade: 1) Unidade escolhida pelo usuário, 2) Fluxo configurado, 3) Tramitação padrão (Secretaria Legislativa)
  let tramitacaoInfo: {
    tramitacaoId?: string
    fluxo?: string
    etapa?: string
    unidade?: string
    message: string
    warnings?: string[]
  } | null = null
  try {
    // RN-038: Se usuário especificou unidade inicial, tem prioridade sobre fluxo
    if (validatedData.unidadeInicialId) {
      const resultadoTramitacao = await iniciarTramitacaoComUnidade(
        proposicao.id,
        validatedData.unidadeInicialId,
        'NORMAL'
      )

      if (resultadoTramitacao.valid) {
        tramitacaoInfo = {
          tramitacaoId: resultadoTramitacao.tramitacaoId,
          message: 'Tramitação iniciada na unidade especificada',
          warnings: resultadoTramitacao.warnings
        }

        logger.info('Tramitação auto-iniciada com unidade específica', {
          action: 'auto_iniciar_tramitacao_unidade',
          proposicaoId: proposicao.id,
          unidadeId: validatedData.unidadeInicialId
        })
      } else {
        logger.warn('Falha ao auto-iniciar tramitação com unidade', {
          action: 'auto_iniciar_tramitacao_unidade_falha',
          proposicaoId: proposicao.id,
          errors: resultadoTramitacao.errors
        })
      }
    } else {
      // Busca fluxo configurado para o tipo de proposição
      const fluxo = await getFluxoByTipoProposicao(validatedData.tipo)

      if (fluxo) {
        // Busca etapa inicial do fluxo
        const etapaInicial = await getEtapaInicial(fluxo.id)

        if (etapaInicial) {
          // Inicia tramitação vinculada ao fluxo
          const resultadoTramitacao = await iniciarTramitacaoComFluxo(
            proposicao.id,
            fluxo.id,
            etapaInicial.id,
            'NORMAL',
            session.user.id
          )

          if (resultadoTramitacao.valid) {
            tramitacaoInfo = {
              tramitacaoId: resultadoTramitacao.tramitacaoId,
              fluxo: fluxo.nome,
              etapa: etapaInicial.nome,
              message: 'Tramitação iniciada automaticamente'
            }

            logger.info('Tramitação auto-iniciada com fluxo', {
              action: 'auto_iniciar_tramitacao',
              proposicaoId: proposicao.id,
              fluxoId: fluxo.id,
              etapaId: etapaInicial.id
            })
          } else {
            logger.warn('Falha ao auto-iniciar tramitação com fluxo', {
              action: 'auto_iniciar_tramitacao_falha',
              proposicaoId: proposicao.id,
              errors: resultadoTramitacao.errors
            })
          }
        }
      } else {
        // Sem fluxo configurado - usa tramitação padrão (Secretaria Legislativa)
        const resultadoTramitacao = await iniciarTramitacaoPadrao(proposicao.id, 'NORMAL')

        if (resultadoTramitacao.valid) {
          tramitacaoInfo = {
            tramitacaoId: resultadoTramitacao.tramitacaoId,
            message: 'Tramitação iniciada na Secretaria Legislativa (padrão)',
            warnings: resultadoTramitacao.warnings
          }

          logger.info('Tramitação auto-iniciada na Secretaria Legislativa', {
            action: 'auto_iniciar_tramitacao_padrao',
            proposicaoId: proposicao.id,
            tramitacaoId: resultadoTramitacao.tramitacaoId
          })
        }
      }
    }
  } catch (error) {
    // Não bloqueia a criação se a tramitação falhar
    logger.error('Erro ao auto-iniciar tramitação', {
      action: 'auto_iniciar_tramitacao_erro',
      proposicaoId: proposicao.id,
      error
    })
  }

  return createSuccessResponse(
    {
      ...proposicao,
      tramitacao: tramitacaoInfo
    },
    tramitacaoInfo
      ? 'Proposição criada e tramitação iniciada com sucesso'
      : 'Proposição criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'proposicao.manage' })
