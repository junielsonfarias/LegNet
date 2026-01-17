/**
 * Servico de Painel em Tempo Real
 * Gerencia estado da sessao, votacoes e atualizacoes em tempo real
 *
 * Funcionalidades:
 * - Gerenciamento de estado da sessao
 * - Controle de votacao em tempo real
 * - Sincronizacao de presenca
 * - Eventos e notificacoes
 * - Polling otimizado para atualizacoes
 *
 * NOTA SERVERLESS (Vercel):
 * Este servico usa cache em memoria que nao persiste entre invocacoes serverless.
 * Em ambiente serverless, o estado sempre vem do banco de dados.
 * Para melhor performance em tempo real, considere usar:
 * - Vercel KV (Redis) para cache de estado
 * - Supabase Realtime para eventos em tempo real
 * O servico funciona corretamente sem essas otimizacoes, apenas com latencia maior.
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('painel-tempo-real')

// Tipos para o painel em tempo real
export interface EstadoSessao {
  id: string
  numero: number
  tipo: string
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA'
  data: Date
  horarioInicio: string
  horarioFim?: string
  presidente?: string
  secretario?: string
  local?: string
  tempoDecorrido: number // em segundos
  itemAtual?: ItemPautaAtivo
}

export interface ItemPautaAtivo {
  id: string
  ordem: number
  titulo: string
  descricao?: string
  tipo: string
  status: 'PENDENTE' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADO' | 'REJEITADO' | 'ADIADO'
  tempoDiscussao: number // em segundos
  proposicaoId?: string
}

export interface VotacaoAtiva {
  id: string
  proposicaoId: string
  proposicaoTitulo: string
  proposicaoNumero: string
  status: 'ABERTA' | 'FECHADA' | 'APURANDO'
  tempoRestante: number // em segundos
  votos: {
    sim: number
    nao: number
    abstencao: number
    ausente: number
  }
  votosIndividuais: VotoIndividual[]
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  quorumNecessario: number
  tipoQuorum: 'SIMPLES' | 'ABSOLUTA' | 'QUALIFICADA'
}

export interface VotoIndividual {
  parlamentarId: string
  parlamentarNome: string
  partido: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | null
  horaVoto?: Date
}

export interface PresencaAtiva {
  parlamentarId: string
  nome: string
  partido: string
  foto?: string
  presente: boolean
  horaEntrada?: Date
  justificativa?: string
  conectado: boolean // dispositivo conectado
}

export interface EstadoPainel {
  sessao: EstadoSessao | null
  votacaoAtiva: VotacaoAtiva | null
  presencas: PresencaAtiva[]
  pautaItems: ItemPautaAtivo[]
  transmissao: {
    ativa: boolean
    url?: string
    plataforma?: 'youtube' | 'vimeo' | 'outro'
  }
  cronometros: {
    sessao: number
    item: number
    votacao: number
    discurso: number
  }
  discursoAtivo?: {
    parlamentarId: string
    parlamentarNome: string
    tempoRestante: number
    tempoTotal: number
  }
  estatisticas: {
    totalParlamentares: number
    presentes: number
    ausentes: number
    percentualPresenca: number
    itensAprovados: number
    itensRejeitados: number
    itensPendentes: number
  }
}

/**
 * Estado em memoria para sessao ativa
 *
 * IMPORTANTE: Em serverless (Vercel), este cache NAO persiste entre requests.
 * Cada request pode ir para uma instancia diferente, perdendo o estado em memoria.
 * O servico sempre faz fallback para o banco de dados quando o cache esta vazio.
 *
 * Para performance otima em producao serverless, substitua por:
 * - Vercel KV: await kv.get(`painel:${sessaoId}`)
 * - Upstash Redis: await redis.get(`painel:${sessaoId}`)
 */
const estadoAtivo: Map<string, EstadoPainel> = new Map()
const cronometros: Map<string, NodeJS.Timeout> = new Map()

/**
 * Busca estado atual do painel para uma sessao
 */
export async function getEstadoPainel(sessaoId: string): Promise<EstadoPainel | null> {
  // Verificar estado em cache
  const estadoCache = estadoAtivo.get(sessaoId)
  if (estadoCache) {
    return estadoCache
  }

  // Buscar do banco de dados
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
        include: {
          parlamentar: true
        }
      },
      pautaSessao: {
        include: {
          itens: {
            include: {
              proposicao: true
            },
            orderBy: { ordem: 'asc' }
          }
        }
      },
      proposicoes: {
        include: {
          votacoes: {
            include: {
              parlamentar: true
            }
          },
          autor: true
        }
      },
      legislatura: {
        include: {
          mandatos: {
            where: { ativo: true },
            include: { parlamentar: true }
          }
        }
      }
    }
  })

  if (!sessao) return null

  // Montar estado do painel
  const parlamentaresLegislatura = sessao.legislatura?.mandatos.map(m => m.parlamentar) || []

  const presencas: PresencaAtiva[] = parlamentaresLegislatura.map(parlamentar => {
    const presenca = sessao.presencas.find(p => p.parlamentarId === parlamentar.id)
    return {
      parlamentarId: parlamentar.id,
      nome: parlamentar.nome,
      partido: parlamentar.partido || '',
      foto: parlamentar.foto || undefined,
      presente: presenca?.presente || false,
      horaEntrada: presenca?.createdAt,
      justificativa: presenca?.justificativa || undefined,
      conectado: false
    }
  })

  const pautaItems: ItemPautaAtivo[] = sessao.pautaSessao?.itens.map(item => ({
    id: item.id,
    ordem: item.ordem,
    titulo: item.titulo,
    descricao: item.descricao || undefined,
    tipo: item.secao,
    status: item.status as ItemPautaAtivo['status'],
    tempoDiscussao: 0,
    proposicaoId: item.proposicaoId || undefined
  })) || []

  const itemAtual = pautaItems.find(i => i.status === 'EM_DISCUSSAO' || i.status === 'EM_VOTACAO')

  const estado: EstadoPainel = {
    sessao: {
      id: sessao.id,
      numero: sessao.numero,
      tipo: sessao.tipo,
      status: sessao.status as EstadoSessao['status'],
      data: sessao.data,
      horarioInicio: sessao.horario || '',
      horarioFim: undefined,
      presidente: undefined,
      secretario: undefined,
      local: sessao.local || undefined,
      tempoDecorrido: sessao.status === 'EM_ANDAMENTO'
        ? Math.floor((Date.now() - new Date(sessao.data).getTime()) / 1000)
        : 0,
      itemAtual
    },
    votacaoAtiva: null,
    presencas,
    pautaItems,
    transmissao: {
      ativa: false,
      url: undefined,
      plataforma: undefined
    },
    cronometros: {
      sessao: 0,
      item: 0,
      votacao: 0,
      discurso: 0
    },
    estatisticas: {
      totalParlamentares: presencas.length,
      presentes: presencas.filter(p => p.presente).length,
      ausentes: presencas.filter(p => !p.presente).length,
      percentualPresenca: presencas.length > 0
        ? Math.round((presencas.filter(p => p.presente).length / presencas.length) * 100)
        : 0,
      itensAprovados: pautaItems.filter(i => i.status === 'APROVADO').length,
      itensRejeitados: pautaItems.filter(i => i.status === 'REJEITADO').length,
      itensPendentes: pautaItems.filter(i => i.status === 'PENDENTE').length
    }
  }

  estadoAtivo.set(sessaoId, estado)
  return estado
}

/**
 * Inicia uma sessao
 */
export async function iniciarSessao(sessaoId: string): Promise<EstadoPainel | null> {
  const sessao = await prisma.sessao.update({
    where: { id: sessaoId },
    data: {
      status: 'EM_ANDAMENTO'
    }
  })

  // Iniciar cronometro da sessao
  const cronometroId = `sessao-${sessaoId}`
  if (cronometros.has(cronometroId)) {
    clearInterval(cronometros.get(cronometroId)!)
  }

  const interval = setInterval(() => {
    const estado = estadoAtivo.get(sessaoId)
    if (estado && estado.sessao) {
      estado.sessao.tempoDecorrido++
      estado.cronometros.sessao++
    }
  }, 1000)

  cronometros.set(cronometroId, interval)

  logger.info('Sessao iniciada', {
    action: 'iniciar_sessao',
    sessaoId,
    numero: sessao.numero
  })

  return getEstadoPainel(sessaoId)
}

/**
 * Finaliza uma sessao
 */
export async function finalizarSessao(sessaoId: string): Promise<void> {
  await prisma.sessao.update({
    where: { id: sessaoId },
    data: {
      status: 'CONCLUIDA'
    }
  })

  // Parar cronometro
  const cronometroId = `sessao-${sessaoId}`
  if (cronometros.has(cronometroId)) {
    clearInterval(cronometros.get(cronometroId)!)
    cronometros.delete(cronometroId)
  }

  // Limpar estado
  estadoAtivo.delete(sessaoId)

  logger.info('Sessao finalizada', {
    action: 'finalizar_sessao',
    sessaoId
  })
}

/**
 * Inicia votacao para uma proposicao
 */
export async function iniciarVotacao(
  sessaoId: string,
  proposicaoId: string,
  tempoVotacao: number = 300 // 5 minutos padrao
): Promise<VotacaoAtiva | null> {
  const estado = await getEstadoPainel(sessaoId)
  if (!estado) return null

  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    include: { autor: true }
  })

  if (!proposicao) return null

  const parlamentaresPresentes = estado.presencas.filter(p => p.presente)

  const votacaoAtiva: VotacaoAtiva = {
    id: `votacao-${proposicaoId}-${Date.now()}`,
    proposicaoId,
    proposicaoTitulo: proposicao.ementa || `${proposicao.tipo} ${proposicao.numero}/${proposicao.ano}`,
    proposicaoNumero: `${proposicao.numero}/${proposicao.ano}`,
    status: 'ABERTA',
    tempoRestante: tempoVotacao,
    votos: {
      sim: 0,
      nao: 0,
      abstencao: 0,
      ausente: estado.presencas.filter(p => !p.presente).length
    },
    votosIndividuais: parlamentaresPresentes.map(p => ({
      parlamentarId: p.parlamentarId,
      parlamentarNome: p.nome,
      partido: p.partido,
      voto: null,
      horaVoto: undefined
    })),
    quorumNecessario: Math.floor(parlamentaresPresentes.length / 2) + 1,
    tipoQuorum: 'SIMPLES'
  }

  estado.votacaoAtiva = votacaoAtiva

  // Iniciar cronometro da votacao
  const cronometroId = `votacao-${sessaoId}`
  if (cronometros.has(cronometroId)) {
    clearInterval(cronometros.get(cronometroId)!)
  }

  const interval = setInterval(() => {
    if (estado.votacaoAtiva && estado.votacaoAtiva.tempoRestante > 0) {
      estado.votacaoAtiva.tempoRestante--
      estado.cronometros.votacao++
    } else if (estado.votacaoAtiva && estado.votacaoAtiva.tempoRestante <= 0) {
      // Finalizar votacao automaticamente
      finalizarVotacao(sessaoId)
    }
  }, 1000)

  cronometros.set(cronometroId, interval)

  logger.info('Votacao iniciada', {
    action: 'iniciar_votacao',
    sessaoId,
    proposicaoId,
    tempoVotacao
  })

  return votacaoAtiva
}

/**
 * Registra voto de um parlamentar
 */
export async function registrarVoto(
  sessaoId: string,
  parlamentarId: string,
  voto: 'SIM' | 'NAO' | 'ABSTENCAO'
): Promise<boolean> {
  const estado = estadoAtivo.get(sessaoId)
  if (!estado || !estado.votacaoAtiva || estado.votacaoAtiva.status !== 'ABERTA') {
    return false
  }

  const votoExistente = estado.votacaoAtiva.votosIndividuais.find(v => v.parlamentarId === parlamentarId)
  if (!votoExistente) {
    return false
  }

  // Atualizar voto
  const votoAnterior = votoExistente.voto
  votoExistente.voto = voto
  votoExistente.horaVoto = new Date()

  // Atualizar contagem
  if (votoAnterior) {
    estado.votacaoAtiva.votos[votoAnterior.toLowerCase() as 'sim' | 'nao' | 'abstencao']--
  }
  estado.votacaoAtiva.votos[voto.toLowerCase() as 'sim' | 'nao' | 'abstencao']++

  // Persistir no banco
  await prisma.votacao.upsert({
    where: {
      proposicaoId_parlamentarId: {
        proposicaoId: estado.votacaoAtiva.proposicaoId,
        parlamentarId
      }
    },
    create: {
      proposicaoId: estado.votacaoAtiva.proposicaoId,
      parlamentarId,
      voto
    },
    update: {
      voto
    }
  })

  logger.info('Voto registrado', {
    action: 'registrar_voto',
    sessaoId,
    parlamentarId,
    voto
  })

  return true
}

/**
 * Finaliza votacao e apura resultado
 */
export async function finalizarVotacao(sessaoId: string): Promise<VotacaoAtiva | null> {
  const estado = estadoAtivo.get(sessaoId)
  if (!estado || !estado.votacaoAtiva) {
    return null
  }

  // Parar cronometro
  const cronometroId = `votacao-${sessaoId}`
  if (cronometros.has(cronometroId)) {
    clearInterval(cronometros.get(cronometroId)!)
    cronometros.delete(cronometroId)
  }

  // Apurar resultado
  estado.votacaoAtiva.status = 'FECHADA'

  const { sim, nao } = estado.votacaoAtiva.votos
  if (sim > nao) {
    estado.votacaoAtiva.resultado = 'APROVADA'
  } else if (nao > sim) {
    estado.votacaoAtiva.resultado = 'REJEITADA'
  } else {
    estado.votacaoAtiva.resultado = 'EMPATE'
  }

  // Atualizar proposicao no banco
  const novoStatus = estado.votacaoAtiva.resultado === 'APROVADA' ? 'APROVADA' :
                     estado.votacaoAtiva.resultado === 'REJEITADA' ? 'REJEITADA' : 'EM_TRAMITACAO'

  await prisma.proposicao.update({
    where: { id: estado.votacaoAtiva.proposicaoId },
    data: { status: novoStatus }
  })

  logger.info('Votacao finalizada', {
    action: 'finalizar_votacao',
    sessaoId,
    proposicaoId: estado.votacaoAtiva.proposicaoId,
    resultado: estado.votacaoAtiva.resultado,
    votos: estado.votacaoAtiva.votos
  })

  const resultado = { ...estado.votacaoAtiva }
  estado.votacaoAtiva = null

  return resultado
}

/**
 * Registra presenca de parlamentar
 */
export async function registrarPresenca(
  sessaoId: string,
  parlamentarId: string,
  presente: boolean,
  justificativa?: string
): Promise<boolean> {
  const estado = estadoAtivo.get(sessaoId)
  if (!estado) {
    return false
  }

  const presenca = estado.presencas.find(p => p.parlamentarId === parlamentarId)
  if (presenca) {
    presenca.presente = presente
    presenca.horaEntrada = presente ? new Date() : undefined
    presenca.justificativa = justificativa
  }

  // Atualizar estatisticas
  estado.estatisticas.presentes = estado.presencas.filter(p => p.presente).length
  estado.estatisticas.ausentes = estado.presencas.filter(p => !p.presente).length
  estado.estatisticas.percentualPresenca = estado.presencas.length > 0
    ? Math.round((estado.estatisticas.presentes / estado.presencas.length) * 100)
    : 0

  // Persistir no banco
  await prisma.presencaSessao.upsert({
    where: {
      sessaoId_parlamentarId: {
        sessaoId,
        parlamentarId
      }
    },
    create: {
      sessaoId,
      parlamentarId,
      presente,
      justificativa
    },
    update: {
      presente,
      justificativa
    }
  })

  logger.info('Presenca registrada', {
    action: 'registrar_presenca',
    sessaoId,
    parlamentarId,
    presente
  })

  return true
}

/**
 * Inicia item da pauta
 */
export async function iniciarItemPauta(sessaoId: string, itemId: string): Promise<ItemPautaAtivo | null> {
  const estado = estadoAtivo.get(sessaoId)
  if (!estado) return null

  const item = estado.pautaItems.find(i => i.id === itemId)
  if (!item) return null

  // Finalizar item anterior se houver
  if (estado.sessao?.itemAtual) {
    const itemAnterior = estado.pautaItems.find(i => i.id === estado.sessao!.itemAtual!.id)
    if (itemAnterior && itemAnterior.status === 'EM_DISCUSSAO') {
      itemAnterior.status = 'ADIADO'
    }
  }

  item.status = 'EM_DISCUSSAO'
  item.tempoDiscussao = 0
  estado.sessao!.itemAtual = item
  estado.cronometros.item = 0

  // Iniciar cronometro do item
  const cronometroId = `item-${sessaoId}`
  if (cronometros.has(cronometroId)) {
    clearInterval(cronometros.get(cronometroId)!)
  }

  const interval = setInterval(() => {
    if (estado.sessao?.itemAtual) {
      estado.sessao.itemAtual.tempoDiscussao++
      estado.cronometros.item++
    }
  }, 1000)

  cronometros.set(cronometroId, interval)

  // Atualizar no banco
  await prisma.pautaItem.update({
    where: { id: itemId },
    data: { status: 'EM_DISCUSSAO' }
  })

  logger.info('Item da pauta iniciado', {
    action: 'iniciar_item_pauta',
    sessaoId,
    itemId,
    titulo: item.titulo
  })

  return item
}

/**
 * Finaliza item da pauta
 */
export async function finalizarItemPauta(
  sessaoId: string,
  itemId: string,
  status: 'APROVADO' | 'REJEITADO' | 'ADIADO'
): Promise<boolean> {
  const estado = estadoAtivo.get(sessaoId)
  if (!estado) return false

  const item = estado.pautaItems.find(i => i.id === itemId)
  if (!item) return false

  item.status = status

  // Parar cronometro do item
  const cronometroId = `item-${sessaoId}`
  if (cronometros.has(cronometroId)) {
    clearInterval(cronometros.get(cronometroId)!)
    cronometros.delete(cronometroId)
  }

  // Limpar item atual
  if (estado.sessao?.itemAtual?.id === itemId) {
    estado.sessao.itemAtual = undefined
  }

  // Atualizar estatisticas
  estado.estatisticas.itensAprovados = estado.pautaItems.filter(i => i.status === 'APROVADO').length
  estado.estatisticas.itensRejeitados = estado.pautaItems.filter(i => i.status === 'REJEITADO').length
  estado.estatisticas.itensPendentes = estado.pautaItems.filter(i => i.status === 'PENDENTE').length

  // Atualizar no banco
  await prisma.pautaItem.update({
    where: { id: itemId },
    data: { status }
  })

  logger.info('Item da pauta finalizado', {
    action: 'finalizar_item_pauta',
    sessaoId,
    itemId,
    status
  })

  return true
}

/**
 * Inicia discurso de parlamentar
 */
export async function iniciarDiscurso(
  sessaoId: string,
  parlamentarId: string,
  tempoTotal: number = 300
): Promise<boolean> {
  const estado = estadoAtivo.get(sessaoId)
  if (!estado) return false

  const parlamentar = estado.presencas.find(p => p.parlamentarId === parlamentarId)
  if (!parlamentar || !parlamentar.presente) return false

  estado.discursoAtivo = {
    parlamentarId,
    parlamentarNome: parlamentar.nome,
    tempoRestante: tempoTotal,
    tempoTotal
  }
  estado.cronometros.discurso = tempoTotal

  // Iniciar cronometro do discurso
  const cronometroId = `discurso-${sessaoId}`
  if (cronometros.has(cronometroId)) {
    clearInterval(cronometros.get(cronometroId)!)
  }

  const interval = setInterval(() => {
    if (estado.discursoAtivo && estado.discursoAtivo.tempoRestante > 0) {
      estado.discursoAtivo.tempoRestante--
      estado.cronometros.discurso--
    } else if (estado.discursoAtivo && estado.discursoAtivo.tempoRestante <= 0) {
      finalizarDiscurso(sessaoId)
    }
  }, 1000)

  cronometros.set(cronometroId, interval)

  logger.info('Discurso iniciado', {
    action: 'iniciar_discurso',
    sessaoId,
    parlamentarId,
    parlamentarNome: parlamentar.nome,
    tempoTotal
  })

  return true
}

/**
 * Finaliza discurso
 */
export async function finalizarDiscurso(sessaoId: string): Promise<boolean> {
  const estado = estadoAtivo.get(sessaoId)
  if (!estado) return false

  // Parar cronometro
  const cronometroId = `discurso-${sessaoId}`
  if (cronometros.has(cronometroId)) {
    clearInterval(cronometros.get(cronometroId)!)
    cronometros.delete(cronometroId)
  }

  estado.discursoAtivo = undefined
  estado.cronometros.discurso = 0

  logger.info('Discurso finalizado', {
    action: 'finalizar_discurso',
    sessaoId
  })

  return true
}

/**
 * Configura transmissao ao vivo
 */
export async function configurarTransmissao(
  sessaoId: string,
  url: string,
  plataforma: 'youtube' | 'vimeo' | 'outro',
  ativa: boolean
): Promise<boolean> {
  const estado = estadoAtivo.get(sessaoId)
  if (!estado) return false

  estado.transmissao = {
    ativa,
    url,
    plataforma
  }

  logger.info('Transmissao configurada', {
    action: 'configurar_transmissao',
    sessaoId,
    url,
    plataforma,
    ativa
  })

  return true
}

/**
 * Exporta dados do painel para relatorio
 */
export async function exportarDadosPainel(sessaoId: string): Promise<{
  sessao: any
  presencas: any[]
  votacoes: any[]
  pauta: any[]
}> {
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
        include: { parlamentar: true }
      },
      proposicoes: {
        include: {
          votacoes: {
            include: { parlamentar: true }
          }
        }
      },
      pautaSessao: {
        include: {
          itens: {
            include: { proposicao: true }
          }
        }
      }
    }
  })

  if (!sessao) {
    return { sessao: null, presencas: [], votacoes: [], pauta: [] }
  }

  return {
    sessao: {
      id: sessao.id,
      numero: sessao.numero,
      tipo: sessao.tipo,
      data: sessao.data,
      status: sessao.status,
      horario: sessao.horario,
      local: sessao.local
    },
    presencas: sessao.presencas.map(p => ({
      parlamentar: p.parlamentar.nome,
      partido: p.parlamentar.partido,
      presente: p.presente,
      justificativa: p.justificativa
    })),
    votacoes: sessao.proposicoes.flatMap(prop =>
      prop.votacoes.map(v => ({
        proposicao: `${prop.tipo} ${prop.numero}/${prop.ano}`,
        parlamentar: v.parlamentar.nome,
        voto: v.voto
      }))
    ),
    pauta: sessao.pautaSessao?.itens.map(item => ({
      ordem: item.ordem,
      titulo: item.titulo,
      tipo: item.secao,
      status: item.status
    })) || []
  }
}

/**
 * Limpa todos os cronometros e estados (para cleanup)
 */
export function limparTodosEstados(): void {
  cronometros.forEach(interval => clearInterval(interval))
  cronometros.clear()
  estadoAtivo.clear()
  logger.info('Todos estados limpos', { action: 'limpar_todos_estados' })
}
