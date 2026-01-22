/**
 * Serviço de Votação
 * Implementa regras de negócio RN-060 a RN-073
 *
 * NOTA: O modelo Votacao do Prisma é uma tabela simples que registra
 * votos individuais (proposicaoId, parlamentarId, voto).
 * Este serviço fornece validações e cálculos para o processo de votação.
 *
 * ATUALIZAÇÃO SAPL: Agora suporta votação em turnos (1º e 2º turno)
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type { TipoVoto } from '@prisma/client'
import {
  getConfiguracaoTurno,
  requerDoisTurnos
} from './turno-service'

const logger = createLogger('votacao')

// Re-exporta tipos do Prisma
export type { TipoVoto }

// Opções de voto
export type OpcaoVoto = 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE'

// Tipos de quórum (RN-060)
export type TipoQuorum = 'SIMPLES' | 'ABSOLUTA' | 'QUALIFICADA'

// Tipos de votação
export type TipoVotacao = 'NOMINAL' | 'SIMBOLICA' | 'SECRETA'

// Resultado de validação
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  rule?: string
}

// Resultado do cálculo de quórum
export interface QuorumResult {
  tipo: TipoQuorum
  totalMembros: number
  presentes: number
  quorumNecessario: number
  temQuorum: boolean
  minVotosAprovacao: number
}

// Resultado da apuração
export interface ApuracaoResult {
  totalVotos: number
  votosSim: number
  votosNao: number
  abstencoes: number
  ausentes: number
  quorumAtingido: boolean
  resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE' | 'SEM_QUORUM'
}

/**
 * RN-060: Calcula quórum para votação
 */
export function calcularQuorum(
  tipo: TipoQuorum,
  totalMembros: number,
  presentes: number
): QuorumResult {
  let quorumNecessario: number
  let minVotosAprovacao: number

  switch (tipo) {
    case 'ABSOLUTA':
      // Maioria absoluta: mais da metade do total de membros
      quorumNecessario = Math.floor(totalMembros / 2) + 1
      minVotosAprovacao = quorumNecessario
      break

    case 'QUALIFICADA':
      // Maioria qualificada: 2/3 dos membros
      quorumNecessario = Math.ceil((totalMembros * 2) / 3)
      minVotosAprovacao = quorumNecessario
      break

    case 'SIMPLES':
    default:
      // Maioria simples: mais da metade dos presentes
      quorumNecessario = Math.floor(totalMembros / 2) + 1 // Para instalar
      minVotosAprovacao = Math.floor(presentes / 2) + 1 // Para aprovar
      break
  }

  return {
    tipo,
    totalMembros,
    presentes,
    quorumNecessario,
    temQuorum: presentes >= quorumNecessario,
    minVotosAprovacao
  }
}

/**
 * RN-060: Valida quórum para votação em sessão
 */
export async function validarQuorumVotacao(
  sessaoId: string,
  tipoQuorum: TipoQuorum = 'SIMPLES'
): Promise<ValidationResult & { quorum?: QuorumResult }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Conta presenças na sessão
  const presencas = await prisma.presencaSessao.count({
    where: {
      sessaoId,
      presente: true
    }
  })

  // Busca sessão para verificar legislatura
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    select: { legislaturaId: true }
  })

  if (!sessao) {
    errors.push('Sessão não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-060' }
  }

  const whereClause: {
    ativo: boolean
    mandatos?: { some: { legislaturaId: string; ativo: boolean } }
  } = { ativo: true }

  if (sessao.legislaturaId) {
    whereClause.mandatos = {
      some: {
        legislaturaId: sessao.legislaturaId,
        ativo: true
      }
    }
  }

  const totalMembros = await prisma.parlamentar.count({
    where: whereClause
  })

  const quorum = calcularQuorum(tipoQuorum, totalMembros, presencas)

  if (!quorum.temQuorum) {
    errors.push(
      `RN-060: Quórum não atingido para votação. ` +
      `Presentes: ${presencas}/${totalMembros}. ` +
      `Mínimo necessário para instalar: ${quorum.quorumNecessario}.`
    )
  }

  logger.info('Validação de quórum para votação', {
    action: 'validar_quorum_votacao',
    sessaoId,
    tipoQuorum,
    presentes: presencas,
    totalMembros,
    quorumNecessario: quorum.quorumNecessario,
    temQuorum: quorum.temQuorum
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-060',
    quorum
  }
}

/**
 * RN-061: Verifica se deve ser votação nominal
 */
export function deveSerVotacaoNominal(
  tipoProposicao: string,
  tipoQuorum: TipoQuorum,
  requerimentoNominal: boolean = false
): { nominal: boolean; motivo: string } {
  // Votação nominal obrigatória para:
  // 1. Matérias que exigem quórum qualificado
  if (tipoQuorum === 'QUALIFICADA') {
    return {
      nominal: true,
      motivo: 'RN-061: Matérias com quórum qualificado exigem votação nominal'
    }
  }

  // 2. Projetos de lei que alterem Lei Orgânica
  if (tipoProposicao === 'PROJETO_EMENDA_LEI_ORGANICA') {
    return {
      nominal: true,
      motivo: 'RN-061: Emendas à Lei Orgânica exigem votação nominal'
    }
  }

  // 3. Apreciação de veto
  if (tipoProposicao === 'APRECIACAO_VETO') {
    return {
      nominal: true,
      motivo: 'RN-061: Apreciação de veto exige votação nominal'
    }
  }

  // 4. Requerimento de qualquer parlamentar
  if (requerimentoNominal) {
    return {
      nominal: true,
      motivo: 'RN-061: Votação nominal requerida por parlamentar'
    }
  }

  return {
    nominal: false,
    motivo: 'Votação simbólica permitida'
  }
}

/**
 * RN-063: Verifica impedimentos de voto
 */
export async function verificarImpedimentoVoto(
  parlamentarId: string,
  proposicaoId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição com autor
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: {
      autorId: true
    }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-063' }
  }

  // Verifica se é autor da proposição
  if (proposicao.autorId === parlamentarId) {
    warnings.push(
      'RN-063: Parlamentar é autor da proposição. ' +
      'Pode votar, mas há possível conflito de interesse.'
    )
  }

  // Nota: Verificação de coautoria e parentesco até 3º grau precisaria
  // de dados adicionais que não estão no modelo atual.

  return {
    valid: true, // Impedimentos geram avisos, não bloqueios automáticos
    errors,
    warnings,
    rule: 'RN-063'
  }
}

/**
 * RN-071: Registra voto individual
 */
export async function registrarVoto(
  proposicaoId: string,
  parlamentarId: string,
  voto: OpcaoVoto
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Verifica se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-071' }
  }

  // Verifica se parlamentar existe e está ativo
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: parlamentarId }
  })

  if (!parlamentar || !parlamentar.ativo) {
    errors.push('RN-071: Parlamentar não encontrado ou inativo.')
    return { valid: false, errors, warnings, rule: 'RN-071' }
  }

  // Verifica impedimentos
  const impedimento = await verificarImpedimentoVoto(parlamentarId, proposicaoId)
  warnings.push(...impedimento.warnings)

  try {
    // Registra ou atualiza voto (upsert)
    await prisma.votacao.upsert({
      where: {
        proposicaoId_parlamentarId: {
          proposicaoId,
          parlamentarId
        }
      },
      update: {
        voto: voto as TipoVoto
      },
      create: {
        proposicaoId,
        parlamentarId,
        voto: voto as TipoVoto
      }
    })

    logger.info('Voto registrado', {
      action: 'registrar_voto',
      proposicaoId,
      parlamentarId,
      voto
    })

    return {
      valid: true,
      errors,
      warnings,
      rule: 'RN-071'
    }
  } catch (error) {
    logger.error('Erro ao registrar voto', error)
    errors.push('Erro ao registrar voto.')
    return { valid: false, errors, warnings, rule: 'RN-071' }
  }
}

/**
 * RN-073: Apura resultado da votação
 */
export async function apurarResultado(
  proposicaoId: string,
  tipoQuorum: TipoQuorum = 'SIMPLES',
  totalMembros: number
): Promise<ApuracaoResult> {
  // Busca todos os votos da proposição
  const votos = await prisma.votacao.findMany({
    where: { proposicaoId }
  })

  const votosSim = votos.filter(v => v.voto === 'SIM').length
  const votosNao = votos.filter(v => v.voto === 'NAO').length
  const abstencoes = votos.filter(v => v.voto === 'ABSTENCAO').length
  const ausentes = votos.filter(v => v.voto === 'AUSENTE').length
  const totalVotos = votos.length

  const quorum = calcularQuorum(tipoQuorum, totalMembros, totalVotos - ausentes)
  const quorumAtingido = quorum.temQuorum

  let resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE' | 'SEM_QUORUM'

  if (!quorumAtingido) {
    resultado = 'SEM_QUORUM'
  } else if (votosSim > votosNao && votosSim >= quorum.minVotosAprovacao) {
    resultado = 'APROVADA'
  } else if (votosNao > votosSim) {
    resultado = 'REJEITADA'
  } else if (votosSim === votosNao) {
    resultado = 'EMPATE'
  } else {
    resultado = 'REJEITADA' // Não atingiu mínimo necessário
  }

  logger.info('Apuração de resultado', {
    action: 'apurar_resultado',
    proposicaoId,
    tipoQuorum,
    votosSim,
    votosNao,
    abstencoes,
    resultado
  })

  return {
    totalVotos,
    votosSim,
    votosNao,
    abstencoes,
    ausentes,
    quorumAtingido,
    resultado
  }
}

/**
 * Atualiza resultado da proposição após votação
 */
export async function atualizarResultadoProposicao(
  proposicaoId: string,
  resultado: 'APROVADA' | 'REJEITADA'
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    await prisma.proposicao.update({
      where: { id: proposicaoId },
      data: {
        status: resultado,
        dataVotacao: new Date(),
        resultado: resultado === 'APROVADA' ? 'APROVADA' : 'REJEITADA'
      }
    })

    logger.info('Resultado de proposição atualizado', {
      action: 'atualizar_resultado',
      proposicaoId,
      resultado
    })

    return {
      valid: true,
      errors,
      warnings
    }
  } catch (error) {
    logger.error('Erro ao atualizar resultado', error)
    errors.push('Erro ao atualizar resultado da proposição.')
    return { valid: false, errors, warnings }
  }
}

/**
 * Lista votos de uma proposição
 */
export async function listarVotosProposicao(
  proposicaoId: string
): Promise<Array<{
  parlamentarId: string
  nome: string
  voto: string
  dataVoto: Date
}>> {
  const votos = await prisma.votacao.findMany({
    where: { proposicaoId },
    include: {
      parlamentar: {
        select: {
          nome: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return votos.map(v => ({
    parlamentarId: v.parlamentarId,
    nome: v.parlamentar.nome,
    voto: v.voto,
    dataVoto: v.createdAt
  }))
}

/**
 * RN-074: Registra voto individual com suporte a turno
 */
export async function registrarVotoComTurno(
  proposicaoId: string,
  parlamentarId: string,
  voto: OpcaoVoto,
  turno: number = 1,
  sessaoId?: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Verifica se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-074' }
  }

  // Verifica se parlamentar existe e está ativo
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: parlamentarId }
  })

  if (!parlamentar || !parlamentar.ativo) {
    errors.push('RN-071: Parlamentar não encontrado ou inativo.')
    return { valid: false, errors, warnings, rule: 'RN-074' }
  }

  // Verifica impedimentos
  const impedimento = await verificarImpedimentoVoto(parlamentarId, proposicaoId)
  warnings.push(...impedimento.warnings)

  try {
    // Registra ou atualiza voto com turno
    await prisma.votacao.upsert({
      where: {
        proposicaoId_parlamentarId_turno: {
          proposicaoId,
          parlamentarId,
          turno
        }
      },
      update: {
        voto: voto as TipoVoto,
        sessaoId
      },
      create: {
        proposicaoId,
        parlamentarId,
        voto: voto as TipoVoto,
        turno,
        sessaoId
      }
    })

    logger.info('Voto registrado com turno', {
      action: 'registrar_voto_turno',
      proposicaoId,
      parlamentarId,
      voto,
      turno,
      sessaoId
    })

    return {
      valid: true,
      errors,
      warnings,
      rule: 'RN-074'
    }
  } catch (error) {
    logger.error('Erro ao registrar voto com turno', error)
    errors.push('Erro ao registrar voto.')
    return { valid: false, errors, warnings, rule: 'RN-074' }
  }
}

/**
 * RN-075: Apura resultado da votação por turno
 */
export async function apurarResultadoPorTurno(
  proposicaoId: string,
  turno: number,
  tipoQuorum: TipoQuorum = 'SIMPLES',
  totalMembros: number
): Promise<ApuracaoResult> {
  // Busca todos os votos da proposição no turno especificado
  const votos = await prisma.votacao.findMany({
    where: {
      proposicaoId,
      turno
    }
  })

  const votosSim = votos.filter(v => v.voto === 'SIM').length
  const votosNao = votos.filter(v => v.voto === 'NAO').length
  const abstencoes = votos.filter(v => v.voto === 'ABSTENCAO').length
  const ausentes = votos.filter(v => v.voto === 'AUSENTE').length
  const totalVotos = votos.length

  const quorum = calcularQuorum(tipoQuorum, totalMembros, totalVotos - ausentes)
  const quorumAtingido = quorum.temQuorum

  let resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE' | 'SEM_QUORUM'

  if (!quorumAtingido) {
    resultado = 'SEM_QUORUM'
  } else if (votosSim > votosNao && votosSim >= quorum.minVotosAprovacao) {
    resultado = 'APROVADA'
  } else if (votosNao > votosSim) {
    resultado = 'REJEITADA'
  } else if (votosSim === votosNao) {
    resultado = 'EMPATE'
  } else {
    resultado = 'REJEITADA' // Não atingiu mínimo necessário
  }

  logger.info('Apuração de resultado por turno', {
    action: 'apurar_resultado_turno',
    proposicaoId,
    turno,
    tipoQuorum,
    votosSim,
    votosNao,
    abstencoes,
    resultado
  })

  return {
    totalVotos,
    votosSim,
    votosNao,
    abstencoes,
    ausentes,
    quorumAtingido,
    resultado
  }
}

/**
 * Lista votos de uma proposição por turno
 */
export async function listarVotosProposicaoPorTurno(
  proposicaoId: string,
  turno: number
): Promise<Array<{
  parlamentarId: string
  nome: string
  voto: string
  dataVoto: Date
}>> {
  const votos = await prisma.votacao.findMany({
    where: {
      proposicaoId,
      turno
    },
    include: {
      parlamentar: {
        select: {
          nome: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return votos.map(v => ({
    parlamentarId: v.parlamentarId,
    nome: v.parlamentar.nome,
    voto: v.voto,
    dataVoto: v.createdAt
  }))
}

/**
 * Verifica se proposição requer dois turnos
 */
export function verificarDoisTurnos(tipoProposicao: string): {
  requer: boolean
  config: ReturnType<typeof getConfiguracaoTurno>
} {
  const config = getConfiguracaoTurno(tipoProposicao)
  return {
    requer: config.totalTurnos === 2,
    config
  }
}

/**
 * Resumo das regras de votação
 */
export const REGRAS_VOTACAO = {
  'RN-060': 'Quórum: Simples (maioria dos presentes), Absoluta (maioria do total), Qualificada (2/3)',
  'RN-061': 'Votação nominal obrigatória para: quórum qualificado, emendas à LO, vetos',
  'RN-062': 'Tipos de votação: Nominal, Simbólica, Secreta (casos específicos)',
  'RN-063': 'Impedimentos: autor, coautor, parentesco até 3º grau, interesse direto',
  'RN-064': 'Empate: nova votação na próxima sessão, persistindo empate = rejeitada',
  'RN-070': 'Voto é pessoal e intransferível',
  'RN-071': 'Apenas parlamentares presentes podem votar',
  'RN-072': 'Voto só pode ser alterado antes do encerramento',
  'RN-073': 'Resultado proclamado imediatamente após encerramento',
  'RN-074': 'Votação por turno: registra votos com indicação do turno (1º ou 2º)',
  'RN-075': 'Interstício: prazo mínimo entre turnos conforme tipo de matéria'
}
