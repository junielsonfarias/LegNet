/**
 * Serviço de Turnos de Votação
 * Implementa lógica de turnos conforme SAPL do Interlegis
 *
 * Regras:
 * - Projetos de Lei Ordinária: turno único
 * - Projetos de Lei Complementar: 2 turnos com interstício de 24h
 * - Emendas à Lei Orgânica: 2 turnos com interstício de 10 dias
 * - Regimento Interno: 2 turnos com interstício de 24h
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type { ResultadoVotacaoAgrupada, TipoQuorum, TipoVotacao } from '@prisma/client'

const logger = createLogger('turno')

// Tipos de proposição que exigem 2 turnos (codigos de tipo como string)
const TIPOS_DOIS_TURNOS: string[] = [
  'PROJETO_LEI_COMPLEMENTAR',
  'PROJETO_EMENDA_LEI_ORGANICA'
  // Adicione outros tipos personalizados que exigem 2 turnos
]

// Mapeamento de tipos para configuração de turnos
interface ConfiguracaoTurno {
  totalTurnos: number
  intersticioDias: number
  tipoQuorum: TipoQuorum
  descricao: string
}

const CONFIGURACAO_TURNOS: Record<string, ConfiguracaoTurno> = {
  // Matérias de turno único
  'PROJETO_LEI': {
    totalTurnos: 1,
    intersticioDias: 0,
    tipoQuorum: 'MAIORIA_SIMPLES',
    descricao: 'Projeto de Lei Ordinária - Turno único'
  },
  'INDICACAO': {
    totalTurnos: 1,
    intersticioDias: 0,
    tipoQuorum: 'MAIORIA_SIMPLES',
    descricao: 'Indicação - Turno único'
  },
  'REQUERIMENTO': {
    totalTurnos: 1,
    intersticioDias: 0,
    tipoQuorum: 'MAIORIA_SIMPLES',
    descricao: 'Requerimento - Turno único'
  },
  'MOCAO': {
    totalTurnos: 1,
    intersticioDias: 0,
    tipoQuorum: 'MAIORIA_SIMPLES',
    descricao: 'Moção - Turno único'
  },
  'VOTO_PESAR': {
    totalTurnos: 1,
    intersticioDias: 0,
    tipoQuorum: 'MAIORIA_SIMPLES',
    descricao: 'Voto de Pesar - Turno único'
  },
  'VOTO_APLAUSO': {
    totalTurnos: 1,
    intersticioDias: 0,
    tipoQuorum: 'MAIORIA_SIMPLES',
    descricao: 'Voto de Aplauso - Turno único'
  },

  // Matérias de dois turnos
  'PROJETO_RESOLUCAO': {
    totalTurnos: 2,
    intersticioDias: 1, // 24 horas (1 dia)
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    descricao: 'Projeto de Resolução - 2 turnos com 24h de interstício'
  },
  'PROJETO_DECRETO': {
    totalTurnos: 2,
    intersticioDias: 1, // 24 horas (1 dia)
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    descricao: 'Projeto de Decreto Legislativo - 2 turnos com 24h de interstício'
  },

  // Configuração padrão para tipos não mapeados
  'DEFAULT': {
    totalTurnos: 1,
    intersticioDias: 0,
    tipoQuorum: 'MAIORIA_SIMPLES',
    descricao: 'Configuração padrão - Turno único'
  }
}

/**
 * Obtém a configuração de turnos para um tipo de proposição
 */
export function getConfiguracaoTurno(tipoProposicao: string): ConfiguracaoTurno {
  return CONFIGURACAO_TURNOS[tipoProposicao] || CONFIGURACAO_TURNOS['DEFAULT']
}

/**
 * Verifica se uma proposição requer dois turnos
 */
export function requerDoisTurnos(tipoProposicao: string): boolean {
  const config = getConfiguracaoTurno(tipoProposicao)
  return config.totalTurnos === 2
}

/**
 * Calcula a data limite para votação em 2º turno (interstício)
 */
export function calcularPrazoIntersticio(
  tipoProposicao: string,
  dataVotacaoTurno1: Date
): Date {
  const config = getConfiguracaoTurno(tipoProposicao)
  const prazo = new Date(dataVotacaoTurno1)

  // Adiciona os dias de interstício
  let diasAdicionados = 0
  while (diasAdicionados < config.intersticioDias) {
    prazo.setDate(prazo.getDate() + 1)
    // Pular sábado (6) e domingo (0) - dias úteis apenas
    if (prazo.getDay() !== 0 && prazo.getDay() !== 6) {
      diasAdicionados++
    }
  }

  return prazo
}

/**
 * Verifica se o interstício já foi cumprido
 */
export function intersticioCumprido(
  dataVotacaoTurno1: Date,
  prazoIntersticio: Date
): boolean {
  const agora = new Date()
  return agora >= prazoIntersticio
}

/**
 * Inicializa os campos de turno em um item da pauta
 */
export async function inicializarTurnoPautaItem(
  itemId: string,
  tipoProposicao: string
): Promise<void> {
  const config = getConfiguracaoTurno(tipoProposicao)

  await prisma.pautaItem.update({
    where: { id: itemId },
    data: {
      turnoAtual: 1,
      turnoFinal: config.totalTurnos,
      resultadoTurno1: null,
      resultadoTurno2: null,
      dataVotacaoTurno1: null,
      dataVotacaoTurno2: null,
      intersticio: false,
      dataIntersticio: null,
      prazoIntersticio: null
    }
  })

  logger.info('Turno inicializado para item da pauta', {
    action: 'inicializar_turno',
    itemId,
    tipoProposicao,
    turnoFinal: config.totalTurnos
  })
}

/**
 * Registra o resultado de um turno de votação
 */
export async function registrarResultadoTurno(
  itemId: string,
  turno: number,
  resultado: ResultadoVotacaoAgrupada,
  tipoProposicao: string
): Promise<{
  proximoTurno: boolean
  mensagem: string
  prazoIntersticio?: Date
}> {
  const config = getConfiguracaoTurno(tipoProposicao)
  const agora = new Date()

  if (turno === 1) {
    // Primeiro turno
    if (resultado === 'APROVADA' && config.totalTurnos === 2) {
      // Aprovado em 1º turno, precisa de 2º turno
      const prazo = calcularPrazoIntersticio(tipoProposicao, agora)

      await prisma.pautaItem.update({
        where: { id: itemId },
        data: {
          resultadoTurno1: resultado,
          dataVotacaoTurno1: agora,
          turnoAtual: 1, // Mantém em 1 até o interstício
          intersticio: true,
          dataIntersticio: agora,
          prazoIntersticio: prazo,
          status: 'PENDENTE' // Volta para pendente aguardando 2º turno
        }
      })

      logger.info('Primeiro turno aprovado, aguardando interstício', {
        action: 'primeiro_turno_aprovado',
        itemId,
        resultado,
        prazoIntersticio: prazo.toISOString()
      })

      return {
        proximoTurno: true,
        mensagem: `Aprovado em 1º turno. Aguarde interstício de ${config.intersticioDias} dia(s) para votação em 2º turno.`,
        prazoIntersticio: prazo
      }
    } else if (resultado === 'REJEITADA') {
      // Rejeitado em 1º turno - finaliza
      await prisma.pautaItem.update({
        where: { id: itemId },
        data: {
          resultadoTurno1: resultado,
          dataVotacaoTurno1: agora,
          status: 'REJEITADO',
          finalizadoEm: agora
        }
      })

      logger.info('Primeiro turno rejeitado, matéria arquivada', {
        action: 'primeiro_turno_rejeitado',
        itemId,
        resultado
      })

      return {
        proximoTurno: false,
        mensagem: 'Matéria rejeitada em 1º turno.'
      }
    } else if (resultado === 'APROVADA') {
      // Turno único aprovado (matérias que não precisam de 2º turno)
      await prisma.pautaItem.update({
        where: { id: itemId },
        data: {
          resultadoTurno1: resultado,
          dataVotacaoTurno1: agora,
          status: 'APROVADO',
          finalizadoEm: agora
        }
      })

      logger.info('Votação de turno único finalizada - APROVADA', {
        action: 'turno_unico_aprovado',
        itemId,
        resultado
      })

      return {
        proximoTurno: false,
        mensagem: 'Matéria aprovada em turno único.'
      }
    } else {
      // Outros resultados (EMPATE, SEM_QUORUM, ADIADA, PREJUDICADA)
      await prisma.pautaItem.update({
        where: { id: itemId },
        data: {
          resultadoTurno1: resultado,
          dataVotacaoTurno1: agora,
          status: 'CONCLUIDO',
          finalizadoEm: agora
        }
      })

      logger.info('Votação de turno único finalizada', {
        action: 'turno_unico_finalizado',
        itemId,
        resultado
      })

      return {
        proximoTurno: false,
        mensagem: `Matéria ${resultado.toLowerCase()} em votação de turno único.`
      }
    }
  } else if (turno === 2) {
    // Segundo turno
    const statusFinal = resultado === 'APROVADA' ? 'APROVADO' :
                       resultado === 'REJEITADA' ? 'REJEITADO' : 'CONCLUIDO'

    await prisma.pautaItem.update({
      where: { id: itemId },
      data: {
        resultadoTurno2: resultado,
        dataVotacaoTurno2: agora,
        turnoAtual: 2,
        intersticio: false,
        status: statusFinal,
        finalizadoEm: agora
      }
    })

    logger.info('Segundo turno finalizado', {
      action: 'segundo_turno_finalizado',
      itemId,
      resultado
    })

    return {
      proximoTurno: false,
      mensagem: `Matéria ${resultado.toLowerCase()} em 2º turno.`
    }
  }

  return {
    proximoTurno: false,
    mensagem: 'Turno inválido.'
  }
}

/**
 * Verifica se um item pode iniciar votação em 2º turno
 */
export async function podeIniciarSegundoTurno(itemId: string): Promise<{
  pode: boolean
  motivo: string
}> {
  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId }
  })

  if (!item) {
    return { pode: false, motivo: 'Item não encontrado' }
  }

  if (!item.intersticio) {
    return { pode: false, motivo: 'Item não está em interstício' }
  }

  if (item.resultadoTurno1 !== 'APROVADA') {
    return { pode: false, motivo: 'Item não foi aprovado em 1º turno' }
  }

  if (!item.prazoIntersticio) {
    return { pode: false, motivo: 'Prazo de interstício não definido' }
  }

  const agora = new Date()
  if (agora < item.prazoIntersticio) {
    const diff = Math.ceil((item.prazoIntersticio.getTime() - agora.getTime()) / (1000 * 60 * 60))
    return {
      pode: false,
      motivo: `Aguarde ${diff} hora(s) para completar o interstício`
    }
  }

  return { pode: true, motivo: 'Interstício cumprido, pode iniciar 2º turno' }
}

/**
 * Inicia a votação em 2º turno
 */
export async function iniciarSegundoTurno(itemId: string): Promise<void> {
  const verificacao = await podeIniciarSegundoTurno(itemId)

  if (!verificacao.pode) {
    throw new Error(verificacao.motivo)
  }

  await prisma.pautaItem.update({
    where: { id: itemId },
    data: {
      turnoAtual: 2,
      intersticio: false,
      status: 'EM_VOTACAO',
      iniciadoEm: new Date()
    }
  })

  logger.info('Segundo turno iniciado', {
    action: 'iniciar_segundo_turno',
    itemId
  })
}

/**
 * Cria ou atualiza registro de votação agrupada
 */
export async function registrarVotacaoAgrupada(
  proposicaoId: string,
  sessaoId: string,
  turno: number,
  votos: {
    sim: number
    nao: number
    abstencao: number
    ausente: number
  },
  totalMembros: number,
  totalPresentes: number,
  tipoQuorum: TipoQuorum,
  tipoVotacao: TipoVotacao,
  resultado: ResultadoVotacaoAgrupada
): Promise<void> {
  const quorumNecessario = calcularQuorumNecessario(tipoQuorum, totalMembros, totalPresentes)

  await prisma.votacaoAgrupada.upsert({
    where: {
      proposicaoId_sessaoId_turno: {
        proposicaoId,
        sessaoId,
        turno
      }
    },
    update: {
      votosSim: votos.sim,
      votosNao: votos.nao,
      votosAbstencao: votos.abstencao,
      votosAusente: votos.ausente,
      totalMembros,
      totalPresentes,
      quorumNecessario,
      resultado,
      finalizadaEm: new Date()
    },
    create: {
      proposicaoId,
      sessaoId,
      turno,
      tipoQuorum,
      tipoVotacao,
      votosSim: votos.sim,
      votosNao: votos.nao,
      votosAbstencao: votos.abstencao,
      votosAusente: votos.ausente,
      totalMembros,
      totalPresentes,
      quorumNecessario,
      resultado,
      iniciadaEm: new Date(),
      finalizadaEm: new Date()
    }
  })

  logger.info('Votação agrupada registrada', {
    action: 'registrar_votacao_agrupada',
    proposicaoId,
    sessaoId,
    turno,
    resultado
  })
}

/**
 * Calcula o quorum necessário baseado no tipo
 */
function calcularQuorumNecessario(
  tipoQuorum: TipoQuorum,
  totalMembros: number,
  totalPresentes: number
): number {
  switch (tipoQuorum) {
    case 'MAIORIA_SIMPLES':
      return Math.floor(totalPresentes / 2) + 1
    case 'MAIORIA_ABSOLUTA':
      return Math.floor(totalMembros / 2) + 1
    case 'DOIS_TERCOS':
      return Math.ceil((totalMembros * 2) / 3)
    case 'TRES_QUINTOS':
      return Math.ceil((totalMembros * 3) / 5)
    case 'UNANIMIDADE':
      return totalPresentes
    default:
      return Math.floor(totalPresentes / 2) + 1
  }
}

/**
 * Obtém o histórico de votações por turno de uma proposição
 */
export async function getHistoricoVotacoesTurnos(
  proposicaoId: string
): Promise<{
  turno1?: {
    sessaoId: string
    data: Date
    resultado: string
    votos: { sim: number; nao: number; abstencao: number }
  }
  turno2?: {
    sessaoId: string
    data: Date
    resultado: string
    votos: { sim: number; nao: number; abstencao: number }
  }
}> {
  const votacoes = await prisma.votacaoAgrupada.findMany({
    where: { proposicaoId },
    orderBy: { turno: 'asc' }
  })

  const historico: ReturnType<typeof getHistoricoVotacoesTurnos> extends Promise<infer T> ? T : never = {}

  for (const v of votacoes) {
    const dados = {
      sessaoId: v.sessaoId,
      data: v.finalizadaEm || v.createdAt,
      resultado: v.resultado || 'SEM_RESULTADO',
      votos: {
        sim: v.votosSim,
        nao: v.votosNao,
        abstencao: v.votosAbstencao
      }
    }

    if (v.turno === 1) {
      historico.turno1 = dados
    } else if (v.turno === 2) {
      historico.turno2 = dados
    }
  }

  return historico
}

/**
 * Lista itens em interstício (aguardando 2º turno)
 */
export async function listarItensEmIntersticio(): Promise<Array<{
  id: string
  titulo: string
  prazoIntersticio: Date
  podeProsseguir: boolean
}>> {
  const itens = await prisma.pautaItem.findMany({
    where: {
      intersticio: true,
      resultadoTurno1: 'APROVADA'
    },
    select: {
      id: true,
      titulo: true,
      prazoIntersticio: true
    }
  })

  const agora = new Date()

  return itens.map(item => ({
    id: item.id,
    titulo: item.titulo,
    prazoIntersticio: item.prazoIntersticio!,
    podeProsseguir: agora >= item.prazoIntersticio!
  }))
}
