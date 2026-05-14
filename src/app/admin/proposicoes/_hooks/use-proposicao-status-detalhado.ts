'use client'

import { useMemo } from 'react'
import type {
  ProposicaoApi,
  TramitacaoApi,
  TipoTramitacao,
  TipoOrgao,
  StatusDetalhado,
  NotificacaoTramitacao,
} from '../_types'

/**
 * F4.4 — calculo do status detalhado + notificacoes para a proposicao
 * selecionada. Extraido de admin/proposicoes/page.tsx para reduzir o tamanho
 * do componente e permitir reuso na visualizacao da proposicao.
 */
export function useProposicaoStatusDetalhado(
  selectedProposicao: ProposicaoApi | null,
  tramitacoes: TramitacaoApi[],
  tiposTramitacao: TipoTramitacao[],
  unidades: TipoOrgao[],
): { statusDetalhado: StatusDetalhado | null; notificacoes: NotificacaoTramitacao[] } {
  const statusDetalhado = useMemo<StatusDetalhado | null>(() => {
    if (!selectedProposicao) return null
    const relacionadas = tramitacoes
      .filter((t) => t.proposicaoId === selectedProposicao.id)
      .sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime())

    if (!relacionadas.length) {
      return {
        status: 'NÃO_TRAMITADA',
        localizacao: 'Não iniciada',
        descricao: 'Proposição ainda não foi protocolada',
        prazo: null,
        proximoPasso: 'Protocolo na Mesa Diretora',
        tramitacaoAtual: null,
      }
    }

    const atual = relacionadas[0]
    const tipoTramitacao = tiposTramitacao.find((tipo) => tipo.id === atual.tipoTramitacaoId)
    const unidade = unidades.find((orgao) => orgao.id === atual.unidadeId)

    return {
      status: atual.status ?? 'EM_ANDAMENTO',
      localizacao: unidade?.nome || 'Órgão não identificado',
      descricao: atual.observacoes || '',
      prazo: atual.prazoVencimento ? String(atual.prazoVencimento) : null,
      proximoPasso: 'Próxima etapa do processo',
      tramitacaoAtual: atual,
      tipoTramitacao,
      unidade,
    }
  }, [selectedProposicao, tramitacoes, tiposTramitacao, unidades])

  const notificacoes = useMemo<NotificacaoTramitacao[]>(() => {
    if (!selectedProposicao) return []
    return tramitacoes
      .filter((t) => t.proposicaoId === selectedProposicao.id)
      .flatMap((tramitacao) =>
        (tramitacao.notificacoes ?? []).map((notificacao) => ({
          ...notificacao,
          etapa: tramitacao,
        } as NotificacaoTramitacao)),
      )
      .sort((a, b) => {
        const dataA = a.enviadoEm ? new Date(a.enviadoEm).getTime() : 0
        const dataB = b.enviadoEm ? new Date(b.enviadoEm).getTime() : 0
        return dataB - dataA
      })
  }, [selectedProposicao, tramitacoes])

  return { statusDetalhado, notificacoes }
}
