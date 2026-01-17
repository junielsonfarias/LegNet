/**
 * Serviço de Validação de Proposições
 * Implementa regras de negócio RN-020 a RN-025
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type { TipoProposicao, StatusProposicao } from '@prisma/client'

const logger = createLogger('proposicao-validacao')

// Re-exporta tipos do Prisma para uso externo
export type { TipoProposicao, StatusProposicao }

// Matérias de iniciativa privativa do Executivo (RN-020)
const MATERIAS_INICIATIVA_EXECUTIVO = [
  'criacao_cargos',
  'funcoes_publicas',
  'aumento_remuneracao',
  'regime_juridico_servidores',
  'organizacao_administrativa',
  'orcamento_loa',
  'orcamento_ldo',
  'orcamento_ppa',
  'subsidios_isencoes'
]

// Palavras-chave que indicam matéria de iniciativa do Executivo
const PALAVRAS_CHAVE_INICIATIVA_EXECUTIVO = [
  'criação de cargo',
  'criar cargo',
  'cargos públicos',
  'aumento salarial',
  'reajuste salarial',
  'vencimentos',
  'remuneração de servidor',
  'regime jurídico',
  'estatuto dos servidores',
  'estrutura administrativa',
  'reorganização administrativa',
  'orçamento anual',
  'lei orçamentária',
  'diretrizes orçamentárias',
  'plano plurianual',
  'isenção fiscal',
  'incentivo fiscal',
  'subsídio',
  'benefício tributário'
]

// Siglas por tipo de proposição (baseado no schema Prisma)
export const SIGLA_PROPOSICAO: Record<string, string> = {
  PROJETO_LEI: 'PL',
  PROJETO_RESOLUCAO: 'PR',
  PROJETO_DECRETO: 'PD',
  INDICACAO: 'IND',
  REQUERIMENTO: 'REQ',
  MOCAO: 'MOC',
  VOTO_PESAR: 'VP',
  VOTO_APLAUSO: 'VA'
}

// Resultado de validação
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  rule?: string
}

// Interface para dados de proposição
export interface ProposicaoInput {
  tipo: string
  ementa?: string
  justificativa?: string
  texto?: string
  autorId: string
  autorTipo: 'PARLAMENTAR' | 'EXECUTIVO' | 'COMISSAO' | 'CIDADAO'
  assunto?: string
  materias?: string[]
}

/**
 * RN-020: Valida iniciativa privativa do Executivo
 */
export async function validarIniciativaPrivativa(
  input: ProposicaoInput
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Se é do Executivo, pode criar qualquer proposição
  if (input.autorTipo === 'EXECUTIVO') {
    return { valid: true, errors: [], warnings: [], rule: 'RN-020' }
  }

  // Verifica se é projeto de lei ou similar que pode afetar iniciativa privativa
  const tiposComRestricao = [
    'PROJETO_LEI',
    'PROJETO_LEI_COMPLEMENTAR',
    'PROJETO_DECRETO_LEGISLATIVO'
  ]

  if (!tiposComRestricao.includes(input.tipo)) {
    return { valid: true, errors: [], warnings: [], rule: 'RN-020' }
  }

  // Analisa o texto para detectar matéria de iniciativa do Executivo
  const textoCompleto = `${input.ementa || ''} ${input.justificativa || ''} ${input.texto || ''}`.toLowerCase()

  for (const palavraChave of PALAVRAS_CHAVE_INICIATIVA_EXECUTIVO) {
    if (textoCompleto.includes(palavraChave.toLowerCase())) {
      errors.push(
        `RN-020: Matéria de iniciativa privativa do Executivo detectada: "${palavraChave}". ` +
        'Projetos sobre criação de cargos, aumento de remuneração, organização administrativa, ' +
        'orçamento e benefícios fiscais são de iniciativa exclusiva do Prefeito.'
      )
      break
    }
  }

  // Verifica matérias explicitamente marcadas
  if (input.materias?.some(m => MATERIAS_INICIATIVA_EXECUTIVO.includes(m))) {
    errors.push(
      'RN-020: Esta matéria é de iniciativa privativa do Poder Executivo.'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-020'
  }
}

/**
 * RN-021: Gera número sequencial para proposição
 */
export async function gerarNumeroProposicao(
  tipo: string,
  ano?: number
): Promise<string> {
  const anoAtual = ano || new Date().getFullYear()
  const sigla = SIGLA_PROPOSICAO[tipo] || tipo.substring(0, 2)

  // Busca último número do tipo no ano (usando contagem como proxy)
  const count = await prisma.proposicao.count({
    where: {
      tipo: tipo as TipoProposicao,
      ano: anoAtual
    }
  })

  const proximoNumero = count + 1
  const numeroFormatado = String(proximoNumero).padStart(3, '0')

  logger.info(`Número gerado para proposição`, {
    action: 'gerar_numero',
    tipo,
    ano: anoAtual,
    numero: proximoNumero
  })

  return `${sigla} ${numeroFormatado}/${anoAtual}`
}

/**
 * RN-022: Valida requisitos mínimos da proposição
 */
export function validarRequisitosMinimos(
  input: ProposicaoInput
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Ementa é sempre obrigatória
  if (!input.ementa || input.ementa.trim().length < 10) {
    errors.push('RN-022: Ementa é obrigatória e deve ter pelo menos 10 caracteres.')
  }

  // Justificativa obrigatória para projetos
  const tiposComJustificativa = [
    'PROJETO_LEI',
    'PROJETO_LEI_COMPLEMENTAR',
    'PROJETO_RESOLUCAO',
    'PROJETO_DECRETO_LEGISLATIVO',
    'PROJETO_EMENDA_LEI_ORGANICA'
  ]

  if (tiposComJustificativa.includes(input.tipo)) {
    if (!input.justificativa || input.justificativa.trim().length < 50) {
      errors.push('RN-022: Justificativa é obrigatória para projetos e deve ter pelo menos 50 caracteres.')
    }
  }

  // Texto articulado obrigatório para projetos (exceto indicações e requerimentos)
  const tiposComTextoArticulado = [
    'PROJETO_LEI',
    'PROJETO_LEI_COMPLEMENTAR',
    'PROJETO_RESOLUCAO',
    'PROJETO_DECRETO_LEGISLATIVO',
    'PROJETO_EMENDA_LEI_ORGANICA'
  ]

  if (tiposComTextoArticulado.includes(input.tipo)) {
    if (!input.texto || input.texto.trim().length < 100) {
      errors.push('RN-022: Texto articulado é obrigatório para projetos.')
    }

    // Verifica estrutura básica de texto legislativo
    const textoLower = (input.texto || '').toLowerCase()
    if (!textoLower.includes('art.') && !textoLower.includes('artigo')) {
      warnings.push('RN-022: O texto não parece conter artigos. Verifique a estrutura.')
    }
  }

  // Autor é sempre obrigatório
  if (!input.autorId) {
    errors.push('RN-022: Identificação do autor é obrigatória.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-022'
  }
}

/**
 * RN-023: Verifica matéria análoga rejeitada na mesma sessão legislativa
 */
export async function verificarMateriaAnaloga(
  ementa: string,
  ano: number,
  legislaturaId?: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposições rejeitadas ou vetadas no mesmo ano/legislatura
  const whereClause: any = {
    ano,
    status: {
      in: ['REJEITADA', 'VETADA', 'ARQUIVADA']
    }
  }

  if (legislaturaId) {
    whereClause.legislaturaId = legislaturaId
  }

  const proposicoesRejeitadas = await prisma.proposicao.findMany({
    where: whereClause,
    select: {
      id: true,
      ementa: true,
      numero: true,
      status: true
    }
  })

  // Verifica similaridade de ementa (simplificado)
  const ementaNormalizada = normalizarTexto(ementa)

  for (const prop of proposicoesRejeitadas) {
    const propEmentaNormalizada = normalizarTexto(prop.ementa || '')
    const similaridade = calcularSimilaridade(ementaNormalizada, propEmentaNormalizada)

    if (similaridade > 0.7) {
      errors.push(
        `RN-023: Existe matéria similar já ${prop.status.toLowerCase()} nesta sessão legislativa: ` +
        `${prop.numero} - "${prop.ementa?.substring(0, 50)}...". ` +
        'Não é permitido reapresentar matéria idêntica na mesma sessão legislativa.'
      )
    } else if (similaridade > 0.5) {
      warnings.push(
        `Atenção: Existe matéria possivelmente similar: ${prop.numero}`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-023'
  }
}

/**
 * RN-024: Valida emenda a proposição
 */
export async function validarEmenda(
  emendaInput: {
    proposicaoId: string
    texto: string
    tipo: 'ADITIVA' | 'MODIFICATIVA' | 'SUPRESSIVA' | 'SUBSTITUTIVA'
    autorId: string
  }
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição principal
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: emendaInput.proposicaoId },
    include: {
      autor: true
    }
  })

  if (!proposicao) {
    errors.push('RN-024: Proposição principal não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-024' }
  }

  // Verifica status da proposição
  const statusPermitidos = ['EM_TRAMITACAO', 'EM_PAUTA', 'EM_DISCUSSAO']
  if (!statusPermitidos.includes(proposicao.status)) {
    errors.push(
      'RN-024: Emendas só podem ser apresentadas antes do início da votação.'
    )
  }

  // Verifica se emenda pode aumentar despesa
  const textoLower = emendaInput.texto.toLowerCase()
  const palavrasAumentoDespesa = [
    'aumento', 'majoração', 'acréscimo', 'adicional',
    'novo cargo', 'novas vagas', 'extensão de benefício'
  ]

  for (const palavra of palavrasAumentoDespesa) {
    if (textoLower.includes(palavra)) {
      warnings.push(
        'RN-024: Emendas que aumentam despesa devem indicar fonte de recursos.'
      )
      break
    }
  }

  // Verifica pertinência temática (simplificado)
  if (emendaInput.texto.length < 20) {
    errors.push('RN-024: Texto da emenda muito curto.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-024'
  }
}

/**
 * RN-025: Valida projeto de iniciativa popular
 */
export function validarIniciativaPopular(
  input: {
    numeroAssinaturas: number
    totalEleitorado: number
    signatarios: Array<{ nome: string; cpf?: string; titulo?: string }>
  }
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Mínimo de 5% do eleitorado
  const percentualMinimo = 0.05
  const assinaturasNecessarias = Math.ceil(input.totalEleitorado * percentualMinimo)

  if (input.numeroAssinaturas < assinaturasNecessarias) {
    errors.push(
      `RN-025: São necessárias pelo menos ${assinaturasNecessarias} assinaturas ` +
      `(5% de ${input.totalEleitorado} eleitores). Apresentadas: ${input.numeroAssinaturas}.`
    )
  }

  // Verifica identificação dos signatários
  const siginatoriosSemIdentificacao = input.signatarios.filter(
    s => !s.nome || (!s.cpf && !s.titulo)
  )

  if (siginatoriosSemIdentificacao.length > 0) {
    errors.push(
      `RN-025: ${siginatoriosSemIdentificacao.length} signatários sem identificação completa. ` +
      'Todos devem ter nome e CPF ou título de eleitor.'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-025'
  }
}

/**
 * Valida transição de status da proposição
 * Baseado no enum StatusProposicao do Prisma: APRESENTADA, EM_TRAMITACAO, APROVADA, REJEITADA, ARQUIVADA, VETADA
 */
export function validarTransicaoStatus(
  statusAtual: string,
  novoStatus: string
): ValidationResult {
  const errors: string[] = []

  // Define transições válidas (baseado no schema Prisma atual)
  const transicoesValidas: Record<string, string[]> = {
    APRESENTADA: ['EM_TRAMITACAO', 'ARQUIVADA'],
    EM_TRAMITACAO: ['APROVADA', 'REJEITADA', 'ARQUIVADA'],
    APROVADA: ['VETADA', 'ARQUIVADA'],
    REJEITADA: ['ARQUIVADA'],
    VETADA: ['ARQUIVADA'],
    ARQUIVADA: []
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
    rule: 'TRANSICAO_STATUS'
  }
}

/**
 * Valida proposição completa antes de apresentar
 */
export async function validarProposicaoCompleta(
  input: ProposicaoInput,
  legislaturaId?: string
): Promise<ValidationResult> {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  // 1. Valida requisitos mínimos (RN-022)
  const resultRequisitos = validarRequisitosMinimos(input)
  allErrors.push(...resultRequisitos.errors)
  allWarnings.push(...resultRequisitos.warnings)

  // 2. Valida iniciativa privativa (RN-020)
  const resultIniciativa = await validarIniciativaPrivativa(input)
  allErrors.push(...resultIniciativa.errors)
  allWarnings.push(...resultIniciativa.warnings)

  // 3. Verifica matéria análoga (RN-023)
  if (input.ementa) {
    const ano = new Date().getFullYear()
    const resultAnaloga = await verificarMateriaAnaloga(input.ementa, ano, legislaturaId)
    allErrors.push(...resultAnaloga.errors)
    allWarnings.push(...resultAnaloga.warnings)
  }

  logger.info('Validação completa de proposição', {
    action: 'validar_proposicao',
    tipo: input.tipo,
    valido: allErrors.length === 0,
    erros: allErrors.length,
    avisos: allWarnings.length
  })

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}

// Funções auxiliares

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim()
}

function calcularSimilaridade(texto1: string, texto2: string): number {
  const palavras1 = new Set(texto1.split(' '))
  const palavras2 = new Set(texto2.split(' '))

  const arr1 = Array.from(palavras1)
  const arr2 = Array.from(palavras2)

  const intersecao = new Set(arr1.filter(x => palavras2.has(x)))
  const uniao = new Set([...arr1, ...arr2])

  return uniao.size > 0 ? intersecao.size / uniao.size : 0
}
