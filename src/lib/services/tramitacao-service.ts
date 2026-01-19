/**
 * Serviço de Tramitação de Proposições
 * Implementa regras de negócio RN-030 a RN-037
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { addBusinessDays, differenceInDays } from '@/lib/utils/date'

const logger = createLogger('tramitacao')

// Tipos de parecer (RN-034)
export type TipoParecer = 'FAVORAVEL' | 'CONTRARIO' | 'FAVORAVEL_COM_EMENDAS' | 'PELA_INCONSTITUCIONALIDADE' | 'INCOMPETENCIA'

// Regime de tramitação
export type RegimeTramitacao = 'NORMAL' | 'PRIORIDADE' | 'URGENCIA' | 'URGENCIA_URGENTISSIMA'

// Resultado de validação
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  rule?: string
}

// Dados de tramitação
export interface TramitacaoData {
  proposicaoId: string
  tipoTramitacaoId: string
  unidadeId: string
  observacoes?: string
  responsavelId?: string
}

// Prazos por regime de tramitação (RN-032)
const PRAZOS_PARECER_DIAS: Record<RegimeTramitacao, number> = {
  NORMAL: 15,
  PRIORIDADE: 10,
  URGENCIA: 5,
  URGENCIA_URGENTISSIMA: 0 // Imediato
}

/**
 * RN-030: Valida se proposição deve passar pela CLJ
 */
export async function validarPassagemCLJ(
  proposicaoId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição com histórico de tramitação
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    include: {
      tramitacoes: {
        include: {
          unidade: true
        }
      }
    }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-030' }
  }

  // Tipos que dispensam CLJ
  const tiposDispensadosCLJ = ['REQUERIMENTO', 'MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO']

  if (tiposDispensadosCLJ.includes(proposicao.tipo)) {
    return { valid: true, errors, warnings, rule: 'RN-030' }
  }

  // Verifica se já passou pela CLJ
  const cljComissao = await prisma.comissao.findFirst({
    where: {
      nome: { contains: 'CLJ', mode: 'insensitive' },
      ativa: true
    }
  })

  if (!cljComissao) {
    warnings.push('RN-030: Comissão de Legislação e Justiça não encontrada no sistema.')
    return { valid: true, errors, warnings, rule: 'RN-030' }
  }

  // Busca unidade correspondente à CLJ
  const unidadeCLJ = await prisma.tramitacaoUnidade.findFirst({
    where: {
      nome: { contains: 'CLJ', mode: 'insensitive' },
      ativo: true
    }
  })

  if (unidadeCLJ) {
    const passouPelaCLJ = proposicao.tramitacoes.some(
      t => t.unidadeId === unidadeCLJ.id
    )

    if (!passouPelaCLJ) {
      warnings.push(
        'RN-030: Proposição ainda não tramitou pela CLJ. ' +
        'A passagem pela Comissão de Legislação e Justiça é obrigatória.'
      )
    }
  }

  return {
    valid: true, // Aviso, não erro bloqueante
    errors,
    warnings,
    rule: 'RN-030'
  }
}

/**
 * RN-031: Distribui proposição às comissões temáticas
 */
export async function sugerirComissoesDistribuicao(
  proposicaoId: string
): Promise<Array<{ comissaoId: string; sigla: string; nome: string; motivo: string }>> {
  const sugestoes: Array<{ comissaoId: string; sigla: string; nome: string; motivo: string }> = []

  // Busca proposição
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: {
      tipo: true,
      ementa: true,
      titulo: true
    }
  })

  if (!proposicao) return sugestoes

  // Busca comissões ativas
  const comissoes = await prisma.comissao.findMany({
    where: { ativa: true }
  })

  const textoAnalise = `${proposicao.ementa || ''} ${proposicao.titulo || ''}`.toLowerCase()

  // CLJ sempre é sugerida para projetos de lei
  const clj = comissoes.find(c => c.nome.toUpperCase().includes('CLJ') || c.nome.toUpperCase().includes('LEGISLAÇÃO'))
  if (clj && ['PROJETO_LEI', 'PROJETO_RESOLUCAO', 'PROJETO_DECRETO'].includes(proposicao.tipo)) {
    sugestoes.push({
      comissaoId: clj.id,
      sigla: 'CLJ',
      nome: clj.nome,
      motivo: 'RN-030: Análise obrigatória de constitucionalidade e legalidade'
    })
  }

  // Mapeamento de palavras-chave para comissões (baseado no nome)
  const mapeamento: Record<string, { palavras: string[]; nomeContains: string[] }> = {
    CFO: { palavras: ['orçamento', 'financeiro', 'fiscal', 'tributo', 'imposto', 'taxa', 'receita', 'despesa', 'crédito'], nomeContains: ['FINANÇAS', 'ORÇAMENTO'] },
    CES: { palavras: ['educação', 'saúde', 'assistência', 'hospital', 'escola', 'creche', 'social'], nomeContains: ['EDUCAÇÃO', 'SAÚDE', 'SOCIAL'] },
    COU: { palavras: ['obra', 'infraestrutura', 'urbanismo', 'zoneamento', 'construção', 'trânsito', 'mobilidade'], nomeContains: ['OBRAS', 'URBANISMO', 'INFRAESTRUTURA'] },
    CMA: { palavras: ['meio ambiente', 'ambiental', 'sustentabilidade', 'resíduos', 'saneamento'], nomeContains: ['AMBIENTE', 'MEIO AMBIENTE'] }
  }

  for (const [siglaRef, config] of Object.entries(mapeamento)) {
    if (config.palavras.some(p => textoAnalise.includes(p))) {
      const comissao = comissoes.find(c =>
        config.nomeContains.some(n => c.nome.toUpperCase().includes(n))
      )
      if (comissao && !sugestoes.some(s => s.comissaoId === comissao.id)) {
        sugestoes.push({
          comissaoId: comissao.id,
          sigla: siglaRef,
          nome: comissao.nome,
          motivo: `RN-031: Matéria relacionada a ${siglaRef}`
        })
      }
    }
  }

  logger.debug('Sugestões de comissões geradas', {
    action: 'sugerir_comissoes',
    proposicaoId,
    sugestoes: sugestoes.map(s => s.nome)
  })

  return sugestoes
}

/**
 * RN-032: Calcula prazo de parecer baseado no regime
 */
export function calcularPrazoParecer(
  regime: RegimeTramitacao,
  dataDistribuicao: Date = new Date()
): { prazo: Date | null; diasUteis: number } {
  const diasUteis = PRAZOS_PARECER_DIAS[regime]

  if (diasUteis === 0) {
    return { prazo: null, diasUteis: 0 } // Imediato
  }

  const prazo = addBusinessDays(dataDistribuicao, diasUteis)

  return {
    prazo,
    diasUteis
  }
}

/**
 * RN-033: Valida se proposição pode ser votada
 */
export async function validarProposicaoParaVotacao(
  proposicaoId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição com tramitações
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    include: {
      tramitacoes: {
        include: {
          unidade: true
        }
      }
    }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-033' }
  }

  // Tipos que dispensam parecer
  const tiposDispensadosParecer = ['REQUERIMENTO', 'MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO']

  if (tiposDispensadosParecer.includes(proposicao.tipo)) {
    return { valid: true, errors, warnings, rule: 'RN-033' }
  }

  // Verifica se tem tramitação com parecer
  const tramitacaoComParecer = proposicao.tramitacoes.find(t => t.parecer !== null)

  if (!tramitacaoComParecer) {
    warnings.push(
      'RN-033: Proposição não possui parecer. ' +
      'Recomenda-se aguardar parecer da comissão antes da votação.'
    )
  } else if (tramitacaoComParecer.parecer === 'PELA_INCONSTITUCIONALIDADE') {
    errors.push(
      'RN-033: Proposição com parecer pela inconstitucionalidade não pode ser votada.'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-033'
  }
}

/**
 * RN-035: Registra movimentação de tramitação
 */
export async function registrarMovimentacao(
  data: TramitacaoData
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Verifica se proposição existe
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: data.proposicaoId }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings, rule: 'RN-035' }
    }

    // Cria registro de tramitação
    const tramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId: data.proposicaoId,
        tipoTramitacaoId: data.tipoTramitacaoId,
        unidadeId: data.unidadeId,
        observacoes: data.observacoes,
        responsavelId: data.responsavelId,
        dataEntrada: new Date(),
        status: 'EM_ANDAMENTO'
      }
    })

    // Cria entrada no histórico
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacao.id,
        acao: 'DISTRIBUICAO',
        descricao: `Distribuído para unidade`,
        data: new Date()
      }
    })

    // Atualiza status da proposição se necessário
    if (proposicao.status === 'APRESENTADA') {
      await prisma.proposicao.update({
        where: { id: data.proposicaoId },
        data: {
          status: 'EM_TRAMITACAO'
        }
      })
    }

    logger.info('Movimentação registrada', {
      action: 'registrar_movimentacao',
      tramitacaoId: tramitacao.id,
      proposicaoId: data.proposicaoId,
      unidade: data.unidadeId
    })

    return {
      valid: true,
      errors,
      warnings,
      rule: 'RN-035',
      tramitacaoId: tramitacao.id
    }
  } catch (error) {
    logger.error('Erro ao registrar movimentação', error)
    errors.push('Erro ao registrar movimentação.')
    return { valid: false, errors, warnings, rule: 'RN-035' }
  }
}

/**
 * RN-036: Cria notificação de tramitação
 */
export async function criarNotificacaoTramitacao(
  tramitacaoId: string,
  canal: string,
  destinatario: string,
  mensagem: string
): Promise<void> {
  try {
    await prisma.tramitacaoNotificacao.create({
      data: {
        tramitacaoId,
        canal,
        destinatario,
        mensagem,
        status: 'PENDENTE'
      }
    })

    logger.info('Notificação criada', {
      action: 'criar_notificacao',
      tramitacaoId,
      canal,
      destinatario
    })
  } catch (error) {
    logger.error('Erro ao criar notificação', error)
  }
}

/**
 * RN-037: Verifica prazos vencidos e próximos de vencer
 */
export async function verificarPrazosVencendo(
  diasAntecedencia: number = 3
): Promise<Array<{
  proposicaoId: string
  numero: string
  unidade: string
  prazoVencimento: Date
  diasRestantes: number
  vencido: boolean
}>> {
  const hoje = new Date()
  const limiteAlerta = addBusinessDays(hoje, diasAntecedencia)

  // Busca tramitações com prazo
  const tramitacoes = await prisma.tramitacao.findMany({
    where: {
      prazoVencimento: {
        not: null,
        lte: limiteAlerta || undefined
      },
      status: {
        not: 'CONCLUIDA'
      }
    },
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true
        }
      },
      unidade: {
        select: {
          nome: true
        }
      }
    }
  })

  return tramitacoes
    .filter(t => t.prazoVencimento !== null)
    .map(t => {
      const diasRestantes = differenceInDays(t.prazoVencimento as Date, hoje)

      return {
        proposicaoId: t.proposicaoId,
        numero: t.proposicao.numero || '',
        unidade: t.unidade?.nome || '',
        prazoVencimento: t.prazoVencimento as Date,
        diasRestantes,
        vencido: diasRestantes < 0
      }
    })
}

/**
 * Obtém histórico completo de tramitação
 */
export async function obterHistoricoTramitacao(
  proposicaoId: string
): Promise<Array<{
  data: Date
  unidade: string
  observacoes?: string
  responsavel?: string
  prazo?: Date
  status: string
}>> {
  const tramitacoes = await prisma.tramitacao.findMany({
    where: { proposicaoId },
    include: {
      unidade: true,
      responsavel: true
    },
    orderBy: { dataEntrada: 'asc' }
  })

  return tramitacoes.map(t => ({
    data: t.dataEntrada,
    unidade: t.unidade?.nome || 'N/A',
    observacoes: t.observacoes || undefined,
    responsavel: t.responsavel?.nome || undefined,
    prazo: t.prazoVencimento || undefined,
    status: t.status
  }))
}

/**
 * Fluxo padrão de tramitação para novos projetos
 */
export async function iniciarTramitacaoPadrao(
  proposicaoId: string,
  regime: RegimeTramitacao = 'NORMAL'
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca unidade de protocolo (pode ser OUTROS ou MESA_DIRETORA)
  const protocolo = await prisma.tramitacaoUnidade.findFirst({
    where: {
      ativo: true,
      OR: [
        { nome: { contains: 'Protocolo', mode: 'insensitive' } },
        { tipo: 'MESA_DIRETORA' }
      ]
    }
  })

  // Busca tipo de tramitação padrão
  const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
    where: { ativo: true },
    orderBy: { ordem: 'asc' }
  })

  if (!protocolo) {
    warnings.push('Unidade de Protocolo não encontrada.')
    return { valid: true, errors, warnings }
  }

  if (!tipoTramitacao) {
    warnings.push('Tipo de tramitação não encontrado.')
    return { valid: true, errors, warnings }
  }

  const prazo = calcularPrazoParecer(regime)

  // Cria tramitação inicial
  const tramitacao = await prisma.tramitacao.create({
    data: {
      proposicaoId,
      tipoTramitacaoId: tipoTramitacao.id,
      unidadeId: protocolo.id,
      dataEntrada: new Date(),
      status: 'EM_ANDAMENTO',
      prazoVencimento: prazo.prazo || undefined,
      observacoes: `Tramitação iniciada em regime ${regime}. Prazo: ${prazo.diasUteis} dias úteis.`
    }
  })

  // Atualiza status da proposição
  await prisma.proposicao.update({
    where: { id: proposicaoId },
    data: {
      status: 'EM_TRAMITACAO'
    }
  })

  logger.info('Tramitação padrão iniciada', {
    action: 'iniciar_tramitacao_padrao',
    proposicaoId,
    tramitacaoId: tramitacao.id,
    regime
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Resumo das regras de tramitação
 */
export const REGRAS_TRAMITACAO = {
  'RN-030': 'Toda proposição deve passar pela CLJ (exceto moções, votos, requerimentos)',
  'RN-031': 'Proposições podem ser distribuídas a múltiplas comissões conforme matéria',
  'RN-032': 'Prazos: Normal=15d, Prioridade=10d, Urgência=5d, Urgência Urgentíssima=imediato',
  'RN-033': 'Proposição só pode ser votada após parecer das comissões',
  'RN-034': 'Pareceres: favorável, contrário, favorável com emendas, pela inconstitucionalidade',
  'RN-035': 'Toda movimentação deve ser registrada com data, responsável e despacho',
  'RN-036': 'Sistema deve notificar interessados sobre tramitação',
  'RN-037': 'Alertar sobre prazos vencidos ou próximos de vencer'
}
