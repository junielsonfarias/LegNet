/**
 * Serviço de Sugestões Legislativas
 * Implementa portal de sugestões do cidadão
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type { StatusSugestaoLegislativa, CategoriaSugestao } from '@prisma/client'

const logger = createLogger('sugestao-legislativa')

export type StatusSugestao = StatusSugestaoLegislativa

export interface CriarSugestaoInput {
  nome: string
  email: string
  cpf: string
  bairro?: string
  telefone?: string
  titulo: string
  descricao: string
  justificativa: string
  categoria?: string
}

export interface ModerarSugestaoInput {
  status: StatusSugestao
  motivoRecusa?: string
  parlamentarResponsavelId?: string
}

export interface FiltrosSugestao {
  status?: StatusSugestao
  categoria?: string
  parlamentarResponsavelId?: string
}

/**
 * Hash de CPF para evitar duplicatas mantendo privacidade
 */
function hashCpf(cpf: string): string {
  let hash = 0
  for (let i = 0; i < cpf.length; i++) {
    const char = cpf.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `CPF_${Math.abs(hash).toString(16)}`
}

/**
 * Cria nova sugestão legislativa
 */
export async function criarSugestao(input: CriarSugestaoInput) {
  // Hash do CPF
  const cpfHash = hashCpf(input.cpf)

  const sugestao = await prisma.sugestaoLegislativa.create({
    data: {
      nome: input.nome,
      email: input.email,
      cpfHash: cpfHash,
      bairro: input.bairro,
      telefone: input.telefone,
      titulo: input.titulo,
      descricao: input.descricao,
      justificativa: input.justificativa,
      categoria: input.categoria as CategoriaSugestao | undefined,
      status: 'PENDENTE',
      totalApoios: 0
    }
  })

  logger.info('Sugestão legislativa criada', {
    action: 'criar_sugestao',
    sugestaoId: sugestao.id,
    titulo: input.titulo
  })

  return sugestao
}

/**
 * Busca sugestão por ID
 */
export async function buscarSugestao(id: string) {
  const sugestao = await prisma.sugestaoLegislativa.findUnique({
    where: { id },
    include: {
      _count: {
        select: { apoios: true }
      }
    }
  })

  if (!sugestao) return null

  // Buscar dados do parlamentar responsável, se houver
  let parlamentarResponsavel: {
    id: string
    nome: string
    partido: string | null
    foto: string | null
  } | null = null
  if (sugestao.parlamentarResponsavelId) {
    parlamentarResponsavel = await prisma.parlamentar.findUnique({
      where: { id: sugestao.parlamentarResponsavelId },
      select: { id: true, nome: true, partido: true, foto: true }
    })
  }

  // Buscar dados da proposição, se houver
  let proposicao: {
    id: string
    numero: string
    ano: number
    titulo: string
    tipo: string
  } | null = null
  if (sugestao.proposicaoId) {
    proposicao = await prisma.proposicao.findUnique({
      where: { id: sugestao.proposicaoId },
      select: { id: true, numero: true, ano: true, titulo: true, tipo: true }
    })
  }

  return {
    ...sugestao,
    parlamentarResponsavel,
    proposicao
  }
}

/**
 * Lista sugestões com filtros
 */
export async function listarSugestoes(
  filtros: FiltrosSugestao,
  page: number = 1,
  limit: number = 20
) {
  const where: any = {}

  if (filtros.status) {
    where.status = filtros.status
  }

  if (filtros.categoria) {
    where.categoria = filtros.categoria
  }

  if (filtros.parlamentarResponsavelId) {
    where.parlamentarResponsavelId = filtros.parlamentarResponsavelId
  }

  const [sugestoes, total] = await Promise.all([
    prisma.sugestaoLegislativa.findMany({
      where,
      include: {
        _count: {
          select: { apoios: true }
        }
      },
      orderBy: [
        { totalApoios: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.sugestaoLegislativa.count({ where })
  ])

  return {
    sugestoes,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Lista sugestões públicas (aprovadas ou em análise)
 */
export async function listarSugestoesPublicas(page: number = 1, limit: number = 20) {
  return listarSugestoes(
    { status: 'ACEITA' },
    page,
    limit
  )
}

/**
 * Modera sugestão
 */
export async function moderarSugestao(
  id: string,
  input: ModerarSugestaoInput
) {
  const sugestao = await prisma.sugestaoLegislativa.update({
    where: { id },
    data: {
      status: input.status,
      motivoRecusa: input.motivoRecusa,
      parlamentarResponsavelId: input.parlamentarResponsavelId
    }
  })

  logger.info('Sugestão moderada', {
    action: 'moderar_sugestao',
    sugestaoId: id,
    status: input.status
  })

  return sugestao
}

/**
 * Registra apoio em sugestão
 */
export async function apoiarSugestao(
  sugestaoId: string,
  nome: string,
  email: string,
  cpf: string
) {
  const cpfHash = hashCpf(cpf)

  // Verificar se já apoiou
  const apoioExistente = await prisma.apoioSugestao.findUnique({
    where: {
      sugestaoId_cpfHash: {
        sugestaoId,
        cpfHash
      }
    }
  })

  if (apoioExistente) {
    throw new Error('Você já apoiou esta sugestão')
  }

  // Registrar apoio
  const apoio = await prisma.apoioSugestao.create({
    data: {
      sugestaoId,
      nome,
      email,
      cpfHash
    }
  })

  // Atualizar contador
  await prisma.sugestaoLegislativa.update({
    where: { id: sugestaoId },
    data: {
      totalApoios: {
        increment: 1
      }
    }
  })

  logger.info('Apoio registrado', {
    action: 'apoiar_sugestao',
    sugestaoId,
    apoioId: apoio.id
  })

  return apoio
}

/**
 * Remove apoio de sugestão
 */
export async function removerApoio(
  sugestaoId: string,
  cpf: string
) {
  const cpfHash = hashCpf(cpf)

  const apoio = await prisma.apoioSugestao.findUnique({
    where: {
      sugestaoId_cpfHash: {
        sugestaoId,
        cpfHash
      }
    }
  })

  if (!apoio) {
    throw new Error('Apoio não encontrado')
  }

  await prisma.apoioSugestao.delete({
    where: { id: apoio.id }
  })

  await prisma.sugestaoLegislativa.update({
    where: { id: sugestaoId },
    data: {
      totalApoios: {
        decrement: 1
      }
    }
  })

  logger.info('Apoio removido', {
    action: 'remover_apoio',
    sugestaoId,
    apoioId: apoio.id
  })
}

/**
 * Converte sugestão em proposição
 */
export async function converterEmProposicao(
  sugestaoId: string,
  tipoProposicao: string,
  autorId: string
) {
  const sugestao = await prisma.sugestaoLegislativa.findUnique({
    where: { id: sugestaoId }
  })

  if (!sugestao) {
    throw new Error('Sugestão não encontrada')
  }

  // Buscar próximo número de proposição
  const ano = new Date().getFullYear()
  const ultimaProposicao = await prisma.proposicao.findFirst({
    where: { ano },
    orderBy: { numero: 'desc' },
    select: { numero: true }
  })

  const numeroStr = ((parseInt(ultimaProposicao?.numero || '0') || 0) + 1).toString().padStart(3, '0')

  // Criar proposição
  const proposicao = await prisma.proposicao.create({
    data: {
      numero: numeroStr,
      ano,
      tipo: tipoProposicao as any,
      titulo: sugestao.titulo,
      ementa: sugestao.descricao,
      dataApresentacao: new Date(),
      status: 'APRESENTADA',
      autorId,
      texto: `${sugestao.descricao}\n\nJUSTIFICATIVA:\n${sugestao.justificativa}`
    }
  })

  // Atualizar sugestão
  await prisma.sugestaoLegislativa.update({
    where: { id: sugestaoId },
    data: {
      status: 'ACEITA',
      proposicaoId: proposicao.id
    }
  })

  logger.info('Sugestão convertida em proposição', {
    action: 'converter_sugestao',
    sugestaoId,
    proposicaoId: proposicao.id
  })

  return proposicao
}

/**
 * Estatísticas de sugestões
 */
export async function getEstatisticasSugestoes() {
  const [
    total,
    porStatus,
    porCategoria,
    maisApoiadas
  ] = await Promise.all([
    prisma.sugestaoLegislativa.count(),
    prisma.sugestaoLegislativa.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.sugestaoLegislativa.groupBy({
      by: ['categoria'],
      _count: true
    }),
    prisma.sugestaoLegislativa.findMany({
      where: { status: 'ACEITA' },
      orderBy: { totalApoios: 'desc' },
      take: 5,
      select: {
        id: true,
        titulo: true,
        totalApoios: true,
        categoria: true
      }
    })
  ])

  return {
    total,
    porStatus: porStatus.map(s => ({ status: s.status, quantidade: s._count })),
    porCategoria: porCategoria.map(c => ({ categoria: c.categoria || 'Sem categoria', quantidade: c._count })),
    maisApoiadas
  }
}

/**
 * Verifica se cidadão já tem sugestão pendente
 */
export async function verificarSugestaoPendente(cpf: string): Promise<boolean> {
  const cpfHash = hashCpf(cpf)

  const sugestao = await prisma.sugestaoLegislativa.findFirst({
    where: {
      cpfHash: cpfHash,
      status: 'PENDENTE'
    }
  })

  return !!sugestao
}
