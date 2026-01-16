import { NextRequest } from 'next/server'

import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import {
  tramitacoesService,
  tiposTramitacaoService,
  tiposOrgaosService
} from '@/lib/tramitacao-service'
import { proposicoesService } from '@/lib/proposicoes-service'
import { mockData } from '@/lib/db'

interface PublicTramitacao {
  id: string
  proposicaoId: string
  proposicaoNumero?: string | null
  proposicaoTitulo?: string | null
  autor?: {
    id: string
    nome: string
    partido?: string | null
  } | null
  status: string
  resultado?: string | null
  dataEntrada: string
  dataSaida?: string | null
  unidade?: {
    id: string
    nome: string
    sigla?: string | null
  } | null
  tipo?: {
    id: string
    nome: string
  } | null
  observacoes?: string | null
  parecer?: string | null
  prazoVencimento?: string | null
  diasVencidos?: number | null
}

const normalizeString = (value?: string | null) => value?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ?? ''

const toPublicTramitacao = (tramitacao: ReturnType<typeof tramitacoesService.getAll>[number]): PublicTramitacao => {
  const proposicao = proposicoesService.getById(tramitacao.proposicaoId)
  const tipo = tiposTramitacaoService.getById(tramitacao.tipoTramitacaoId)
  const unidade = tiposOrgaosService.getById(tramitacao.unidadeId)
  const autor = proposicao?.autorId
    ? mockData.parlamentares?.find(parlamentar => parlamentar.id === proposicao.autorId) ?? null
    : null

  return {
    id: tramitacao.id,
    proposicaoId: tramitacao.proposicaoId,
    proposicaoNumero: proposicao?.numero ?? null,
    proposicaoTitulo: proposicao?.titulo ?? null,
    autor: autor
      ? {
          id: autor.id,
          nome: autor.nome,
          partido: autor.partido ?? null
        }
      : null,
    status: tramitacao.status ?? 'EM_ANDAMENTO',
    resultado: tramitacao.resultado ?? null,
    dataEntrada: tramitacao.dataEntrada,
    dataSaida: tramitacao.dataSaida ?? null,
    unidade: unidade
      ? {
          id: unidade.id,
          nome: unidade.nome,
          sigla: unidade.sigla ?? null
        }
      : null,
    tipo: tipo
      ? {
          id: tipo.id,
          nome: tipo.nome
        }
      : null,
    observacoes: tramitacao.observacoes ?? null,
    parecer: tramitacao.parecer ?? null,
    prazoVencimento: tramitacao.prazoVencimento ?? null,
    diasVencidos: tramitacao.diasVencidos ?? null
  }
}

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const resultado = searchParams.get('resultado')
  const autorId = searchParams.get('autorId')
  const searchTerm = searchParams.get('search')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Number(searchParams.get('limit') ?? '10')

  const all = tramitacoesService.getAll()

  const filtered = all.filter(tramitacao => {
    if (status && tramitacao.status?.toUpperCase() !== status.toUpperCase()) {
      return false
    }

    if (resultado && (tramitacao.resultado ?? '').toUpperCase() !== resultado.toUpperCase()) {
      return false
    }

    if (autorId) {
      const proposicaoAutor = proposicoesService.getById(tramitacao.proposicaoId)?.autorId
      if (!proposicaoAutor || proposicaoAutor !== autorId) {
        return false
      }
    }

    if (from || to) {
      const dataEntrada = new Date(tramitacao.dataEntrada)
      if (!Number.isNaN(dataEntrada.getTime())) {
        if (from) {
          const fromDate = new Date(from)
          if (!Number.isNaN(fromDate.getTime()) && dataEntrada < fromDate) {
            return false
          }
        }
        if (to) {
          const toDate = new Date(to)
          if (!Number.isNaN(toDate.getTime()) && dataEntrada > toDate) {
            return false
          }
        }
      }
    }

    if (searchTerm) {
      const normalizedSearch = normalizeString(searchTerm)
      const proposicao = proposicoesService.getById(tramitacao.proposicaoId)
      const matchesSearch =
        normalizeString(proposicao?.numero).includes(normalizedSearch) ||
        normalizeString(proposicao?.titulo).includes(normalizedSearch) ||
        normalizeString(tramitacao.observacoes).includes(normalizedSearch) ||
        normalizeString(tramitacao.parecer).includes(normalizedSearch)

      if (!matchesSearch) {
        return false
      }
    }

    return true
  })

  const sorted = filtered.sort(
    (a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime()
  )

  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10
  const safePage = Number.isFinite(page) && page > 0 ? page : 1
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const startIndex = (safePage - 1) * safeLimit
  const paginated = sorted.slice(startIndex, startIndex + safeLimit)

  const data = paginated.map(toPublicTramitacao)

  return createSuccessResponse(
    {
      items: data
    },
    undefined,
    total,
    200,
    {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages
    }
  )
}

