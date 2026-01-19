/**
 * Serviço de Automação de Pautas
 * Implementa MEL-001: Geração automática de pautas
 *
 * Funcionalidades:
 * - Geração automática de pauta baseada em critérios
 * - Ordenação por prioridade/urgência
 * - Validação de regras regimentais
 * - Sugestão de proposições elegíveis
 * - Cálculo de tempo estimado
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { addBusinessDays, differenceInDays } from '@/lib/utils/date'

const logger = createLogger('automacao-pautas')

// Prioridades de ordenação (menor número = maior prioridade)
export const PRIORIDADE_ORDENACAO = {
  VETO_PRAZO_VENCENDO: 1,
  URGENCIA_URGENTISSIMA: 2,
  URGENCIA: 3,
  PRIORIDADE: 4,
  SEGUNDA_VOTACAO: 5,
  PRIMEIRA_VOTACAO: 6,
  ORDEM_CRONOLOGICA: 7
} as const

// Tipos de urgência
export type TipoUrgencia = 'NORMAL' | 'URGENCIA' | 'URGENCIA_URGENTISSIMA'

// Status de elegibilidade
export interface ElegibilidadeResult {
  elegivel: boolean
  motivos: string[]
  avisos: string[]
  prioridade: number
}

// Item sugerido para pauta
export interface ItemSugeridoPauta {
  proposicaoId: string
  numero: string
  tipo: string
  ementa: string
  autor: string
  prioridade: number
  motivoPrioridade: string
  tempoEstimadoMinutos: number
  elegibilidade: ElegibilidadeResult
}

// Resultado da geração de pauta
export interface PautaGeradaResult {
  sessaoId: string
  dataSessao: Date
  itensSugeridos: ItemSugeridoPauta[]
  tempoTotalEstimado: number
  avisos: string[]
  estatisticas: {
    totalElegiveis: number
    totalSugeridos: number
    porTipo: Record<string, number>
    porPrioridade: Record<string, number>
  }
}

// Configuração de geração de pauta
export interface ConfiguracaoPauta {
  maxItens?: number
  tempoMaximoMinutos?: number
  incluirVetosVencendo?: boolean
  incluirUrgencias?: boolean
  tiposPermitidos?: string[]
  excluirTipos?: string[]
}

// Tempos médios por tipo de proposição (em minutos)
// Tipos válidos: PROJETO_LEI, PROJETO_RESOLUCAO, PROJETO_DECRETO,
// INDICACAO, REQUERIMENTO, MOCAO, VOTO_PESAR, VOTO_APLAUSO
const TEMPOS_MEDIOS: Record<string, number> = {
  PROJETO_LEI: 15,
  PROJETO_RESOLUCAO: 10,
  PROJETO_DECRETO: 10,
  REQUERIMENTO: 5,
  MOCAO: 5,
  INDICACAO: 5,
  VOTO_PESAR: 3,
  VOTO_APLAUSO: 3,
  DEFAULT: 10
}

/**
 * Verifica se proposição está elegível para pauta
 */
export async function verificarElegibilidade(
  proposicaoId: string
): Promise<ElegibilidadeResult> {
  const motivos: string[] = []
  const avisos: string[] = []
  let prioridade: number = PRIORIDADE_ORDENACAO.ORDEM_CRONOLOGICA

  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    include: {
      tramitacoes: {
        orderBy: { createdAt: 'desc' },
        include: {
          unidade: { select: { tipo: true, nome: true } }
        }
      },
      autor: {
        select: { nome: true }
      }
    }
  })

  if (!proposicao) {
    return {
      elegivel: false,
      motivos: ['Proposição não encontrada'],
      avisos: [],
      prioridade: 999
    }
  }

  // Verifica status
  if (proposicao.status !== 'EM_TRAMITACAO') {
    motivos.push(`Status atual (${proposicao.status}) não permite inclusão em pauta`)
  }

  // Verifica se passou pela CLJ (para projetos de lei e resolução)
  const tiposQuePrecisamCLJ = [
    'PROJETO_LEI',
    'PROJETO_RESOLUCAO',
    'PROJETO_DECRETO'
  ]

  if (tiposQuePrecisamCLJ.includes(proposicao.tipo)) {
    const passouCLJ = proposicao.tramitacoes.some(t =>
      t.unidade?.tipo === 'COMISSAO' &&
      t.parecer !== null
    )

    if (!passouCLJ) {
      motivos.push('Proposição não passou pela Comissão de Legislação e Justiça')
    }
  }

  // Verifica prazo de tramitação (proposições antigas têm prioridade)
  const dataApresentacao = new Date(proposicao.dataApresentacao)
  const diasEmTramitacao = differenceInDays(new Date(), dataApresentacao)

  if (diasEmTramitacao > 90) {
    prioridade = PRIORIDADE_ORDENACAO.PRIORIDADE
    avisos.push(`Proposição em tramitação há ${diasEmTramitacao} dias - prioridade aumentada`)
  }

  return {
    elegivel: motivos.length === 0,
    motivos,
    avisos,
    prioridade
  }
}

/**
 * Busca proposições elegíveis para pauta
 */
export async function buscarProposicoesElegiveis(
  config: ConfiguracaoPauta = {}
): Promise<ItemSugeridoPauta[]> {
  const {
    maxItens = 20,
    tiposPermitidos,
    excluirTipos = []
  } = config

  // Busca proposições em tramitação
  const proposicoes = await prisma.proposicao.findMany({
    where: {
      status: 'EM_TRAMITACAO'
    },
    include: {
      autor: {
        select: { nome: true }
      },
      tramitacoes: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: [
      { dataApresentacao: 'asc' }
    ],
    take: maxItens * 2 // Busca mais para filtrar elegíveis
  })

  const itensSugeridos: ItemSugeridoPauta[] = []

  for (const prop of proposicoes) {
    const elegibilidade = await verificarElegibilidade(prop.id)

    if (elegibilidade.elegivel) {
      itensSugeridos.push({
        proposicaoId: prop.id,
        numero: prop.numero,
        tipo: prop.tipo,
        ementa: prop.ementa,
        autor: prop.autor?.nome || 'Não informado',
        prioridade: elegibilidade.prioridade,
        motivoPrioridade: getMotivosPrioridade(elegibilidade.prioridade),
        tempoEstimadoMinutos: TEMPOS_MEDIOS[prop.tipo] || TEMPOS_MEDIOS.DEFAULT,
        elegibilidade
      })
    }
  }

  // Ordena por prioridade
  itensSugeridos.sort((a, b) => a.prioridade - b.prioridade)

  // Limita ao máximo de itens
  return itensSugeridos.slice(0, maxItens)
}

/**
 * Gera pauta automaticamente para uma sessão
 */
export async function gerarPautaAutomatica(
  sessaoId: string,
  config: ConfiguracaoPauta = {}
): Promise<PautaGeradaResult> {
  const {
    maxItens = 15,
    tempoMaximoMinutos = 180, // 3 horas
    incluirVetosVencendo = true,
    incluirUrgencias = true
  } = config

  const avisos: string[] = []

  // Busca sessão
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) {
    throw new Error('Sessão não encontrada')
  }

  // Busca proposições elegíveis
  let itensSugeridos = await buscarProposicoesElegiveis({
    ...config,
    maxItens: maxItens * 2
  })

  // Filtra por tempo máximo
  let tempoAcumulado = 0
  const tempoFixo = 20 // Abertura, chamada, formalidades
  tempoAcumulado += tempoFixo

  const itensFiltrados: ItemSugeridoPauta[] = []

  for (const item of itensSugeridos) {
    if (tempoAcumulado + item.tempoEstimadoMinutos <= tempoMaximoMinutos) {
      itensFiltrados.push(item)
      tempoAcumulado += item.tempoEstimadoMinutos
    } else if (item.prioridade <= PRIORIDADE_ORDENACAO.URGENCIA) {
      // Itens urgentes sempre entram
      itensFiltrados.push(item)
      tempoAcumulado += item.tempoEstimadoMinutos
      avisos.push(`Item urgente "${item.numero}" incluído mesmo excedendo tempo previsto`)
    }
  }

  // Adiciona tempo de encerramento
  tempoAcumulado += 5

  // Estatísticas
  const porTipo: Record<string, number> = {}
  const porPrioridade: Record<string, number> = {}

  for (const item of itensFiltrados) {
    porTipo[item.tipo] = (porTipo[item.tipo] || 0) + 1
    const nomePrioridade = getMotivosPrioridade(item.prioridade)
    porPrioridade[nomePrioridade] = (porPrioridade[nomePrioridade] || 0) + 1
  }

  // Verifica vetos vencendo
  if (incluirVetosVencendo) {
    const vetosNaPauta = itensFiltrados.filter(
      i => i.tipo === 'APRECIACAO_VETO' && i.prioridade === PRIORIDADE_ORDENACAO.VETO_PRAZO_VENCENDO
    )
    if (vetosNaPauta.length > 0) {
      avisos.push(`${vetosNaPauta.length} veto(s) com prazo vencendo na pauta`)
    }
  }

  // Aviso de tempo
  if (tempoAcumulado > tempoMaximoMinutos) {
    avisos.push(`Tempo estimado (${tempoAcumulado} min) excede limite configurado (${tempoMaximoMinutos} min)`)
  }

  logger.info('Pauta gerada automaticamente', {
    action: 'gerar_pauta_automatica',
    sessaoId,
    totalItens: itensFiltrados.length,
    tempoEstimado: tempoAcumulado
  })

  return {
    sessaoId,
    dataSessao: sessao.data,
    itensSugeridos: itensFiltrados,
    tempoTotalEstimado: tempoAcumulado,
    avisos,
    estatisticas: {
      totalElegiveis: itensSugeridos.length,
      totalSugeridos: itensFiltrados.length,
      porTipo,
      porPrioridade
    }
  }
}

/**
 * Cria pauta no banco de dados a partir da sugestão
 */
export async function criarPautaDoSugerido(
  sessaoId: string,
  itensSugeridos: ItemSugeridoPauta[]
): Promise<{ pautaId: string; itensAdicionados: number }> {
  // Verifica se já existe pauta para a sessão
  let pauta = await prisma.pautaSessao.findFirst({
    where: { sessaoId }
  })

  if (!pauta) {
    pauta = await prisma.pautaSessao.create({
      data: {
        sessaoId,
        status: 'RASCUNHO'
      }
    })
  }

  // Adiciona itens
  let ordem = 1
  for (const item of itensSugeridos) {
    await prisma.pautaItem.create({
      data: {
        pautaId: pauta.id,
        proposicaoId: item.proposicaoId,
        titulo: `${item.tipo} ${item.numero}`,
        descricao: item.ementa,
        secao: 'ORDEM_DO_DIA',
        ordem: ordem++,
        status: 'PENDENTE'
      }
    })
  }

  logger.info('Pauta criada do sugerido', {
    action: 'criar_pauta_sugerido',
    sessaoId,
    pautaId: pauta.id,
    itensAdicionados: itensSugeridos.length
  })

  return {
    pautaId: pauta.id,
    itensAdicionados: itensSugeridos.length
  }
}

/**
 * Calcula tempo estimado para uma pauta existente
 */
export async function calcularTempoEstimadoPauta(
  pautaId: string
): Promise<{
  tempoTotal: number
  detalhamento: Array<{ item: string; tempo: number }>
}> {
  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      itens: {
        include: {
          proposicao: true
        },
        orderBy: { ordem: 'asc' }
      }
    }
  })

  if (!pauta) {
    return { tempoTotal: 0, detalhamento: [] }
  }

  const detalhamento: Array<{ item: string; tempo: number }> = []
  let tempoTotal = 0

  // Tempo de abertura
  detalhamento.push({ item: 'Abertura e formalidades', tempo: 15 })
  tempoTotal += 15

  // Tempo de cada item
  for (const item of pauta.itens) {
    const tipo = item.proposicao?.tipo || 'DEFAULT'
    const tempo = TEMPOS_MEDIOS[tipo] || TEMPOS_MEDIOS.DEFAULT

    detalhamento.push({
      item: item.titulo || `Item ${item.ordem}`,
      tempo
    })
    tempoTotal += tempo
  }

  // Tempo de encerramento
  detalhamento.push({ item: 'Encerramento', tempo: 5 })
  tempoTotal += 5

  return { tempoTotal, detalhamento }
}

/**
 * Reordena itens da pauta por prioridade
 */
export async function reordenarPautaPorPrioridade(
  pautaId: string
): Promise<{ sucesso: boolean; novaOrdem: string[] }> {
  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      itens: {
        include: {
          proposicao: true
        }
      }
    }
  })

  if (!pauta) {
    return { sucesso: false, novaOrdem: [] }
  }

  // Calcula prioridade de cada item
  const itensComPrioridade = await Promise.all(
    pauta.itens.map(async item => {
      if (item.proposicaoId) {
        const elegibilidade = await verificarElegibilidade(item.proposicaoId)
        return { item, prioridade: elegibilidade.prioridade }
      }
      return { item, prioridade: PRIORIDADE_ORDENACAO.ORDEM_CRONOLOGICA }
    })
  )

  // Ordena por prioridade
  itensComPrioridade.sort((a, b) => a.prioridade - b.prioridade)

  // Atualiza ordem no banco
  const novaOrdem: string[] = []
  let ordem = 1

  for (const { item } of itensComPrioridade) {
    await prisma.pautaItem.update({
      where: { id: item.id },
      data: { ordem }
    })
    novaOrdem.push(item.id)
    ordem++
  }

  logger.info('Pauta reordenada por prioridade', {
    action: 'reordenar_pauta',
    pautaId,
    totalItens: novaOrdem.length
  })

  return { sucesso: true, novaOrdem }
}

/**
 * Valida pauta antes de publicação
 */
export async function validarPautaParaPublicacao(
  pautaId: string
): Promise<{
  valida: boolean
  erros: string[]
  avisos: string[]
}> {
  const erros: string[] = []
  const avisos: string[] = []

  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      sessao: true,
      itens: {
        include: {
          proposicao: true
        }
      }
    }
  })

  if (!pauta) {
    return { valida: false, erros: ['Pauta não encontrada'], avisos: [] }
  }

  // Verifica se sessão existe e está em status válido
  if (!pauta.sessao) {
    erros.push('Sessão associada não encontrada')
  } else if (!['AGENDADA', 'CONVOCADA'].includes(pauta.sessao.status)) {
    erros.push(`Sessão em status inválido para publicação de pauta: ${pauta.sessao.status}`)
  }

  // Verifica se tem itens
  if (pauta.itens.length === 0) {
    erros.push('Pauta não possui itens')
  }

  // Verifica elegibilidade de cada item
  for (const item of pauta.itens) {
    if (item.proposicaoId) {
      const elegibilidade = await verificarElegibilidade(item.proposicaoId)
      if (!elegibilidade.elegivel) {
        erros.push(`Item "${item.titulo}": ${elegibilidade.motivos.join(', ')}`)
      }
      if (elegibilidade.avisos.length > 0) {
        avisos.push(...elegibilidade.avisos.map(a => `${item.titulo}: ${a}`))
      }
    }
  }

  // Verifica antecedência mínima (48h)
  if (pauta.sessao) {
    const agora = new Date()
    const dataSessao = new Date(pauta.sessao.data)
    const horasAntecedencia = (dataSessao.getTime() - agora.getTime()) / (1000 * 60 * 60)

    if (horasAntecedencia < 48) {
      avisos.push(
        `Pauta sendo publicada com menos de 48h de antecedência (${Math.round(horasAntecedencia)}h). ` +
        'Recomenda-se publicação com 48h de antecedência conforme PNTP.'
      )
    }
  }

  return {
    valida: erros.length === 0,
    erros,
    avisos
  }
}

/**
 * Publica pauta (muda status e notifica)
 */
export async function publicarPauta(
  pautaId: string
): Promise<{ sucesso: boolean; mensagem: string }> {
  const validacao = await validarPautaParaPublicacao(pautaId)

  if (!validacao.valida) {
    return {
      sucesso: false,
      mensagem: `Pauta inválida: ${validacao.erros.join('; ')}`
    }
  }

  await prisma.pautaSessao.update({
    where: { id: pautaId },
    data: {
      status: 'APROVADA'
    }
  })

  logger.info('Pauta publicada', {
    action: 'publicar_pauta',
    pautaId
  })

  return {
    sucesso: true,
    mensagem: validacao.avisos.length > 0
      ? `Pauta publicada com avisos: ${validacao.avisos.join('; ')}`
      : 'Pauta publicada com sucesso'
  }
}

/**
 * Helper: Retorna nome da prioridade
 */
function getMotivosPrioridade(prioridade: number): string {
  switch (prioridade) {
    case PRIORIDADE_ORDENACAO.VETO_PRAZO_VENCENDO:
      return 'Veto com prazo vencendo'
    case PRIORIDADE_ORDENACAO.URGENCIA_URGENTISSIMA:
      return 'Urgência urgentíssima'
    case PRIORIDADE_ORDENACAO.URGENCIA:
      return 'Urgência'
    case PRIORIDADE_ORDENACAO.PRIORIDADE:
      return 'Prioridade'
    case PRIORIDADE_ORDENACAO.SEGUNDA_VOTACAO:
      return 'Segunda votação'
    case PRIORIDADE_ORDENACAO.PRIMEIRA_VOTACAO:
      return 'Primeira votação'
    default:
      return 'Ordem cronológica'
  }
}

/**
 * Resumo das funcionalidades de automação de pauta
 */
export const FUNCIONALIDADES_AUTOMACAO_PAUTA = {
  'verificarElegibilidade': 'Verifica se proposição pode entrar em pauta',
  'buscarProposicoesElegiveis': 'Lista proposições elegíveis para pauta',
  'gerarPautaAutomatica': 'Gera sugestão de pauta automaticamente',
  'criarPautaDoSugerido': 'Cria pauta no banco a partir da sugestão',
  'calcularTempoEstimadoPauta': 'Calcula tempo estimado da sessão',
  'reordenarPautaPorPrioridade': 'Reordena itens por prioridade',
  'validarPautaParaPublicacao': 'Valida pauta antes de publicar',
  'publicarPauta': 'Publica pauta oficialmente'
}
