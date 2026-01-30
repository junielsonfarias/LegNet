import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')?.toUpperCase()
  const resultado = searchParams.get('resultado')?.toUpperCase()
  const autorId = searchParams.get('autorId')
  const searchTerm = searchParams.get('search')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit') ?? '10')), 100)

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (resultado) {
    where.resultado = resultado
  }

  if (autorId) {
    where.proposicao = {
      autorId
    }
  }

  if (from || to) {
    where.dataEntrada = {}
    if (from) {
      const fromDate = new Date(from)
      if (!Number.isNaN(fromDate.getTime())) {
        where.dataEntrada.gte = fromDate
      }
    }
    if (to) {
      const toDate = new Date(to)
      if (!Number.isNaN(toDate.getTime())) {
        where.dataEntrada.lte = toDate
      }
    }
  }

  if (searchTerm) {
    where.OR = [
      { observacoes: { contains: searchTerm, mode: 'insensitive' } },
      { parecer: { contains: searchTerm, mode: 'insensitive' } },
      { proposicao: { numero: { contains: searchTerm, mode: 'insensitive' } } },
      { proposicao: { titulo: { contains: searchTerm, mode: 'insensitive' } } }
    ]
  }

  const [tramitacoes, total] = await Promise.all([
    prisma.tramitacao.findMany({
      where,
      include: {
        tipoTramitacao: {
          select: {
            id: true,
            nome: true
          }
        },
        unidade: {
          select: {
            id: true,
            nome: true,
            sigla: true
          }
        },
        proposicao: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            autor: {
              select: {
                id: true,
                nome: true,
                partido: true
              }
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

  const items = tramitacoes.map(t => ({
    id: t.id,
    proposicaoId: t.proposicaoId,
    proposicaoNumero: t.proposicao.numero,
    proposicaoTitulo: t.proposicao.titulo,
    autor: t.proposicao.autor
      ? {
          id: t.proposicao.autor.id,
          nome: t.proposicao.autor.nome,
          partido: t.proposicao.autor.partido
        }
      : null,
    status: t.status,
    resultado: t.resultado,
    dataEntrada: t.dataEntrada.toISOString(),
    dataSaida: t.dataSaida?.toISOString() ?? null,
    unidade: t.unidade
      ? {
          id: t.unidade.id,
          nome: t.unidade.nome,
          sigla: t.unidade.sigla
        }
      : null,
    tipo: t.tipoTramitacao
      ? {
          id: t.tipoTramitacao.id,
          nome: t.tipoTramitacao.nome
        }
      : null,
    observacoes: t.observacoes,
    parecer: t.parecer,
    prazoVencimento: t.prazoVencimento?.toISOString() ?? null,
    diasVencidos: t.diasVencidos
  }))

  return createSuccessResponse(
    { items },
    undefined,
    total,
    200,
    {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  )
}
