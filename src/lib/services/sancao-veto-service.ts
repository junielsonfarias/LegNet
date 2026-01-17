/**
 * Serviço de Sanção, Veto e Promulgação
 * Implementa regras de negócio RN-080 a RN-087
 *
 * NOTA: Este serviço fornece validações para o fluxo pós-aprovação.
 * A persistência de dados adicionais (dataVeto, prazoSancao, etc.)
 * deve ser adicionada ao schema do Prisma quando necessário.
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { addBusinessDays, differenceInDays, isPast } from '@/lib/utils/date'

const logger = createLogger('sancao-veto')

// Tipos de veto (RN-082)
export type TipoVeto = 'TOTAL' | 'PARCIAL'

// Motivo do veto (RN-083)
export type MotivoVeto = 'INCONSTITUCIONALIDADE' | 'INTERESSE_PUBLICO'

// Status do projeto após aprovação (conceitual)
export type StatusPosAprovacao =
  | 'ENVIADA_EXECUTIVO'
  | 'SANCIONADA'
  | 'VETADA'
  | 'VETO_PARCIAL'
  | 'VETO_MANTIDO'
  | 'VETO_REJEITADO'
  | 'PROMULGADA'
  | 'PUBLICADA'

// Resultado de validação
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  rule?: string
}

// Dados de veto
export interface VetoData {
  proposicaoId: string
  tipo: TipoVeto
  motivo: MotivoVeto
  razoes: string
  dispositivosVetados?: string[] // Para veto parcial
  dataVeto?: Date
}

// Constantes de prazo
const PRAZO_SANCAO_DIAS_UTEIS = 15
const PRAZO_APRECIACAO_VETO_DIAS = 30
const PRAZO_COMUNICACAO_RAZOES_HORAS = 48

/**
 * RN-080: Valida envio ao Executivo após aprovação
 */
export async function validarEnvioAoExecutivo(
  proposicaoId: string
): Promise<ValidationResult & { prazoSancao?: Date }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-080' }
  }

  // Verifica status
  if (proposicao.status !== 'APROVADA') {
    errors.push('RN-080: Apenas proposições aprovadas podem ser enviadas ao Executivo.')
    return { valid: false, errors, warnings, rule: 'RN-080' }
  }

  // Verifica prazo de 48h após votação/aprovação
  if (proposicao.dataVotacao) {
    const horasDesdeAprovacao = (new Date().getTime() - new Date(proposicao.dataVotacao).getTime()) / (1000 * 60 * 60)

    if (horasDesdeAprovacao > 48) {
      warnings.push(
        'RN-080: Prazo de 48h para envio ao Executivo ultrapassado.'
      )
    }
  }

  // Calcula prazo de sanção (15 dias úteis)
  const prazoSancao = addBusinessDays(new Date(), PRAZO_SANCAO_DIAS_UTEIS)

  logger.info('Validação para envio ao Executivo', {
    action: 'validar_envio_executivo',
    proposicaoId,
    prazoSancao,
    valido: errors.length === 0
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-080',
    prazoSancao: prazoSancao || undefined
  }
}

/**
 * RN-081: Verifica prazo de sanção
 * Retorna se o prazo expirou (sanção tácita)
 */
export function verificarPrazoSancao(
  dataEnvio: Date
): { expirado: boolean; diasRestantes: number; prazoFinal: Date } {
  const prazoFinal = addBusinessDays(dataEnvio, PRAZO_SANCAO_DIAS_UTEIS) || new Date()
  const diasRestantes = differenceInDays(prazoFinal, new Date())
  const expirado = isPast(prazoFinal)

  return {
    expirado,
    diasRestantes,
    prazoFinal
  }
}

/**
 * RN-081: Valida sanção expressa
 */
export async function validarSancao(
  proposicaoId: string,
  numeroLei?: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-081' }
  }

  if (proposicao.status !== 'APROVADA') {
    errors.push('RN-081: Apenas proposições aprovadas podem ser sancionadas.')
    return { valid: false, errors, warnings, rule: 'RN-081' }
  }

  if (!numeroLei) {
    warnings.push('RN-081: Recomenda-se informar o número da lei ao registrar sanção.')
  }

  logger.info('Validação de sanção', {
    action: 'validar_sancao',
    proposicaoId,
    numeroLei,
    valido: errors.length === 0
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-081'
  }
}

/**
 * RN-082 e RN-083: Valida dados de veto
 */
export async function validarVeto(
  data: VetoData
): Promise<ValidationResult & { prazoApreciacao?: Date }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: data.proposicaoId }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-082' }
  }

  if (proposicao.status !== 'APROVADA') {
    errors.push('RN-082: Apenas proposições aprovadas podem ser vetadas.')
    return { valid: false, errors, warnings, rule: 'RN-082' }
  }

  // Valida veto parcial (RN-082)
  if (data.tipo === 'PARCIAL') {
    if (!data.dispositivosVetados || data.dispositivosVetados.length === 0) {
      errors.push(
        'RN-082: Veto parcial deve especificar os dispositivos vetados ' +
        '(artigos, parágrafos, incisos ou alíneas).'
      )
    }
  }

  // Valida razões do veto (RN-083)
  if (!data.razoes || data.razoes.trim().length < 50) {
    errors.push(
      'RN-083: Razões do veto são obrigatórias e devem ser fundamentadas.'
    )
  }

  if (!['INCONSTITUCIONALIDADE', 'INTERESSE_PUBLICO'].includes(data.motivo)) {
    errors.push(
      'RN-083: Veto deve ser justificado por inconstitucionalidade ou ' +
      'contrariedade ao interesse público.'
    )
  }

  // Calcula prazo de apreciação (30 dias)
  const dataVeto = data.dataVeto || new Date()
  const prazoApreciacao = new Date(dataVeto)
  prazoApreciacao.setDate(prazoApreciacao.getDate() + PRAZO_APRECIACAO_VETO_DIAS)

  // Aviso sobre prazo de comunicação das razões
  warnings.push(
    `RN-083: As razões do veto devem ser comunicadas em até ${PRAZO_COMUNICACAO_RAZOES_HORAS} horas.`
  )

  logger.info('Validação de veto', {
    action: 'validar_veto',
    proposicaoId: data.proposicaoId,
    tipo: data.tipo,
    motivo: data.motivo,
    prazoApreciacao,
    valido: errors.length === 0
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-082',
    prazoApreciacao
  }
}

/**
 * RN-084: Calcula prazo de apreciação de veto
 */
export function calcularPrazoApreciacaoVeto(
  dataVeto: Date
): { prazoFinal: Date; diasRestantes: number; vencido: boolean; urgente: boolean } {
  const prazoFinal = new Date(dataVeto)
  prazoFinal.setDate(prazoFinal.getDate() + PRAZO_APRECIACAO_VETO_DIAS)

  const diasRestantes = differenceInDays(prazoFinal, new Date())
  const vencido = diasRestantes < 0
  const urgente = diasRestantes <= 7 && !vencido

  return {
    prazoFinal,
    diasRestantes,
    vencido,
    urgente
  }
}

/**
 * Valida resultado da apreciação do veto
 */
export function validarApreciacaoVeto(
  resultado: 'MANTIDO' | 'REJEITADO',
  votacao?: {
    votosSim: number
    votosNao: number
    abstencoes: number
    totalMembros: number
  }
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!votacao) {
    errors.push('Dados da votação são obrigatórios para apreciação de veto.')
    return { valid: false, errors, warnings }
  }

  // Para rejeitar veto, necessária maioria absoluta
  const quorumRejeicao = Math.floor(votacao.totalMembros / 2) + 1

  if (resultado === 'REJEITADO') {
    if (votacao.votosSim < quorumRejeicao) {
      errors.push(
        `Rejeição de veto requer maioria absoluta (${quorumRejeicao} votos). ` +
        `Votos a favor da rejeição: ${votacao.votosSim}.`
      )
    }

    warnings.push(
      'Veto rejeitado: o projeto deve ser promulgado pelo Presidente da Câmara ' +
      'em até 48 horas.'
    )
  } else {
    warnings.push('Veto mantido: o projeto será arquivado.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valida promulgação pelo Presidente da Câmara
 */
export async function validarPromulgacao(
  proposicaoId: string,
  numeroLei: string,
  vetoRejeitado: boolean
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  if (!numeroLei || numeroLei.trim().length === 0) {
    errors.push('Número da lei é obrigatório para promulgação.')
    return { valid: false, errors, warnings }
  }

  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings }
  }

  // Verifica condições para promulgação pelo Presidente da Câmara
  if (vetoRejeitado) {
    if (proposicao.status !== 'VETADA') {
      errors.push('Proposição não está vetada para promulgação por rejeição de veto.')
    }
    warnings.push(
      'Promulgação pelo Presidente da Câmara: ocorre quando o veto é rejeitado ' +
      'ou quando o Prefeito não sanciona no prazo.'
    )
  }

  // Resoluções e decretos legislativos são promulgados diretamente
  const tiposSemSancao = ['PROJETO_RESOLUCAO', 'PROJETO_DECRETO']
  if (tiposSemSancao.includes(proposicao.tipo)) {
    warnings.push(
      `${proposicao.tipo === 'PROJETO_RESOLUCAO' ? 'Resoluções' : 'Decretos legislativos'} ` +
      'são promulgados pelo Presidente da Câmara sem necessidade de sanção.'
    )
  }

  logger.info('Validação de promulgação', {
    action: 'validar_promulgacao',
    proposicaoId,
    numeroLei,
    vetoRejeitado,
    valido: errors.length === 0
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valida dados de publicação no Diário Oficial
 */
export function validarPublicacao(
  dadosPublicacao: {
    diarioOficial: string
    dataPublicacao: Date
    pagina?: string
    edicao?: string
  }
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!dadosPublicacao.diarioOficial || dadosPublicacao.diarioOficial.trim().length === 0) {
    errors.push('Nome do Diário Oficial é obrigatório.')
  }

  if (!dadosPublicacao.dataPublicacao) {
    errors.push('Data de publicação é obrigatória.')
  }

  // Lei entra em vigor após publicação (geralmente 45 dias ou conforme cláusula)
  warnings.push(
    'Verificar cláusula de vigência para determinar data de entrada em vigor. ' +
    'Por padrão, leis municipais entram em vigor 45 dias após publicação.'
  )

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Busca proposições vetadas pendentes de apreciação
 */
export async function listarVetosPendentes(): Promise<Array<{
  proposicaoId: string
  numero: string
  titulo: string
  ementa: string
}>> {
  const vetos = await prisma.proposicao.findMany({
    where: {
      status: 'VETADA'
    },
    select: {
      id: true,
      numero: true,
      titulo: true,
      ementa: true
    },
    orderBy: {
      dataVotacao: 'asc'
    }
  })

  return vetos.map(v => ({
    proposicaoId: v.id,
    numero: v.numero,
    titulo: v.titulo,
    ementa: v.ementa
  }))
}

/**
 * Registra transição para arquivamento após veto mantido
 */
export async function arquivarPorVetoMantido(
  proposicaoId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: proposicaoId }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings }
    }

    if (proposicao.status !== 'VETADA') {
      errors.push('Apenas proposições vetadas podem ser arquivadas por manutenção de veto.')
      return { valid: false, errors, warnings }
    }

    await prisma.proposicao.update({
      where: { id: proposicaoId },
      data: {
        status: 'ARQUIVADA'
      }
    })

    logger.info('Proposição arquivada por veto mantido', {
      action: 'arquivar_veto_mantido',
      proposicaoId
    })

    return {
      valid: true,
      errors,
      warnings
    }
  } catch (error) {
    logger.error('Erro ao arquivar proposição', error)
    errors.push('Erro ao atualizar proposição.')
    return { valid: false, errors, warnings }
  }
}

/**
 * Resumo das regras de sanção/veto
 */
export const REGRAS_SANCAO_VETO = {
  'RN-080': 'Projeto aprovado deve ser enviado ao Executivo em 48h',
  'RN-081': 'Prazo de sanção: 15 dias úteis. Silêncio = sanção tácita',
  'RN-082': 'Veto pode ser total ou parcial (artigos, parágrafos, incisos, alíneas)',
  'RN-083': 'Razões do veto: inconstitucionalidade ou interesse público, comunicadas em 48h',
  'RN-084': 'Veto deve ser apreciado em 30 dias',
  'RN-085': 'Rejeição de veto requer maioria absoluta (votação nominal)',
  'RN-086': 'Veto rejeitado: promulgação pelo Presidente da Câmara em 48h',
  'RN-087': 'Lei entra em vigor após publicação no Diário Oficial'
}
