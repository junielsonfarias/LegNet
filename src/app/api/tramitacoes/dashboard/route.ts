import { NextRequest } from 'next/server'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'
import {
  tramitacoesService,
  tiposTramitacaoService,
  tiposOrgaosService
} from '@/lib/tramitacao-service'
import { registerApiMetric } from '@/lib/monitoring/metrics'

export const dynamic = 'force-dynamic'

const STATUS_ANDAMENTO = 'EM_ANDAMENTO'
const STATUS_CONCLUIDA = 'CONCLUIDA'
const STATUS_CANCELADA = 'CANCELADA'

const toDaysDiff = (start: string, end?: string | null) => {
  if (!start || !end) return null
  const inicio = new Date(start)
  const fim = new Date(end)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return null
  }
  const diff = fim.getTime() - inicio.getTime()
  return diff >= 0 ? Math.round(diff / (1000 * 60 * 60 * 24)) : null
}

export const GET = withAuth(async (_request: NextRequest) => {
  const startedAt = Date.now()
  const tramitacoes = tramitacoesService.getAll()
  const tiposTramitacao = tiposTramitacaoService.getAll()
  const unidades = tiposOrgaosService.getAll()

  const total = tramitacoes.length
  const emAndamento = tramitacoes.filter(item => (item.status ?? STATUS_ANDAMENTO).toUpperCase() === STATUS_ANDAMENTO)
  const concluidas = tramitacoes.filter(item => (item.status ?? '').toUpperCase() === STATUS_CONCLUIDA)
  const canceladas = tramitacoes.filter(item => (item.status ?? '').toUpperCase() === STATUS_CANCELADA)

  const vencidas = emAndamento.filter(item => {
    if (!item.prazoVencimento) return false
    const prazo = new Date(item.prazoVencimento)
    if (Number.isNaN(prazo.getTime())) return false
    return prazo.getTime() < Date.now()
  })

  const temposConcluidos = concluidas
    .map(item => toDaysDiff(item.dataEntrada, item.dataSaida))
    .filter((valor): valor is number => valor !== null)

  const tempoMedioConclusao = temposConcluidos.length
    ? Math.round(temposConcluidos.reduce((acc, valor) => acc + valor, 0) / temposConcluidos.length)
    : null

  const proximosVencimentos = emAndamento
    .filter(item => item.prazoVencimento)
    .sort((a, b) => new Date(a.prazoVencimento as string).getTime() - new Date(b.prazoVencimento as string).getTime())
    .slice(0, 10)
    .map(item => ({
      id: item.id,
      proposicaoId: item.proposicaoId,
      prazoVencimento: item.prazoVencimento,
      diasRestantes: item.prazoVencimento
        ? Math.max(0, Math.ceil((new Date(item.prazoVencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
      unidade: unidades.find(unidade => unidade.id === item.unidadeId)?.nome ?? null,
      tipoTramitacao: tiposTramitacao.find(tipo => tipo.id === item.tipoTramitacaoId)?.nome ?? null
    }))

  const porUnidade = unidades.map(unidade => {
    const itens = tramitacoes.filter(tramitacao => tramitacao.unidadeId === unidade.id)
    return {
      unidadeId: unidade.id,
      unidadeNome: unidade.nome,
      total: itens.length,
      emAndamento: itens.filter(item => (item.status ?? STATUS_ANDAMENTO).toUpperCase() === STATUS_ANDAMENTO).length,
      concluidas: itens.filter(item => (item.status ?? '').toUpperCase() === STATUS_CONCLUIDA).length,
      canceladas: itens.filter(item => (item.status ?? '').toUpperCase() === STATUS_CANCELADA).length
    }
  })

  const porTipo = tiposTramitacao.map(tipo => {
    const itens = tramitacoes.filter(tramitacao => tramitacao.tipoTramitacaoId === tipo.id)
    return {
      tipoTramitacaoId: tipo.id,
      tipoTramitacaoNome: tipo.nome,
      total: itens.length,
      emAndamento: itens.filter(item => (item.status ?? STATUS_ANDAMENTO).toUpperCase() === STATUS_ANDAMENTO).length,
      concluidas: itens.filter(item => (item.status ?? '').toUpperCase() === STATUS_CONCLUIDA).length,
      canceladas: itens.filter(item => (item.status ?? '').toUpperCase() === STATUS_CANCELADA).length
    }
  })

  const payload = {
    resumo: {
      total,
      emAndamento: emAndamento.length,
      concluidas: concluidas.length,
      canceladas: canceladas.length,
      vencidas: vencidas.length,
      tempoMedioConclusao
    },
    proximosVencimentos,
    porUnidade,
    porTipo
  }

  const response = createSuccessResponse(payload, 'Dashboard de tramitação gerado com sucesso')

  registerApiMetric('tramitacoes_dashboard', Date.now() - startedAt, response.status, {
    totalTramitacoes: total
  })

  return response
}, { permissions: 'relatorio.view' })
