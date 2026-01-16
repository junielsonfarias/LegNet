import { ApiResponse } from '@/lib/error-handler'
import {
  tramitacoesService,
  tramitacaoHistoricosService,
  tiposTramitacaoService,
  tiposOrgaosService
} from '@/lib/tramitacao-service'
import { proposicoesService } from '@/lib/proposicoes-service'
import { mockData } from '@/lib/db'

export interface PublicTramitacaoResumo {
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

export interface PublicTramitacaoDetalhe extends PublicTramitacaoResumo {
  historicos: Array<{
    id: string
    data: string
    acao: string
    descricao?: string | null
    usuarioId?: string | null
    dadosAnteriores?: unknown
    dadosNovos?: unknown
  }>
}

export interface PublicTramitacaoFilters {
  status?: string
  resultado?: string
  autorId?: string
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

const normalize = (value?: string | null) =>
  value?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ?? ''

const mapResumo = (tramitacao: ReturnType<typeof tramitacoesService.getAll>[number]): PublicTramitacaoResumo => {
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

const fallbackList = (filters?: PublicTramitacaoFilters) => {
  const itens = tramitacoesService.getAll().filter(tramitacao => {
    if (filters?.status && tramitacao.status?.toUpperCase() !== filters.status.toUpperCase()) {
      return false
    }

    if (filters?.resultado && (tramitacao.resultado ?? '').toUpperCase() !== filters.resultado.toUpperCase()) {
      return false
    }

    if (filters?.autorId) {
      const proposicaoAutor = proposicoesService.getById(tramitacao.proposicaoId)?.autorId
      if (!proposicaoAutor || proposicaoAutor !== filters.autorId) {
        return false
      }
    }

    if (filters?.from || filters?.to) {
      const dataEntrada = new Date(tramitacao.dataEntrada)
      if (!Number.isNaN(dataEntrada.getTime())) {
        if (filters.from) {
          const fromDate = new Date(filters.from)
          if (!Number.isNaN(fromDate.getTime()) && dataEntrada < fromDate) {
            return false
          }
        }
        if (filters.to) {
          const toDate = new Date(filters.to)
          if (!Number.isNaN(toDate.getTime()) && dataEntrada > toDate) {
            return false
          }
        }
      }
    }

    if (filters?.search) {
      const normalizedSearch = normalize(filters.search)
      const proposicao = proposicoesService.getById(tramitacao.proposicaoId)
      const matches =
        normalize(proposicao?.numero).includes(normalizedSearch) ||
        normalize(proposicao?.titulo).includes(normalizedSearch) ||
        normalize(tramitacao.observacoes).includes(normalizedSearch) ||
        normalize(tramitacao.parecer).includes(normalizedSearch)
      if (!matches) {
        return false
      }
    }

    return true
  })

  const sorted = itens.sort(
    (a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime()
  )

  const limit = filters?.limit && filters.limit > 0 ? filters.limit : 10
  const page = filters?.page && filters.page > 0 ? filters.page : 1
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const startIndex = (page - 1) * limit

  return {
    items: sorted.slice(startIndex, startIndex + limit).map(mapResumo),
    meta: {
      total,
      page,
      limit,
      totalPages
    }
  }
}

const fallbackDetail = (id: string): PublicTramitacaoDetalhe => {
  const tramitacao = tramitacoesService.getById(id)
  if (!tramitacao) {
    throw new Error('Tramitação não encontrada (modo offline).')
  }

  const resumo = mapResumo(tramitacao)
  const historicos = tramitacaoHistoricosService.getByTramitacao(id).map(historico => ({
    id: historico.id,
    data: historico.data,
    acao: historico.acao,
    descricao: historico.descricao ?? null,
    usuarioId: historico.usuarioId ?? null,
    dadosAnteriores: historico.dadosAnteriores ?? null,
    dadosNovos: historico.dadosNovos ?? null
  }))

  return {
    ...resumo,
    historicos
  }
}

class PublicTramitacoesApiService {
  private baseUrl = '/api/publico/tramitacoes'

  async list(filters?: PublicTramitacaoFilters) {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.resultado) params.set('resultado', filters.resultado)
    if (filters?.autorId) params.set('autorId', filters.autorId)
    if (filters?.search) params.set('search', filters.search)
    if (filters?.from) params.set('from', filters.from)
    if (filters?.to) params.set('to', filters.to)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.limit) params.set('limit', String(filters.limit))

    try {
      const response = await fetch(`${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (response.status === 401) {
        return fallbackList(filters)
      }

      const data: ApiResponse<{ items: PublicTramitacaoResumo[] }> = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Erro ao carregar tramitações públicas' : data.error)
      }

      return {
        items: data.data.items,
        meta: data.meta ?? undefined
      }
    } catch (error) {
      return fallbackList(filters)
    }
  }

  async getById(id: string): Promise<PublicTramitacaoDetalhe> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (response.status === 401) {
        return fallbackDetail(id)
      }

      const data: ApiResponse<PublicTramitacaoDetalhe> = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Erro ao carregar tramitação pública' : data.error)
      }

      return data.data
    } catch (error) {
      return fallbackDetail(id)
    }
  }
}

export const publicTramitacoesApi = new PublicTramitacoesApiService()

