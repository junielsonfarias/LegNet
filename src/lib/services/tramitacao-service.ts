/**
 * Serviço de Tramitação de Proposições
 * Implementa regras de negócio RN-030 a RN-037
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { addBusinessDays, differenceInDays } from '@/lib/utils/date'
import type { Prisma } from '@prisma/client'

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

// Resultado do avanço de etapa
export type TramitacaoResultado = 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO'

// Interface para resultado de avanço de etapa
export interface AvancarEtapaResult {
  success: boolean
  errors: string[]
  warnings: string[]
  tramitacaoAnterior?: {
    id: string
    etapa: string
    status: string
  }
  tramitacaoNova?: {
    id: string
    etapa: string
    prazoVencimento?: Date
  }
  etapaFinal: boolean
  proposicaoStatus?: string
}

/**
 * Avança a proposição para a próxima etapa do fluxo de tramitação
 * RN-035: Toda movimentação deve ser registrada
 */
export async function avancarEtapaFluxo(
  proposicaoId: string,
  observacoes?: string,
  parecer?: TipoParecer,
  resultado?: TramitacaoResultado,
  usuarioId?: string,
  ip?: string
): Promise<AvancarEtapaResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // 1. Busca proposição com tramitação atual
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: proposicaoId },
      include: {
        tramitacoes: {
          where: { status: 'EM_ANDAMENTO' },
          orderBy: { dataEntrada: 'desc' },
          take: 1,
          include: {
            fluxoEtapa: {
              include: {
                fluxo: true
              }
            },
            unidade: true,
            tipoTramitacao: true
          }
        }
      }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { success: false, errors, warnings, etapaFinal: false }
    }

    const tramitacaoAtual = proposicao.tramitacoes[0]
    if (!tramitacaoAtual) {
      errors.push('Proposição não possui tramitação em andamento.')
      return { success: false, errors, warnings, etapaFinal: false }
    }

    // 2. Verifica se etapa requer parecer
    if (tramitacaoAtual.fluxoEtapa?.requerParecer && !parecer) {
      errors.push(`RN-034: Etapa "${tramitacaoAtual.fluxoEtapa.nome}" requer parecer para avançar.`)
      return { success: false, errors, warnings, etapaFinal: false }
    }

    // 3. Busca próxima etapa do fluxo
    type ProximaEtapaType = Awaited<ReturnType<typeof prisma.fluxoTramitacaoEtapa.findFirst<{
      include: { unidade: true }
    }>>>
    let proximaEtapa: ProximaEtapaType = null
    let ehEtapaFinal = tramitacaoAtual.fluxoEtapa?.ehEtapaFinal || false

    if (tramitacaoAtual.fluxoEtapa && !ehEtapaFinal) {
      proximaEtapa = await prisma.fluxoTramitacaoEtapa.findFirst({
        where: {
          fluxoId: tramitacaoAtual.fluxoEtapa.fluxoId,
          ordem: { gt: tramitacaoAtual.fluxoEtapa.ordem }
        },
        orderBy: { ordem: 'asc' },
        include: {
          unidade: true
        }
      })

      if (!proximaEtapa) {
        ehEtapaFinal = true
      }
    }

    // 4. Prepara dados para registro de histórico
    const dadosAnteriores = {
      tramitacaoId: tramitacaoAtual.id,
      etapa: tramitacaoAtual.fluxoEtapa?.nome || tramitacaoAtual.tipoTramitacao?.nome || 'N/A',
      unidade: tramitacaoAtual.unidade?.nome || 'N/A',
      status: tramitacaoAtual.status,
      parecer: tramitacaoAtual.parecer
    }

    // 5. Conclui tramitação atual
    await prisma.tramitacao.update({
      where: { id: tramitacaoAtual.id },
      data: {
        status: 'CONCLUIDA',
        dataSaida: new Date(),
        parecer: parecer || tramitacaoAtual.parecer,
        resultado: resultado || tramitacaoAtual.resultado,
        observacoes: observacoes
          ? `${tramitacaoAtual.observacoes || ''}\n${observacoes}`.trim()
          : tramitacaoAtual.observacoes
      }
    })

    // 6. Registra histórico da conclusão
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacaoAtual.id,
        acao: 'CONCLUSAO_ETAPA',
        descricao: `Etapa "${dadosAnteriores.etapa}" concluída${parecer ? ` com parecer ${parecer}` : ''}`,
        data: new Date(),
        usuarioId,
        ip,
        dadosAnteriores: dadosAnteriores as Prisma.InputJsonValue,
        dadosNovos: {
          status: 'CONCLUIDA',
          parecer,
          resultado,
          observacoes
        } as Prisma.InputJsonValue
      }
    })

    type TramitacaoType = Awaited<ReturnType<typeof prisma.tramitacao.create>>
    let tramitacaoNova: TramitacaoType | null = null
    let novoStatusProposicao = proposicao.status as 'APRESENTADA' | 'EM_TRAMITACAO' | 'AGUARDANDO_PAUTA' | 'EM_PAUTA' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA' | 'SANCIONADA' | 'PROMULGADA'

    // 7. Se não é etapa final, cria nova tramitação na próxima etapa
    if (!ehEtapaFinal && proximaEtapa) {
      // Busca tipo de tramitação adequado ou usa o mesmo
      const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
        where: { ativo: true },
        orderBy: { ordem: 'asc' }
      })

      // Calcula prazo da nova etapa
      const prazoDias = proximaEtapa.prazoDiasNormal || 15
      const prazoVencimento = addBusinessDays(new Date(), prazoDias)

      // Cria nova tramitação
      tramitacaoNova = await prisma.tramitacao.create({
        data: {
          proposicaoId,
          tipoTramitacaoId: tipoTramitacao?.id || tramitacaoAtual.tipoTramitacaoId,
          unidadeId: proximaEtapa.unidadeId || tramitacaoAtual.unidadeId,
          fluxoEtapaId: proximaEtapa.id,
          dataEntrada: new Date(),
          status: 'EM_ANDAMENTO',
          prazoVencimento,
          observacoes: `Tramitação avançada automaticamente para etapa "${proximaEtapa.nome}".`
        }
      })

      // Registra histórico da nova tramitação
      await prisma.tramitacaoHistorico.create({
        data: {
          tramitacaoId: tramitacaoNova.id,
          acao: 'INICIO_ETAPA',
          descricao: `Iniciada etapa "${proximaEtapa.nome}"`,
          data: new Date(),
          usuarioId,
          ip,
          dadosAnteriores: dadosAnteriores as Prisma.InputJsonValue,
          dadosNovos: {
            etapa: proximaEtapa.nome,
            unidade: proximaEtapa.unidade?.nome,
            prazoVencimento: prazoVencimento?.toISOString()
          } as Prisma.InputJsonValue
        }
      })

      // 8. Atualiza status da proposição se etapa habilita pauta
      if (proximaEtapa.habilitaPauta) {
        novoStatusProposicao = 'AGUARDANDO_PAUTA'
        await prisma.proposicao.update({
          where: { id: proposicaoId },
          data: { status: 'AGUARDANDO_PAUTA' }
        })
      }

      logger.info('Tramitação avançada para próxima etapa', {
        action: 'avancar_etapa',
        proposicaoId,
        etapaAnterior: dadosAnteriores.etapa,
        etapaNova: proximaEtapa.nome,
        tramitacaoNovaId: tramitacaoNova.id
      })
    } else {
      // Etapa final - atualiza status da proposição
      if (resultado === 'APROVADO' || resultado === 'APROVADO_COM_EMENDAS') {
        novoStatusProposicao = 'APROVADA'
      } else if (resultado === 'REJEITADO') {
        novoStatusProposicao = 'REJEITADA'
      } else if (resultado === 'ARQUIVADO') {
        novoStatusProposicao = 'ARQUIVADA'
      } else {
        novoStatusProposicao = 'AGUARDANDO_PAUTA'
      }

      await prisma.proposicao.update({
        where: { id: proposicaoId },
        data: { status: novoStatusProposicao }
      })

      logger.info('Tramitação finalizada', {
        action: 'finalizar_tramitacao',
        proposicaoId,
        etapaFinal: dadosAnteriores.etapa,
        resultado,
        novoStatus: novoStatusProposicao
      })
    }

    return {
      success: true,
      errors,
      warnings,
      tramitacaoAnterior: {
        id: tramitacaoAtual.id,
        etapa: dadosAnteriores.etapa,
        status: 'CONCLUIDA'
      },
      tramitacaoNova: tramitacaoNova ? {
        id: tramitacaoNova.id,
        etapa: proximaEtapa?.nome || 'N/A',
        prazoVencimento: tramitacaoNova.prazoVencimento || undefined
      } : undefined,
      etapaFinal: ehEtapaFinal,
      proposicaoStatus: novoStatusProposicao
    }
  } catch (error) {
    logger.error('Erro ao avançar etapa de tramitação', error)
    errors.push('Erro interno ao avançar tramitação.')
    return { success: false, errors, warnings, etapaFinal: false }
  }
}

/**
 * Inicia tramitação de proposição vinculada a um fluxo configurado
 */
export async function iniciarTramitacaoComFluxo(
  proposicaoId: string,
  fluxoId: string,
  etapaInicialId: string,
  regime: RegimeTramitacao = 'NORMAL',
  usuarioId?: string,
  ip?: string
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Busca proposição
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: proposicaoId }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings }
    }

    // Verifica se já tem tramitação em andamento
    const tramitacaoExistente = await prisma.tramitacao.findFirst({
      where: {
        proposicaoId,
        status: 'EM_ANDAMENTO'
      }
    })

    if (tramitacaoExistente) {
      warnings.push('Proposição já possui tramitação em andamento.')
      return { valid: true, errors, warnings, tramitacaoId: tramitacaoExistente.id }
    }

    // Busca etapa inicial
    const etapaInicial = await prisma.fluxoTramitacaoEtapa.findUnique({
      where: { id: etapaInicialId },
      include: {
        unidade: true,
        fluxo: true
      }
    })

    if (!etapaInicial) {
      errors.push('Etapa inicial do fluxo não encontrada.')
      return { valid: false, errors, warnings }
    }

    // Busca tipo de tramitação padrão
    const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
      where: { ativo: true },
      orderBy: { ordem: 'asc' }
    })

    if (!tipoTramitacao) {
      errors.push('Tipo de tramitação não configurado no sistema.')
      return { valid: false, errors, warnings }
    }

    // Busca unidade (da etapa ou default)
    let unidadeId: string | null | undefined = etapaInicial.unidadeId
    if (!unidadeId) {
      const unidadeDefault = await prisma.tramitacaoUnidade.findFirst({
        where: {
          ativo: true,
          OR: [
            { tipo: 'MESA_DIRETORA' },
            { nome: { contains: 'Protocolo', mode: 'insensitive' } }
          ]
        }
      })
      unidadeId = unidadeDefault?.id
    }

    if (!unidadeId) {
      errors.push('Unidade de tramitação não encontrada.')
      return { valid: false, errors, warnings }
    }

    // Calcula prazo baseado no regime e etapa
    const prazoDias = regime === 'URGENCIA_URGENTISSIMA' ? 0
      : regime === 'URGENCIA' ? Math.ceil((etapaInicial.prazoDiasNormal || 15) * 0.33)
      : regime === 'PRIORIDADE' ? Math.ceil((etapaInicial.prazoDiasNormal || 15) * 0.67)
      : etapaInicial.prazoDiasNormal || 15

    const prazoVencimento = prazoDias > 0 ? addBusinessDays(new Date(), prazoDias) : null

    // Cria tramitação
    const tramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId,
        tipoTramitacaoId: tipoTramitacao.id,
        unidadeId,
        fluxoEtapaId: etapaInicial.id,
        dataEntrada: new Date(),
        status: 'EM_ANDAMENTO',
        prazoVencimento: prazoVencimento || undefined,
        observacoes: `Tramitação iniciada no fluxo "${etapaInicial.fluxo.nome}", etapa "${etapaInicial.nome}". Regime: ${regime}.`
      }
    })

    // Registra histórico
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacao.id,
        acao: 'INICIO_TRAMITACAO',
        descricao: `Tramitação iniciada no fluxo "${etapaInicial.fluxo.nome}"`,
        data: new Date(),
        usuarioId,
        ip,
        dadosAnteriores: {
          proposicaoStatus: proposicao.status
        } as Prisma.InputJsonValue,
        dadosNovos: {
          fluxo: etapaInicial.fluxo.nome,
          etapa: etapaInicial.nome,
          regime,
          prazoVencimento: prazoVencimento?.toISOString()
        } as Prisma.InputJsonValue
      }
    })

    // Atualiza status da proposição
    await prisma.proposicao.update({
      where: { id: proposicaoId },
      data: { status: 'EM_TRAMITACAO' }
    })

    logger.info('Tramitação iniciada com fluxo configurado', {
      action: 'iniciar_tramitacao_fluxo',
      proposicaoId,
      fluxoId,
      etapaInicial: etapaInicial.nome,
      tramitacaoId: tramitacao.id,
      regime
    })

    return {
      valid: true,
      errors,
      warnings,
      tramitacaoId: tramitacao.id
    }
  } catch (error) {
    logger.error('Erro ao iniciar tramitação com fluxo', error)
    errors.push('Erro interno ao iniciar tramitação.')
    return { valid: false, errors, warnings }
  }
}

/**
 * Registra movimentação com auditoria completa
 * RN-035: Toda movimentação deve ser registrada com data, responsável e despacho
 */
export async function registrarMovimentacaoComAuditoria(
  data: TramitacaoData & {
    usuarioId?: string
    ip?: string
    dadosAnteriores?: Record<string, unknown>
  }
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Verifica se proposição existe
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: data.proposicaoId },
      include: {
        tramitacoes: {
          where: { status: 'EM_ANDAMENTO' },
          orderBy: { dataEntrada: 'desc' },
          take: 1
        }
      }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings, rule: 'RN-035' }
    }

    // Captura dados anteriores se não fornecidos
    const dadosAnteriores = data.dadosAnteriores || {
      status: proposicao.status,
      tramitacaoAtual: proposicao.tramitacoes[0] ? {
        id: proposicao.tramitacoes[0].id,
        status: proposicao.tramitacoes[0].status,
        unidadeId: proposicao.tramitacoes[0].unidadeId
      } : null
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

    // Cria entrada no histórico com auditoria completa
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacao.id,
        acao: 'DISTRIBUICAO',
        descricao: `Distribuído para unidade`,
        data: new Date(),
        usuarioId: data.usuarioId,
        ip: data.ip,
        dadosAnteriores: dadosAnteriores as Prisma.InputJsonValue,
        dadosNovos: {
          tramitacaoId: tramitacao.id,
          unidadeId: data.unidadeId,
          tipoTramitacaoId: data.tipoTramitacaoId,
          responsavelId: data.responsavelId
        } as Prisma.InputJsonValue
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

    logger.info('Movimentação registrada com auditoria', {
      action: 'registrar_movimentacao_auditoria',
      tramitacaoId: tramitacao.id,
      proposicaoId: data.proposicaoId,
      unidade: data.unidadeId,
      usuarioId: data.usuarioId
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
 * Obtém a etapa atual da tramitação de uma proposição
 */
export async function obterEtapaAtual(proposicaoId: string): Promise<{
  tramitacao?: {
    id: string
    status: string
    dataEntrada: Date
    prazoVencimento?: Date
  }
  etapa?: {
    id: string
    nome: string
    ordem: number
    habilitaPauta: boolean
    requerParecer: boolean
    ehEtapaFinal: boolean
  }
  fluxo?: {
    id: string
    nome: string
    tipoProposicao: string
  }
} | null> {
  const tramitacao = await prisma.tramitacao.findFirst({
    where: {
      proposicaoId,
      status: 'EM_ANDAMENTO'
    },
    orderBy: { dataEntrada: 'desc' },
    include: {
      fluxoEtapa: {
        include: {
          fluxo: true
        }
      }
    }
  })

  if (!tramitacao) {
    return null
  }

  return {
    tramitacao: {
      id: tramitacao.id,
      status: tramitacao.status,
      dataEntrada: tramitacao.dataEntrada,
      prazoVencimento: tramitacao.prazoVencimento || undefined
    },
    etapa: tramitacao.fluxoEtapa ? {
      id: tramitacao.fluxoEtapa.id,
      nome: tramitacao.fluxoEtapa.nome,
      ordem: tramitacao.fluxoEtapa.ordem,
      habilitaPauta: tramitacao.fluxoEtapa.habilitaPauta,
      requerParecer: tramitacao.fluxoEtapa.requerParecer,
      ehEtapaFinal: tramitacao.fluxoEtapa.ehEtapaFinal
    } : undefined,
    fluxo: tramitacao.fluxoEtapa?.fluxo ? {
      id: tramitacao.fluxoEtapa.fluxo.id,
      nome: tramitacao.fluxoEtapa.fluxo.nome,
      tipoProposicao: tramitacao.fluxoEtapa.fluxo.tipoProposicao
    } : undefined
  }
}
