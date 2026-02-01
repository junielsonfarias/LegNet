/**
 * Servico de Fluxo de Tramitacao Configuravel
 * Gerencia fluxos de tramitacao por tipo de proposicao
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type { FluxoTramitacao, FluxoTramitacaoEtapa, TipoCondicaoEtapa } from '@prisma/client'

const logger = createLogger('fluxo-tramitacao')

// Tipo para fluxo com etapas incluidas
export type FluxoTramitacaoComEtapas = FluxoTramitacao & {
  etapas: (FluxoTramitacaoEtapa & {
    unidade?: { id: string; nome: string; sigla: string | null } | null
  })[]
}

// Resultado de verificacao de elegibilidade para pauta
export interface ElegibilidadePautaResult {
  elegivel: boolean
  etapaAtual?: FluxoTramitacaoEtapa | null
  motivo?: string
  mensagem: string
}

/**
 * Busca o fluxo configurado para um tipo de proposicao
 */
export async function getFluxoByTipoProposicao(
  tipo: string
): Promise<FluxoTramitacaoComEtapas | null> {
  const fluxo = await prisma.fluxoTramitacao.findUnique({
    where: { tipoProposicao: tipo },
    include: {
      etapas: {
        orderBy: { ordem: 'asc' },
        include: {
          unidade: {
            select: { id: true, nome: true, sigla: true }
          }
        }
      }
    }
  })

  return fluxo
}

/**
 * Busca a proxima etapa de um fluxo a partir da ordem atual
 */
export async function getProximaEtapa(
  fluxoId: string,
  ordemAtual: number
): Promise<FluxoTramitacaoEtapa | null> {
  const proximaEtapa = await prisma.fluxoTramitacaoEtapa.findFirst({
    where: {
      fluxoId,
      ordem: { gt: ordemAtual }
    },
    orderBy: { ordem: 'asc' },
    include: {
      unidade: {
        select: { id: true, nome: true, sigla: true }
      }
    }
  })

  return proximaEtapa
}

/**
 * Busca a etapa inicial de um fluxo
 */
export async function getEtapaInicial(
  fluxoId: string
): Promise<FluxoTramitacaoEtapa | null> {
  const etapa = await prisma.fluxoTramitacaoEtapa.findFirst({
    where: { fluxoId },
    orderBy: { ordem: 'asc' },
    include: {
      unidade: {
        select: { id: true, nome: true, sigla: true }
      }
    }
  })

  return etapa
}

/**
 * Verifica se uma proposicao esta elegivel para inclusao na pauta
 * Baseado na etapa atual do fluxo de tramitacao
 */
export async function verificarElegibilidadePauta(
  proposicaoId: string
): Promise<ElegibilidadePautaResult> {
  // Busca a proposicao com sua tramitacao atual
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: {
      id: true,
      tipo: true,
      status: true,
      tramitacoes: {
        where: { status: 'EM_ANDAMENTO' },
        orderBy: { dataEntrada: 'desc' },
        take: 1,
        include: {
          fluxoEtapa: true,
          tipoTramitacao: true
        }
      }
    }
  })

  if (!proposicao) {
    return {
      elegivel: false,
      motivo: 'PROPOSICAO_NAO_ENCONTRADA',
      mensagem: 'Proposicao nao encontrada'
    }
  }

  // Tipos que nao precisam de tramitacao completa para ir para pauta
  const tiposSemTramitacao = ['VOTO_PESAR', 'VOTO_APLAUSO', 'INDICACAO']
  if (tiposSemTramitacao.includes(proposicao.tipo)) {
    return {
      elegivel: true,
      mensagem: 'Este tipo de proposicao nao requer tramitacao completa para inclusao na pauta'
    }
  }

  // Verifica se ha tramitacao em andamento
  const tramitacaoAtual = proposicao.tramitacoes[0]
  if (!tramitacaoAtual) {
    return {
      elegivel: false,
      motivo: 'SEM_TRAMITACAO',
      mensagem: 'Proposicao nao possui tramitacao em andamento. Inicie a tramitacao primeiro.'
    }
  }

  // Se tem fluxoEtapa vinculado, usa essa verificacao
  if (tramitacaoAtual.fluxoEtapa) {
    const etapa = tramitacaoAtual.fluxoEtapa

    if (etapa.habilitaPauta) {
      return {
        elegivel: true,
        etapaAtual: etapa,
        mensagem: `Proposicao na etapa "${etapa.nome}" - elegivel para inclusao na pauta`
      }
    } else {
      return {
        elegivel: false,
        etapaAtual: etapa,
        motivo: 'ETAPA_NAO_HABILITA_PAUTA',
        mensagem: `Proposicao na etapa "${etapa.nome}" - ainda nao pode ser incluida na pauta. ` +
          `Avance para a etapa que habilita a inclusao na pauta.`
      }
    }
  }

  // Fallback: verifica por nome do tipo de tramitacao (compatibilidade)
  const nomeAtual = tramitacaoAtual.tipoTramitacao?.nome?.toLowerCase() || ''
  if (nomeAtual.includes('plenario') || nomeAtual.includes('plenário')) {
    return {
      elegivel: true,
      mensagem: 'Proposicao encaminhada para Plenario - elegivel para inclusao na pauta'
    }
  }

  return {
    elegivel: false,
    motivo: 'TRAMITACAO_INCOMPLETA',
    mensagem: `Proposicao deve estar encaminhada para Plenario para ser incluida na pauta. ` +
      `Status atual: "${tramitacaoAtual.tipoTramitacao?.nome || 'Desconhecido'}".`
  }
}

/**
 * Lista todas as proposicoes elegiveis para inclusao na pauta
 */
export async function listarProposicoesElegiveisPauta(): Promise<{
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa: string
  etapaAtual?: string
}[]> {
  // Busca proposicoes que estao em tramitacao e na etapa que habilita pauta
  const proposicoes = await prisma.proposicao.findMany({
    where: {
      status: {
        in: ['EM_TRAMITACAO', 'AGUARDANDO_PAUTA']
      }
    },
    select: {
      id: true,
      numero: true,
      ano: true,
      tipo: true,
      titulo: true,
      ementa: true,
      tramitacoes: {
        where: { status: 'EM_ANDAMENTO' },
        orderBy: { dataEntrada: 'desc' },
        take: 1,
        include: {
          fluxoEtapa: true,
          tipoTramitacao: true
        }
      }
    }
  })

  const elegiveis: Array<{
    id: string
    numero: string
    ano: number
    tipo: string
    titulo: string
    ementa: string
    etapaAtual: string
  }> = []

  for (const prop of proposicoes) {
    const elegibilidade = await verificarElegibilidadePauta(prop.id)

    if (elegibilidade.elegivel) {
      elegiveis.push({
        id: prop.id,
        numero: prop.numero,
        ano: prop.ano,
        tipo: prop.tipo,
        titulo: prop.titulo,
        ementa: prop.ementa,
        etapaAtual: prop.tramitacoes[0]?.fluxoEtapa?.nome ||
                    prop.tramitacoes[0]?.tipoTramitacao?.nome ||
                    'Nao definida'
      })
    }
  }

  return elegiveis
}

/**
 * Calcula o prazo de vencimento baseado no regime de tramitacao
 */
export function calcularPrazoVencimento(
  dataInicio: Date,
  prazoDias: number,
  regime: 'NORMAL' | 'PRIORIDADE' | 'URGENCIA' | 'URGENCIA_URGENTISSIMA' = 'NORMAL'
): Date {
  // Busca configuracoes de prazo ou usa padrao
  const multiplicadores: Record<string, number> = {
    'NORMAL': 1,
    'PRIORIDADE': 0.67, // 10/15
    'URGENCIA': 0.33,   // 5/15
    'URGENCIA_URGENTISSIMA': 0
  }

  const multiplicador = multiplicadores[regime] || 1
  const prazosAjustados = Math.ceil(prazoDias * multiplicador)

  const dataVencimento = new Date(dataInicio)
  dataVencimento.setDate(dataVencimento.getDate() + prazosAjustados)

  return dataVencimento
}

/**
 * Cria os fluxos padrao para todos os tipos de proposicao
 */
export async function criarFluxosPadrao(): Promise<void> {
  logger.info('Iniciando criacao de fluxos padrao')

  // Busca unidades existentes
  const unidades = await prisma.tramitacaoUnidade.findMany({
    where: { ativo: true }
  })

  const mesaDiretora = unidades.find(u => u.tipo === 'MESA_DIRETORA')
  const plenario = unidades.find(u => u.tipo === 'PLENARIO')
  const clj = unidades.find(u => u.sigla === 'CLJ' || u.nome.includes('Legislação'))
  const cfo = unidades.find(u => u.sigla === 'CFO' || u.nome.includes('Finanças'))

  // Define fluxos por tipo de proposicao
  const fluxosConfig = [
    {
      tipo: 'PROJETO_LEI' ,
      nome: 'Fluxo Projeto de Lei',
      descricao: 'Tramitacao padrao para Projetos de Lei',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeId: mesaDiretora?.id, prazoDias: 2, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Analise na CLJ', unidadeId: clj?.id, prazoDias: 15, requerParecer: true, habilitaPauta: false },
        { ordem: 3, nome: 'Analise na CFO (se houver despesa)', unidadeId: cfo?.id, prazoDias: 15, requerParecer: true, habilitaPauta: false },
        { ordem: 4, nome: 'Encaminhado para Plenario', unidadeId: plenario?.id, prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'PROJETO_RESOLUCAO' ,
      nome: 'Fluxo Projeto de Resolucao',
      descricao: 'Tramitacao padrao para Projetos de Resolucao',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeId: mesaDiretora?.id, prazoDias: 2, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Analise na CLJ', unidadeId: clj?.id, prazoDias: 15, requerParecer: true, habilitaPauta: false },
        { ordem: 3, nome: 'Encaminhado para Plenario', unidadeId: plenario?.id, prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'PROJETO_DECRETO' ,
      nome: 'Fluxo Projeto de Decreto Legislativo',
      descricao: 'Tramitacao padrao para Projetos de Decreto Legislativo',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeId: mesaDiretora?.id, prazoDias: 2, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Analise na CLJ', unidadeId: clj?.id, prazoDias: 15, requerParecer: true, habilitaPauta: false },
        { ordem: 3, nome: 'Encaminhado para Plenario', unidadeId: plenario?.id, prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'REQUERIMENTO' ,
      nome: 'Fluxo Requerimento',
      descricao: 'Tramitacao simplificada para Requerimentos',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeId: mesaDiretora?.id, prazoDias: 1, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Encaminhado para Plenario', unidadeId: plenario?.id, prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'INDICACAO' ,
      nome: 'Fluxo Indicacao',
      descricao: 'Tramitacao para Indicacoes (sem votacao)',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeId: mesaDiretora?.id, prazoDias: 1, requerParecer: false, habilitaPauta: true },
        { ordem: 2, nome: 'Leitura em Expediente', unidadeId: plenario?.id, prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'MOCAO' ,
      nome: 'Fluxo Mocao',
      descricao: 'Tramitacao para Mocoes',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeId: mesaDiretora?.id, prazoDias: 1, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Encaminhado para Plenario', unidadeId: plenario?.id, prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'VOTO_PESAR' ,
      nome: 'Fluxo Voto de Pesar',
      descricao: 'Tramitacao simplificada para Votos de Pesar',
      etapas: [
        { ordem: 1, nome: 'Protocolo e Leitura', unidadeId: mesaDiretora?.id, prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'VOTO_APLAUSO' ,
      nome: 'Fluxo Voto de Aplauso',
      descricao: 'Tramitacao simplificada para Votos de Aplauso',
      etapas: [
        { ordem: 1, nome: 'Protocolo e Leitura', unidadeId: mesaDiretora?.id, prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    }
  ]

  for (const fluxoConfig of fluxosConfig) {
    // Verifica se ja existe
    const existente = await prisma.fluxoTramitacao.findUnique({
      where: { tipoProposicao: fluxoConfig.tipo }
    })

    if (existente) {
      logger.info(`Fluxo para ${fluxoConfig.tipo} ja existe, pulando`)
      continue
    }

    // Cria o fluxo com suas etapas
    await prisma.fluxoTramitacao.create({
      data: {
        tipoProposicao: fluxoConfig.tipo,
        nome: fluxoConfig.nome,
        descricao: fluxoConfig.descricao,
        ativo: true,
        etapas: {
          create: fluxoConfig.etapas.map(etapa => ({
            ordem: etapa.ordem,
            nome: etapa.nome,
            unidadeId: etapa.unidadeId || null,
            prazoDiasNormal: etapa.prazoDias,
            requerParecer: etapa.requerParecer,
            habilitaPauta: etapa.habilitaPauta,
            ehEtapaFinal: etapa.ehEtapaFinal || false
          }))
        }
      }
    })

    logger.info(`Fluxo criado para ${fluxoConfig.tipo}`)
  }

  logger.info('Criacao de fluxos padrao concluida')
}

/**
 * Lista todos os fluxos de tramitacao
 */
export async function listarFluxos(): Promise<FluxoTramitacaoComEtapas[]> {
  const fluxos = await prisma.fluxoTramitacao.findMany({
    include: {
      etapas: {
        orderBy: { ordem: 'asc' },
        include: {
          unidade: {
            select: { id: true, nome: true, sigla: true }
          }
        }
      }
    },
    orderBy: { tipoProposicao: 'asc' }
  })

  return fluxos
}

/**
 * Atualiza um fluxo de tramitacao
 */
export async function atualizarFluxo(
  id: string,
  dados: {
    nome?: string
    descricao?: string
    ativo?: boolean
  }
): Promise<FluxoTramitacao> {
  const fluxo = await prisma.fluxoTramitacao.update({
    where: { id },
    data: dados
  })

  logger.info('Fluxo atualizado', { fluxoId: id, dados })
  return fluxo
}

/**
 * Adiciona uma etapa a um fluxo
 */
export async function adicionarEtapa(
  fluxoId: string,
  dados: {
    nome: string
    descricao?: string
    unidadeId?: string
    prazoDiasNormal?: number
    prazoDiasUrgencia?: number
    requerParecer?: boolean
    habilitaPauta?: boolean
    ehEtapaFinal?: boolean
    condicional?: boolean
    tipoCondicao?: string | null
    condicaoConfig?: Record<string, unknown> | null
  }
): Promise<FluxoTramitacaoEtapa> {
  // Busca a maior ordem atual
  const maiorOrdem = await prisma.fluxoTramitacaoEtapa.findFirst({
    where: { fluxoId },
    orderBy: { ordem: 'desc' },
    select: { ordem: true }
  })

  const novaOrdem = (maiorOrdem?.ordem || 0) + 1

  const etapa = await prisma.fluxoTramitacaoEtapa.create({
    data: {
      fluxoId,
      ordem: novaOrdem,
      nome: dados.nome,
      descricao: dados.descricao,
      unidadeId: dados.unidadeId,
      prazoDiasNormal: dados.prazoDiasNormal || 15,
      prazoDiasUrgencia: dados.prazoDiasUrgencia,
      requerParecer: dados.requerParecer || false,
      habilitaPauta: dados.habilitaPauta || false,
      ehEtapaFinal: dados.ehEtapaFinal || false,
      condicional: dados.condicional || false,
      tipoCondicao: dados.tipoCondicao as TipoCondicaoEtapa | null,
      condicaoConfig: dados.condicaoConfig ? JSON.parse(JSON.stringify(dados.condicaoConfig)) : undefined
    }
  })

  logger.info('Etapa adicionada ao fluxo', { fluxoId, etapaId: etapa.id })
  return etapa
}

/**
 * Atualiza uma etapa de fluxo
 */
export async function atualizarEtapa(
  id: string,
  dados: {
    nome?: string
    descricao?: string
    unidadeId?: string | null
    prazoDiasNormal?: number
    prazoDiasUrgencia?: number | null
    requerParecer?: boolean
    habilitaPauta?: boolean
    ehEtapaFinal?: boolean
    condicional?: boolean
    tipoCondicao?: string | null
    condicaoConfig?: Record<string, unknown> | null
  }
): Promise<FluxoTramitacaoEtapa> {
  // Prepara os dados para atualizacao
  const updateData: Record<string, unknown> = { ...dados }

  // Converte tipoCondicao para o tipo correto do Prisma
  if ('tipoCondicao' in dados) {
    updateData.tipoCondicao = dados.tipoCondicao as TipoCondicaoEtapa | null
  }

  const etapa = await prisma.fluxoTramitacaoEtapa.update({
    where: { id },
    data: updateData
  })

  logger.info('Etapa atualizada', { etapaId: id, dados })
  return etapa
}

/**
 * Remove uma etapa de fluxo
 */
export async function removerEtapa(id: string): Promise<void> {
  const etapa = await prisma.fluxoTramitacaoEtapa.findUnique({
    where: { id },
    select: { fluxoId: true, ordem: true }
  })

  if (!etapa) {
    throw new Error('Etapa nao encontrada')
  }

  // Remove a etapa
  await prisma.fluxoTramitacaoEtapa.delete({
    where: { id }
  })

  // Reordena as etapas restantes
  await prisma.fluxoTramitacaoEtapa.updateMany({
    where: {
      fluxoId: etapa.fluxoId,
      ordem: { gt: etapa.ordem }
    },
    data: {
      ordem: { decrement: 1 }
    }
  })

  logger.info('Etapa removida e reordenada', { etapaId: id, fluxoId: etapa.fluxoId })
}

/**
 * Reordena etapas de um fluxo
 */
export async function reordenarEtapas(
  fluxoId: string,
  novaOrdem: string[] // Array de IDs das etapas na nova ordem
): Promise<void> {
  for (let i = 0; i < novaOrdem.length; i++) {
    await prisma.fluxoTramitacaoEtapa.update({
      where: { id: novaOrdem[i] },
      data: { ordem: i + 1 }
    })
  }

  logger.info('Etapas reordenadas', { fluxoId, novaOrdem })
}
