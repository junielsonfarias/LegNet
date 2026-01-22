/**
 * Serviço de Consultas Públicas
 * Implementa sistema de consultas públicas e enquetes
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type { StatusConsultaPublica } from '@prisma/client'

const logger = createLogger('consulta-publica')

export type StatusConsulta = StatusConsultaPublica

export interface CriarConsultaInput {
  titulo: string
  descricao: string
  proposicaoId?: string
  dataInicio: Date
  dataFim: Date
  permitirAnonimo?: boolean
  requerCadastro?: boolean
  moderacao?: boolean
}

export interface CriarPerguntaInput {
  consultaId: string
  ordem: number
  texto: string
  tipo: 'TEXTO_LIVRE' | 'MULTIPLA_ESCOLHA' | 'ESCALA' | 'SIM_NAO'
  obrigatoria?: boolean
  opcoes?: string[]
}

export interface ParticiparConsultaInput {
  consultaId: string
  nome?: string
  email?: string
  cpf?: string
  bairro?: string
  respostas: Array<{
    perguntaId: string
    resposta: string
  }>
}

export interface FiltrosConsulta {
  status?: StatusConsulta
  proposicaoId?: string
}

/**
 * Cria nova consulta pública
 */
export async function criarConsulta(input: CriarConsultaInput) {
  const consulta = await prisma.consultaPublica.create({
    data: {
      titulo: input.titulo,
      descricao: input.descricao,
      proposicaoId: input.proposicaoId,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      permitirAnonimo: input.permitirAnonimo ?? true,
      requerCadastro: input.requerCadastro ?? false,
      moderacao: input.moderacao ?? false,
      status: 'RASCUNHO'
    }
  })

  logger.info('Consulta pública criada', {
    action: 'criar_consulta',
    consultaId: consulta.id,
    titulo: input.titulo
  })

  return consulta
}

/**
 * Busca consulta por ID
 */
export async function buscarConsultaPorId(id: string) {
  return prisma.consultaPublica.findUnique({
    where: { id },
    include: {
      perguntas: {
        orderBy: { ordem: 'asc' }
      },
      _count: {
        select: { participacoes: true }
      }
    }
  })
}

/**
 * Lista consultas com filtros
 */
export async function listarConsultas(
  filtros: FiltrosConsulta,
  page: number = 1,
  limit: number = 20
) {
  const where: any = {}

  if (filtros.status) {
    where.status = filtros.status
  }

  if (filtros.proposicaoId) {
    where.proposicaoId = filtros.proposicaoId
  }

  const [consultas, total] = await Promise.all([
    prisma.consultaPublica.findMany({
      where,
      include: {
        _count: {
          select: { participacoes: true, perguntas: true }
        }
      },
      orderBy: { dataInicio: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.consultaPublica.count({ where })
  ])

  return {
    consultas,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Lista consultas abertas (públicas)
 */
export async function listarConsultasAbertas() {
  const agora = new Date()

  return prisma.consultaPublica.findMany({
    where: {
      status: 'ABERTA',
      dataInicio: { lte: agora },
      dataFim: { gte: agora }
    },
    include: {
      _count: {
        select: { participacoes: true, perguntas: true }
      }
    },
    orderBy: { dataFim: 'asc' }
  })
}

/**
 * Atualiza status da consulta
 */
export async function atualizarStatusConsulta(
  id: string,
  status: StatusConsulta
) {
  const consulta = await prisma.consultaPublica.update({
    where: { id },
    data: { status }
  })

  logger.info('Status da consulta atualizado', {
    action: 'atualizar_status_consulta',
    consultaId: id,
    status
  })

  return consulta
}

/**
 * Adiciona pergunta à consulta
 */
export async function adicionarPergunta(input: CriarPerguntaInput) {
  const pergunta = await prisma.perguntaConsulta.create({
    data: {
      consultaId: input.consultaId,
      ordem: input.ordem,
      texto: input.texto,
      tipo: input.tipo,
      obrigatoria: input.obrigatoria ?? false,
      opcoes: input.opcoes ? JSON.stringify(input.opcoes) : null
    }
  })

  logger.info('Pergunta adicionada', {
    action: 'adicionar_pergunta',
    consultaId: input.consultaId,
    perguntaId: pergunta.id
  })

  return pergunta
}

/**
 * Remove pergunta
 */
export async function removerPergunta(perguntaId: string) {
  await prisma.perguntaConsulta.delete({
    where: { id: perguntaId }
  })

  logger.info('Pergunta removida', {
    action: 'remover_pergunta',
    perguntaId
  })
}

/**
 * Hash de CPF para evitar duplicatas mantendo privacidade
 */
function hashCpf(cpf: string): string {
  // Hash simples para demonstração - em produção usar bcrypt ou similar
  let hash = 0
  for (let i = 0; i < cpf.length; i++) {
    const char = cpf.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `CPF_${Math.abs(hash).toString(16)}`
}

/**
 * Registra participação em consulta
 */
export async function participarConsulta(input: ParticiparConsultaInput) {
  // Verificar se consulta está aberta
  const consulta = await prisma.consultaPublica.findUnique({
    where: { id: input.consultaId },
    include: { perguntas: true }
  })

  if (!consulta) {
    throw new Error('Consulta não encontrada')
  }

  if (consulta.status !== 'ABERTA') {
    throw new Error('Consulta não está aberta para participação')
  }

  const agora = new Date()
  if (agora < consulta.dataInicio || agora > consulta.dataFim) {
    throw new Error('Consulta fora do período de participação')
  }

  // Verificar se já participou (por CPF)
  let cpfHash: string | undefined
  if (input.cpf) {
    cpfHash = hashCpf(input.cpf)
    const participacaoExistente = await prisma.participacaoConsulta.findFirst({
      where: {
        consultaId: input.consultaId,
        cpfHash: cpfHash
      }
    })

    if (participacaoExistente) {
      throw new Error('Você já participou desta consulta')
    }
  }

  // Criar participação com respostas
  const participacao = await prisma.participacaoConsulta.create({
    data: {
      consultaId: input.consultaId,
      nome: input.nome,
      email: input.email,
      cpfHash: cpfHash,
      bairro: input.bairro,
      respostas: {
        create: input.respostas.map(r => ({
          perguntaId: r.perguntaId,
          resposta: r.resposta
        }))
      }
    },
    include: {
      respostas: true
    }
  })

  logger.info('Participação registrada', {
    action: 'participar_consulta',
    consultaId: input.consultaId,
    participacaoId: participacao.id
  })

  return participacao
}

/**
 * Busca resultados da consulta
 */
export async function buscarResultadosConsulta(consultaId: string) {
  const consulta = await prisma.consultaPublica.findUnique({
    where: { id: consultaId },
    include: {
      perguntas: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  if (!consulta) {
    throw new Error('Consulta não encontrada')
  }

  // Contagem de participações
  const totalParticipacoes = await prisma.participacaoConsulta.count({
    where: { consultaId }
  })

  // Resultados por pergunta
  const resultadosPorPergunta = await Promise.all(
    consulta.perguntas.map(async (pergunta) => {
      const respostas = await prisma.respostaConsulta.findMany({
        where: { perguntaId: pergunta.id }
      })

      // Contar respostas
      const contagem: Record<string, number> = {}
      respostas.forEach(r => {
        contagem[r.resposta] = (contagem[r.resposta] || 0) + 1
      })

      return {
        perguntaId: pergunta.id,
        texto: pergunta.texto,
        tipo: pergunta.tipo,
        totalRespostas: respostas.length,
        contagem: Object.entries(contagem)
          .map(([resposta, quantidade]) => ({
            resposta,
            quantidade,
            percentual: respostas.length > 0
              ? Math.round((quantidade / respostas.length) * 100)
              : 0
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
      }
    })
  )

  // Participações por bairro
  const participacoesPorBairro = await prisma.participacaoConsulta.groupBy({
    by: ['bairro'],
    where: {
      consultaId,
      bairro: { not: null }
    },
    _count: true
  })

  return {
    consulta: {
      id: consulta.id,
      titulo: consulta.titulo,
      status: consulta.status,
      dataInicio: consulta.dataInicio,
      dataFim: consulta.dataFim
    },
    totalParticipacoes,
    resultadosPorPergunta,
    participacoesPorBairro: participacoesPorBairro.map(p => ({
      bairro: p.bairro || 'Não informado',
      quantidade: p._count
    }))
  }
}

/**
 * Publica consulta
 */
export async function publicarConsulta(consultaId: string) {
  const consulta = await prisma.consultaPublica.update({
    where: { id: consultaId },
    data: { status: 'ABERTA' }
  })

  logger.info('Consulta publicada', {
    action: 'publicar_consulta',
    consultaId
  })

  return consulta
}

/**
 * Encerra consulta
 */
export async function encerrarConsulta(consultaId: string) {
  const consulta = await prisma.consultaPublica.update({
    where: { id: consultaId },
    data: { status: 'ENCERRADA' }
  })

  logger.info('Consulta encerrada', {
    action: 'encerrar_consulta',
    consultaId
  })

  return consulta
}
