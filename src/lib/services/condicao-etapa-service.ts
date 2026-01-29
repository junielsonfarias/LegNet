/**
 * Servico de Avaliacao de Condicoes de Etapas
 * Determina se uma etapa condicional deve ser executada baseado nos criterios da proposicao
 */

import { createLogger } from '@/lib/logging/logger'
import type { FluxoTramitacaoEtapa, TipoCondicaoEtapa } from '@prisma/client'

const logger = createLogger('condicao-etapa')

// Interface para os dados da proposicao necessarios para avaliar condicoes
export interface DadosProposicaoParaCondicao {
  id: string
  tipo: string
  status: string
  // Campos especificos que podem afetar condicoes
  temImpactoFinanceiro?: boolean
  temImpactoOrcamentario?: boolean
  regimeTramitacao?: 'NORMAL' | 'PRIORIDADE' | 'URGENCIA' | 'URGENCIA_URGENTISSIMA'
  // Campos personalizados (para condicoes baseadas em campos especificos)
  camposExtras?: Record<string, unknown>
}

// Resultado da avaliacao de uma condicao
export interface ResultadoAvaliacaoCondicao {
  deveExecutar: boolean
  motivo: string
  tipoCondicao: TipoCondicaoEtapa | null
}

/**
 * Avalia se uma etapa deve ser executada para uma proposicao especifica
 */
export function avaliarCondicaoEtapa(
  etapa: FluxoTramitacaoEtapa,
  proposicao: DadosProposicaoParaCondicao
): ResultadoAvaliacaoCondicao {
  // Se nao e condicional, sempre executa
  if (!etapa.condicional) {
    return {
      deveExecutar: true,
      motivo: 'Etapa obrigatoria',
      tipoCondicao: null
    }
  }

  const tipoCondicao = etapa.tipoCondicao

  switch (tipoCondicao) {
    case 'SEMPRE':
      return {
        deveExecutar: true,
        motivo: 'Etapa configurada como sempre executar',
        tipoCondicao
      }

    case 'IMPACTO_FINANCEIRO':
      const temImpacto = proposicao.temImpactoFinanceiro || proposicao.temImpactoOrcamentario
      return {
        deveExecutar: temImpacto === true,
        motivo: temImpacto
          ? 'Proposicao possui impacto financeiro/orcamentario'
          : 'Proposicao nao possui impacto financeiro/orcamentario',
        tipoCondicao
      }

    case 'REGIME_URGENCIA':
      const ehUrgencia = proposicao.regimeTramitacao === 'URGENCIA' ||
                         proposicao.regimeTramitacao === 'URGENCIA_URGENTISSIMA'
      return {
        deveExecutar: ehUrgencia,
        motivo: ehUrgencia
          ? 'Proposicao em regime de urgencia'
          : 'Proposicao nao esta em regime de urgencia',
        tipoCondicao
      }

    case 'REGIME_NORMAL':
      const ehNormal = proposicao.regimeTramitacao === 'NORMAL' ||
                       !proposicao.regimeTramitacao
      return {
        deveExecutar: ehNormal,
        motivo: ehNormal
          ? 'Proposicao em regime normal'
          : 'Proposicao nao esta em regime normal',
        tipoCondicao
      }

    case 'CAMPO_PERSONALIZADO':
      return avaliarCondicaoPersonalizada(etapa, proposicao)

    default:
      // Tipo de condicao desconhecido, assume que deve executar
      logger.warn('Tipo de condicao desconhecido', { tipoCondicao, etapaId: etapa.id })
      return {
        deveExecutar: true,
        motivo: `Tipo de condicao nao reconhecido: ${tipoCondicao}`,
        tipoCondicao
      }
  }
}

/**
 * Avalia uma condicao personalizada baseada em campo especifico
 */
function avaliarCondicaoPersonalizada(
  etapa: FluxoTramitacaoEtapa,
  proposicao: DadosProposicaoParaCondicao
): ResultadoAvaliacaoCondicao {
  const config = etapa.condicaoConfig as {
    campo?: string
    operador?: 'igual' | 'diferente' | 'contem' | 'vazio' | 'nao_vazio'
    valor?: string
  } | null

  if (!config || !config.campo) {
    logger.warn('Condicao personalizada sem configuracao', { etapaId: etapa.id })
    return {
      deveExecutar: true,
      motivo: 'Condicao personalizada sem configuracao valida',
      tipoCondicao: 'CAMPO_PERSONALIZADO'
    }
  }

  const { campo, operador, valor } = config

  // Busca o valor do campo na proposicao
  const valorCampo = proposicao.camposExtras?.[campo]
  const valorCampoString = valorCampo !== undefined && valorCampo !== null
    ? String(valorCampo)
    : ''

  let resultado = false
  let motivo = ''

  switch (operador) {
    case 'igual':
      resultado = valorCampoString === valor
      motivo = resultado
        ? `Campo "${campo}" igual a "${valor}"`
        : `Campo "${campo}" diferente de "${valor}"`
      break

    case 'diferente':
      resultado = valorCampoString !== valor
      motivo = resultado
        ? `Campo "${campo}" diferente de "${valor}"`
        : `Campo "${campo}" igual a "${valor}"`
      break

    case 'contem':
      resultado = valorCampoString.toLowerCase().includes((valor || '').toLowerCase())
      motivo = resultado
        ? `Campo "${campo}" contem "${valor}"`
        : `Campo "${campo}" nao contem "${valor}"`
      break

    case 'vazio':
      resultado = valorCampoString === '' || valorCampo === null || valorCampo === undefined
      motivo = resultado
        ? `Campo "${campo}" esta vazio`
        : `Campo "${campo}" nao esta vazio`
      break

    case 'nao_vazio':
      resultado = valorCampoString !== '' && valorCampo !== null && valorCampo !== undefined
      motivo = resultado
        ? `Campo "${campo}" nao esta vazio`
        : `Campo "${campo}" esta vazio`
      break

    default:
      resultado = true
      motivo = `Operador desconhecido: ${operador}`
  }

  return {
    deveExecutar: resultado,
    motivo,
    tipoCondicao: 'CAMPO_PERSONALIZADO'
  }
}

/**
 * Filtra as etapas de um fluxo, retornando apenas as que devem ser executadas
 * para uma proposicao especifica
 */
export function filtrarEtapasExecutaveis(
  etapas: FluxoTramitacaoEtapa[],
  proposicao: DadosProposicaoParaCondicao
): { etapa: FluxoTramitacaoEtapa; avaliacao: ResultadoAvaliacaoCondicao }[] {
  return etapas
    .map(etapa => ({
      etapa,
      avaliacao: avaliarCondicaoEtapa(etapa, proposicao)
    }))
    .filter(({ avaliacao }) => avaliacao.deveExecutar)
}

/**
 * Determina a proxima etapa executavel a partir da etapa atual
 */
export function determinarProximaEtapaExecutavel(
  etapas: FluxoTramitacaoEtapa[],
  proposicao: DadosProposicaoParaCondicao,
  ordemAtual: number
): FluxoTramitacaoEtapa | null {
  // Ordena etapas por ordem
  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem)

  // Filtra etapas posteriores a atual
  const etapasPosteriores = etapasOrdenadas.filter(e => e.ordem > ordemAtual)

  // Encontra a primeira etapa executavel
  for (const etapa of etapasPosteriores) {
    const avaliacao = avaliarCondicaoEtapa(etapa, proposicao)
    if (avaliacao.deveExecutar) {
      logger.info('Proxima etapa executavel determinada', {
        etapaAtual: ordemAtual,
        proximaEtapa: etapa.ordem,
        nomeEtapa: etapa.nome,
        motivo: avaliacao.motivo
      })
      return etapa
    }
  }

  return null
}

/**
 * Gera um resumo do fluxo para uma proposicao, indicando quais etapas serao executadas
 */
export function gerarResumoFluxoProposicao(
  etapas: FluxoTramitacaoEtapa[],
  proposicao: DadosProposicaoParaCondicao
): {
  etapa: FluxoTramitacaoEtapa
  executar: boolean
  motivo: string
}[] {
  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem)

  return etapasOrdenadas.map(etapa => {
    const avaliacao = avaliarCondicaoEtapa(etapa, proposicao)
    return {
      etapa,
      executar: avaliacao.deveExecutar,
      motivo: avaliacao.motivo
    }
  })
}
