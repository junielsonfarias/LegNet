/**
 * Serviço de Validação de Sessões
 * Implementa regras de negócio RN-040 a RN-044
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('sessao-validacao')

// Tipos de sessão
export type TipoSessao = 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'

// Status de sessão
export type StatusSessao =
  | 'AGENDADA'
  | 'CONVOCADA'
  | 'EM_ANDAMENTO'
  | 'SUSPENSA'
  | 'CONCLUIDA'
  | 'CANCELADA'
  | 'SEM_QUORUM'

// Tipo de presença
export type TipoPresenca = 'PRESENTE' | 'AUSENTE' | 'AUSENTE_JUSTIFICADO' | 'LICENCIADO'

// Resultado de validação
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  rule?: string
}

// Resultado do cálculo de quórum
export interface QuorumResult {
  totalMembros: number
  presentes: number
  quorumNecessario: number
  temQuorum: boolean
  tipo: 'instalacao' | 'votacao'
}

// Interface para configuração de sessão
export interface SessaoConfig {
  horarioInicio?: string
  horarioFim?: string
  duracaoMaximaMinutos?: number
  tempoMedioPorItem?: number
}

/**
 * RN-040: Valida quórum de instalação da sessão
 */
export async function validarQuorumInstalacao(
  sessaoId: string
): Promise<ValidationResult & { quorum?: QuorumResult }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca sessão com presenças
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
        where: {
          presente: true
        }
      },
      legislatura: true
    }
  })

  if (!sessao) {
    errors.push('Sessão não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-040' }
  }

  // Busca total de parlamentares ativos da legislatura
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

  const presentes = sessao.presencas.length

  // Quórum de instalação = maioria absoluta (metade + 1 dos membros)
  const quorumNecessario = Math.floor(totalMembros / 2) + 1

  const quorum: QuorumResult = {
    totalMembros,
    presentes,
    quorumNecessario,
    temQuorum: presentes >= quorumNecessario,
    tipo: 'instalacao'
  }

  if (!quorum.temQuorum) {
    errors.push(
      `RN-040: Quórum de instalação não atingido. ` +
      `Presentes: ${presentes}/${totalMembros}. ` +
      `Necessário: ${quorumNecessario} (maioria absoluta).`
    )
  }

  logger.info('Validação de quórum de instalação', {
    action: 'validar_quorum_instalacao',
    sessaoId,
    presentes,
    totalMembros,
    quorumNecessario,
    temQuorum: quorum.temQuorum
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-040',
    quorum
  }
}

/**
 * RN-041: Valida convocação da sessão
 */
export function validarConvocacao(
  sessao: {
    tipo: TipoSessao
    data: Date
    horaInicio: string
    local?: string
    dataCriacao: Date
  }
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const agora = new Date()
  const dataSessao = new Date(sessao.data)

  // Verifica antecedência mínima para sessão extraordinária
  if (sessao.tipo === 'EXTRAORDINARIA') {
    const horasAntecedencia = (dataSessao.getTime() - agora.getTime()) / (1000 * 60 * 60)

    if (horasAntecedencia < 24) {
      warnings.push(
        'RN-041: Sessão extraordinária com menos de 24h de antecedência. ' +
        'A convocação deve ser comunicada com antecedência adequada.'
      )
    }
  }

  // Verifica se local está definido
  if (!sessao.local) {
    warnings.push(
      'RN-041: Local da sessão não informado. Por padrão será na sede da Câmara.'
    )
  }

  // Verifica se data não é passada
  if (dataSessao < agora && sessao.tipo !== 'ORDINARIA') {
    errors.push('RN-041: Não é possível agendar sessão para data passada.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-041'
  }
}

/**
 * RN-043: Valida ordem dos trabalhos na sessão
 */
export function validarOrdemTrabalhos(
  itensOrdem: Array<{
    secao: string
    ordem: number
    tipo: string
  }>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Ordem esperada das seções
  const ordemEsperada = [
    'ABERTURA',
    'VERIFICACAO_QUORUM',
    'ATA_ANTERIOR',
    'EXPEDIENTE',
    'EXPLICACOES_PESSOAIS',
    'ORDEM_DO_DIA',
    'ENCERRAMENTO'
  ]

  // Agrupa itens por seção
  const secoes = new Set(itensOrdem.map(i => i.secao))
  const secoesOrdenadas = Array.from(secoes)

  // Verifica se todas as seções obrigatórias estão presentes
  const secoesObrigatorias = ['EXPEDIENTE', 'ORDEM_DO_DIA']
  for (const secao of secoesObrigatorias) {
    if (!secoes.has(secao)) {
      warnings.push(`RN-043: Seção obrigatória "${secao}" não encontrada na pauta.`)
    }
  }

  // Verifica ordem geral (simplificado)
  const temExpediente = secoesOrdenadas.indexOf('EXPEDIENTE')
  const temOrdemDia = secoesOrdenadas.indexOf('ORDEM_DO_DIA')

  if (temExpediente >= 0 && temOrdemDia >= 0 && temExpediente > temOrdemDia) {
    errors.push(
      'RN-043: Expediente deve preceder a Ordem do Dia conforme regimento.'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-043'
  }
}

/**
 * RN-044: Registra e valida presença
 */
export async function registrarPresenca(
  sessaoId: string,
  parlamentarId: string,
  presente: boolean,
  justificativa?: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Verifica se parlamentar existe e está ativo
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: parlamentarId },
    include: {
      mandatos: {
        where: { ativo: true },
        take: 1
      }
    }
  })

  if (!parlamentar) {
    errors.push('Parlamentar não encontrado.')
    return { valid: false, errors, warnings, rule: 'RN-044' }
  }

  if (!parlamentar.ativo || parlamentar.mandatos.length === 0) {
    errors.push('RN-044: Parlamentar não possui mandato ativo.')
    return { valid: false, errors, warnings, rule: 'RN-044' }
  }

  // Verifica se sessão está em andamento
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) {
    errors.push('Sessão não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-044' }
  }

  if (!['AGENDADA', 'CONVOCADA', 'EM_ANDAMENTO'].includes(sessao.status)) {
    errors.push('RN-044: Não é possível registrar presença em sessão encerrada.')
    return { valid: false, errors, warnings, rule: 'RN-044' }
  }

  // Se ausente, justificativa é recomendada
  if (!presente && !justificativa) {
    warnings.push(
      'RN-044: Recomenda-se registrar justificativa para ausências.'
    )
  }

  // Registra ou atualiza presença
  try {
    await prisma.presencaSessao.upsert({
      where: {
        sessaoId_parlamentarId: {
          sessaoId,
          parlamentarId
        }
      },
      update: {
        presente,
        justificativa: justificativa || undefined
      },
      create: {
        sessaoId,
        parlamentarId,
        presente,
        justificativa: justificativa || undefined
      }
    })

    logger.info('Presença registrada', {
      action: 'registrar_presenca',
      sessaoId,
      parlamentarId,
      presente,
      temJustificativa: !!justificativa
    })
  } catch (error) {
    logger.error('Erro ao registrar presença', error)
    errors.push('Erro ao registrar presença no banco de dados.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-044'
  }
}

/**
 * Valida transição de status da sessão
 */
export function validarTransicaoStatusSessao(
  statusAtual: StatusSessao,
  novoStatus: StatusSessao
): ValidationResult {
  const errors: string[] = []

  // Define transições válidas
  const transicoesValidas: Record<StatusSessao, StatusSessao[]> = {
    AGENDADA: ['CONVOCADA', 'CANCELADA'],
    CONVOCADA: ['EM_ANDAMENTO', 'CANCELADA', 'AGENDADA'],
    EM_ANDAMENTO: ['SUSPENSA', 'CONCLUIDA', 'SEM_QUORUM'],
    SUSPENSA: ['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'],
    CONCLUIDA: [],
    CANCELADA: ['AGENDADA'],
    SEM_QUORUM: ['AGENDADA']
  }

  const transicoesPermitidas = transicoesValidas[statusAtual] || []

  if (!transicoesPermitidas.includes(novoStatus)) {
    errors.push(
      `Transição de status inválida: ${statusAtual} -> ${novoStatus}. ` +
      `Transições permitidas: ${transicoesPermitidas.join(', ') || 'nenhuma'}.`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    rule: 'TRANSICAO_STATUS_SESSAO'
  }
}

/**
 * Calcula tempo estimado da sessão baseado na pauta
 */
export async function calcularTempoEstimadoSessao(
  sessaoId: string
): Promise<{ tempoTotalMinutos: number; detalhes: Array<{ item: string; tempo: number }> }> {
  // Tempos médios por tipo de item (em minutos)
  const temposPorTipo: Record<string, number> = {
    PROJETO_LEI: 15,
    PROJETO_LEI_COMPLEMENTAR: 20,
    PROJETO_RESOLUCAO: 10,
    REQUERIMENTO: 5,
    MOCAO: 5,
    INDICACAO: 5,
    VOTO_PESAR: 3,
    VOTO_APLAUSO: 3,
    COMUNICACAO: 5,
    DEFAULT: 10
  }

  // Busca itens da pauta
  const pauta = await prisma.pautaSessao.findFirst({
    where: { sessaoId },
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
    return { tempoTotalMinutos: 0, detalhes: [] }
  }

  const detalhes: Array<{ item: string; tempo: number }> = []
  let tempoTotal = 0

  // Tempo fixo para abertura, chamada, ata anterior
  const tempoFixo = 15 // minutos
  tempoTotal += tempoFixo
  detalhes.push({ item: 'Abertura e formalidades', tempo: tempoFixo })

  // Calcula tempo de cada item
  for (const item of pauta.itens) {
    const tipo = item.proposicao?.tipo || 'DEFAULT'
    const tempo = temposPorTipo[tipo] || temposPorTipo.DEFAULT

    detalhes.push({
      item: `${item.titulo || item.proposicao?.numero || `Item ${item.ordem}`}`,
      tempo
    })

    tempoTotal += tempo
  }

  // Tempo de encerramento
  const tempoEncerramento = 5
  tempoTotal += tempoEncerramento
  detalhes.push({ item: 'Encerramento', tempo: tempoEncerramento })

  logger.debug('Tempo estimado calculado', {
    action: 'calcular_tempo_sessao',
    sessaoId,
    tempoTotal,
    numItens: pauta.itens.length
  })

  return {
    tempoTotalMinutos: tempoTotal,
    detalhes
  }
}

/**
 * Verifica se sessão pode ser iniciada
 */
export async function verificarCondicoesInicioSessao(
  sessaoId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      pautaSessao: {
        include: {
          itens: true
        }
      }
    }
  })

  if (!sessao) {
    errors.push('Sessão não encontrada.')
    return { valid: false, errors, warnings }
  }

  // Verifica status
  if (!['AGENDADA', 'CONVOCADA'].includes(sessao.status)) {
    errors.push(`Sessão não pode ser iniciada. Status atual: ${sessao.status}`)
  }

  // Verifica se tem pauta (para sessões ordinárias e extraordinárias)
  if (['ORDINARIA', 'EXTRAORDINARIA'].includes(sessao.tipo)) {
    if (!sessao.pautaSessao || sessao.pautaSessao.itens.length === 0) {
      warnings.push('Sessão sem pauta definida. Recomenda-se definir a pauta antes de iniciar.')
    }
  }

  // Verifica quórum
  const quorumResult = await validarQuorumInstalacao(sessaoId)
  if (!quorumResult.valid) {
    errors.push(...quorumResult.errors)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Lista parlamentares presentes na sessão
 */
export async function listarPresencasSessao(
  sessaoId: string
): Promise<{
  presentes: Array<{ id: string; nome: string; horaRegistro?: Date }>
  ausentes: Array<{ id: string; nome: string; justificativa?: string }>
  total: number
}> {
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
        include: {
          parlamentar: true
        }
      },
      legislatura: true
    }
  })

  if (!sessao) {
    return { presentes: [], ausentes: [], total: 0 }
  }

  // Todos os parlamentares da legislatura
  const whereClauseParlamentares: {
    ativo: boolean
    mandatos?: { some: { legislaturaId: string; ativo: boolean } }
  } = { ativo: true }

  if (sessao.legislaturaId) {
    whereClauseParlamentares.mandatos = {
      some: {
        legislaturaId: sessao.legislaturaId,
        ativo: true
      }
    }
  }

  const todosParlamentares = await prisma.parlamentar.findMany({
    where: whereClauseParlamentares
  })

  const presencasMap = new Map(
    sessao.presencas.map(p => [p.parlamentarId, p])
  )

  const presentes: Array<{ id: string; nome: string; horaRegistro?: Date }> = []
  const ausentes: Array<{ id: string; nome: string; justificativa?: string }> = []

  for (const parlamentar of todosParlamentares) {
    const presenca = presencasMap.get(parlamentar.id)

    if (presenca?.presente) {
      presentes.push({
        id: parlamentar.id,
        nome: parlamentar.nome,
        horaRegistro: presenca.createdAt || undefined
      })
    } else {
      ausentes.push({
        id: parlamentar.id,
        nome: parlamentar.nome,
        justificativa: presenca?.justificativa || undefined
      })
    }
  }

  return {
    presentes,
    ausentes,
    total: todosParlamentares.length
  }
}
