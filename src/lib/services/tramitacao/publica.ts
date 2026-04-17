/**
 * Tramitação — funções do portal público (sem autenticação).
 * Extraído de tramitacao-service.ts (Sprint 2, 17/04/2026).
 */

import { prisma } from '@/lib/prisma'
import type { PaginationParams } from '../tramitacao-types'

/**
 * Lista tramitacoes para o portal publico (sem autenticacao).
 * Inclui autor da proposicao e busca por proposicao.
 */
export async function publicList(
  filters: {
    status?: string
    resultado?: string
    autorId?: string
    search?: string
    from?: string
    to?: string
  },
  pagination: PaginationParams
) {
  const { page, limit } = pagination
  const where: Record<string, unknown> = {}

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.resultado) {
    where.resultado = filters.resultado
  }

  if (filters.autorId) {
    where.proposicao = { autorId: filters.autorId }
  }

  if (filters.from || filters.to) {
    const dateFilter: Record<string, unknown> = {}
    if (filters.from) {
      const fromDate = new Date(filters.from)
      if (!Number.isNaN(fromDate.getTime())) {
        dateFilter.gte = fromDate
      }
    }
    if (filters.to) {
      const toDate = new Date(filters.to)
      if (!Number.isNaN(toDate.getTime())) {
        dateFilter.lte = toDate
      }
    }
    where.dataEntrada = dateFilter
  }

  if (filters.search) {
    where.OR = [
      { observacoes: { contains: filters.search, mode: 'insensitive' } },
      { parecer: { contains: filters.search, mode: 'insensitive' } },
      { proposicao: { numero: { contains: filters.search, mode: 'insensitive' } } },
      { proposicao: { titulo: { contains: filters.search, mode: 'insensitive' } } }
    ]
  }

  const [tramitacoes, total] = await Promise.all([
    prisma.tramitacao.findMany({
      where,
      include: {
        tipoTramitacao: {
          select: { id: true, nome: true }
        },
        unidade: {
          select: { id: true, nome: true, sigla: true }
        },
        proposicao: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            autor: {
              select: { id: true, nome: true, partido: true }
            }
          }
        }
      },
      orderBy: { dataEntrada: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.tramitacao.count({ where })
  ])

  return { tramitacoes, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/**
 * Busca tramitacao por ID para o portal publico (sem autenticacao).
 * Inclui historicos e dados completos da proposicao.
 */
export async function publicGetById(id: string) {
  return prisma.tramitacao.findUnique({
    where: { id },
    include: {
      tipoTramitacao: {
        select: { id: true, nome: true, descricao: true }
      },
      unidade: {
        select: { id: true, nome: true, sigla: true }
      },
      proposicao: {
        select: {
          id: true,
          numero: true,
          titulo: true,
          tipo: true,
          status: true,
          dataApresentacao: true,
          autor: {
            select: { id: true, nome: true, partido: true }
          }
        }
      },
      historicos: {
        select: {
          id: true,
          data: true,
          acao: true,
          descricao: true,
          usuarioId: true,
          dadosAnteriores: true,
          dadosNovos: true
        },
        orderBy: { data: 'desc' }
      }
    }
  })
}

/**
 * Busca proposicao por ID (selecao basica para validacao em tramitacao).
 */
export async function findProposicaoBasic(id: string) {
  return prisma.proposicao.findUnique({
    where: { id },
    select: {
      id: true,
      numero: true,
      ano: true,
      tipo: true,
      titulo: true,
      status: true
    }
  })
}

/**
 * Atualiza status de uma proposicao diretamente.
 */
export async function updateProposicaoStatus(
  id: string,
  status: 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'EM_TRAMITACAO'
) {
  return prisma.proposicao.update({
    where: { id },
    data: { status }
  })
}
