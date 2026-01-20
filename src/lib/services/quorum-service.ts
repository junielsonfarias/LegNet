/**
 * Serviço de Quórum Configurável
 * Integra configurações de quórum com o sistema de votação
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('quorum')

// Tipos exportados
export type TipoQuorum =
  | 'MAIORIA_SIMPLES'
  | 'MAIORIA_ABSOLUTA'
  | 'DOIS_TERCOS'
  | 'TRES_QUINTOS'
  | 'UNANIMIDADE'

export type AplicacaoQuorum =
  | 'INSTALACAO_SESSAO'
  | 'VOTACAO_SIMPLES'
  | 'VOTACAO_ABSOLUTA'
  | 'VOTACAO_QUALIFICADA'
  | 'VOTACAO_URGENCIA'
  | 'VOTACAO_COMISSAO'
  | 'DERRUBADA_VETO'

export type BaseCalculo = 'PRESENTES' | 'TOTAL_MEMBROS' | 'TOTAL_MANDATOS'

export interface ConfiguracaoQuorum {
  id: string
  nome: string
  descricao: string | null
  aplicacao: AplicacaoQuorum
  tipoQuorum: TipoQuorum
  percentualMinimo: number | null
  numeroMinimo: number | null
  baseCalculo: string
  permitirAbstencao: boolean
  abstencaoContaContra: boolean
  requererVotacaoNominal: boolean
  mensagemAprovacao: string | null
  mensagemRejeicao: string | null
  ativo: boolean
}

export interface ResultadoQuorum {
  temQuorum: boolean
  votosNecessarios: number
  totalBase: number
  percentualAtingido: number
  detalhes: string
}

export interface ResultadoVotacao {
  aprovado: boolean
  mensagem: string
  detalhes: string
  votos: {
    sim: number
    nao: number
    abstencao: number
  }
  quorum: ResultadoQuorum
  requererVotacaoNominal: boolean
}

/**
 * Busca configuração de quórum por tipo de aplicação
 */
export async function getConfiguracaoQuorum(
  aplicacao: AplicacaoQuorum
): Promise<ConfiguracaoQuorum | null> {
  try {
    const config = await prisma.configuracaoQuorum.findUnique({
      where: { aplicacao }
    })

    if (!config || !config.ativo) {
      logger.warn('Configuração de quórum não encontrada ou inativa', {
        action: 'get_configuracao_quorum',
        aplicacao
      })
      return null
    }

    return {
      id: config.id,
      nome: config.nome,
      descricao: config.descricao,
      aplicacao: config.aplicacao as AplicacaoQuorum,
      tipoQuorum: config.tipoQuorum as TipoQuorum,
      percentualMinimo: config.percentualMinimo,
      numeroMinimo: config.numeroMinimo,
      baseCalculo: config.baseCalculo,
      permitirAbstencao: config.permitirAbstencao,
      abstencaoContaContra: config.abstencaoContaContra,
      requererVotacaoNominal: config.requererVotacaoNominal,
      mensagemAprovacao: config.mensagemAprovacao,
      mensagemRejeicao: config.mensagemRejeicao,
      ativo: config.ativo
    }
  } catch (error) {
    logger.error('Erro ao buscar configuração de quórum', error)
    return null
  }
}

/**
 * Calcula o número de votos necessários com base no tipo de quórum
 */
export function calcularVotosNecessarios(
  tipo: TipoQuorum,
  base: number
): number {
  switch (tipo) {
    case 'MAIORIA_SIMPLES':
      // Mais da metade dos votos
      return Math.floor(base / 2) + 1

    case 'MAIORIA_ABSOLUTA':
      // Mais da metade do total (50% + 1)
      return Math.floor(base / 2) + 1

    case 'DOIS_TERCOS':
      // Dois terços dos membros/presentes
      return Math.ceil((base * 2) / 3)

    case 'TRES_QUINTOS':
      // Três quintos dos membros/presentes
      return Math.ceil((base * 3) / 5)

    case 'UNANIMIDADE':
      // Todos devem votar a favor
      return base

    default:
      return Math.floor(base / 2) + 1
  }
}

/**
 * Verifica quórum de instalação de sessão
 */
export async function verificarQuorumInstalacao(
  sessaoId: string
): Promise<ResultadoQuorum> {
  const config = await getConfiguracaoQuorum('INSTALACAO_SESSAO')

  // Se não há configuração, usar regra padrão (maioria absoluta dos membros)
  if (!config) {
    logger.info('Usando configuração padrão para instalação de sessão')
  }

  // Conta presenças
  const presentes = await prisma.presencaSessao.count({
    where: {
      sessaoId,
      presente: true
    }
  })

  // Busca total de membros ativos
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    select: { legislaturaId: true }
  })

  const whereClause: any = { ativo: true }
  if (sessao?.legislaturaId) {
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

  // Determinar base de cálculo
  const tipoQuorum = config?.tipoQuorum || 'MAIORIA_ABSOLUTA'
  const baseCalculo = config?.baseCalculo || 'TOTAL_MEMBROS'

  let base = totalMembros
  if (baseCalculo === 'PRESENTES') {
    base = presentes
  }

  const votosNecessarios = calcularVotosNecessarios(tipoQuorum, base)
  const temQuorum = presentes >= votosNecessarios
  const percentualAtingido = base > 0 ? (presentes / base) * 100 : 0

  const resultado: ResultadoQuorum = {
    temQuorum,
    votosNecessarios,
    totalBase: base,
    percentualAtingido,
    detalhes: `${presentes} de ${totalMembros} parlamentares presentes. Necessário: ${votosNecessarios} (${tipoQuorum.replace('_', ' ').toLowerCase()})`
  }

  logger.info('Verificação de quórum de instalação', {
    action: 'verificar_quorum_instalacao',
    sessaoId,
    presentes,
    totalMembros,
    temQuorum
  })

  return resultado
}

/**
 * Calcula resultado de votação com base na configuração de quórum
 */
export async function calcularResultadoVotacao(
  aplicacao: AplicacaoQuorum,
  votos: { sim: number; nao: number; abstencao: number },
  totalMembros: number,
  totalPresentes: number
): Promise<ResultadoVotacao> {
  const config = await getConfiguracaoQuorum(aplicacao)

  // Se não há configuração, usar regra padrão
  const tipoQuorum = config?.tipoQuorum || 'MAIORIA_SIMPLES'
  const baseCalculo = (config?.baseCalculo || 'PRESENTES') as BaseCalculo
  const abstencaoContaContra = config?.abstencaoContaContra || false
  const requererVotacaoNominal = config?.requererVotacaoNominal || false
  const mensagemAprovacao = config?.mensagemAprovacao || 'Aprovado'
  const mensagemRejeicao = config?.mensagemRejeicao || 'Rejeitado por não atingir quórum'
  const percentualMinimo = config?.percentualMinimo || null
  const numeroMinimo = config?.numeroMinimo || null

  // Determinar base de cálculo
  let base = totalPresentes
  if (baseCalculo === 'TOTAL_MEMBROS' || baseCalculo === 'TOTAL_MANDATOS') {
    base = totalMembros
  }

  // Considerar abstenções como contra se configurado
  const votosContra = abstencaoContaContra
    ? votos.nao + votos.abstencao
    : votos.nao

  let aprovado = false
  let detalhes = ''

  // Calcular resultado baseado no tipo de quórum
  switch (tipoQuorum) {
    case 'MAIORIA_SIMPLES':
      aprovado = votos.sim > votosContra
      detalhes = `${votos.sim} a favor vs ${votosContra} contra (maioria simples)`
      break

    case 'MAIORIA_ABSOLUTA':
      const maioriaAbsoluta = Math.floor(base / 2) + 1
      aprovado = votos.sim >= maioriaAbsoluta
      detalhes = `${votos.sim} a favor (necessário: ${maioriaAbsoluta} de ${base})`
      break

    case 'DOIS_TERCOS':
      const doisTercos = Math.ceil((base * 2) / 3)
      aprovado = votos.sim >= doisTercos
      detalhes = `${votos.sim} a favor (necessário: ${doisTercos} de ${base} - 2/3)`
      break

    case 'TRES_QUINTOS':
      const tresQuintos = Math.ceil((base * 3) / 5)
      aprovado = votos.sim >= tresQuintos
      detalhes = `${votos.sim} a favor (necessário: ${tresQuintos} de ${base} - 3/5)`
      break

    case 'UNANIMIDADE':
      aprovado = votos.sim === totalPresentes && votos.nao === 0 && votos.abstencao === 0
      detalhes = `${votos.sim} a favor de ${totalPresentes} presentes (unanimidade requerida)`
      break
  }

  // Verificar percentual mínimo se configurado
  if (percentualMinimo && !aprovado) {
    const percentualAtingido = (votos.sim / base) * 100
    if (percentualAtingido >= percentualMinimo) {
      aprovado = true
      detalhes += ` - Atingiu ${percentualAtingido.toFixed(1)}% (mínimo: ${percentualMinimo}%)`
    }
  }

  // Verificar número mínimo se configurado
  if (numeroMinimo && !aprovado && votos.sim >= numeroMinimo) {
    aprovado = true
    detalhes += ` - Atingiu mínimo de ${numeroMinimo} votos`
  }

  const votosNecessarios = calcularVotosNecessarios(tipoQuorum, base)
  const percentualAtingido = base > 0 ? (votos.sim / base) * 100 : 0

  const resultado: ResultadoVotacao = {
    aprovado,
    mensagem: aprovado ? mensagemAprovacao : mensagemRejeicao,
    detalhes,
    votos,
    quorum: {
      temQuorum: true,
      votosNecessarios,
      totalBase: base,
      percentualAtingido,
      detalhes: `Base de cálculo: ${baseCalculo.toLowerCase().replace('_', ' ')}`
    },
    requererVotacaoNominal
  }

  logger.info('Cálculo de resultado de votação', {
    action: 'calcular_resultado_votacao',
    aplicacao,
    tipoQuorum,
    votos,
    aprovado,
    detalhes
  })

  return resultado
}

/**
 * Determina a aplicação de quórum com base no tipo de proposição
 */
export function determinarAplicacaoQuorum(
  tipoProposicao: string,
  regimeUrgencia: boolean = false,
  isDerrubadaVeto: boolean = false,
  isVotacaoComissao: boolean = false
): AplicacaoQuorum {
  // Derrubada de veto tem quórum específico
  if (isDerrubadaVeto) {
    return 'DERRUBADA_VETO'
  }

  // Votação em comissão
  if (isVotacaoComissao) {
    return 'VOTACAO_COMISSAO'
  }

  // Regime de urgência
  if (regimeUrgencia) {
    return 'VOTACAO_URGENCIA'
  }

  // Tipos que exigem maioria qualificada
  const tiposQualificados = [
    'PROJETO_EMENDA_LEI_ORGANICA',
    'PROJETO_LEI_COMPLEMENTAR'
  ]

  if (tiposQualificados.includes(tipoProposicao)) {
    return 'VOTACAO_QUALIFICADA'
  }

  // Tipos que exigem maioria absoluta
  const tiposAbsoluta = [
    'PROJETO_LEI',
    'PROJETO_RESOLUCAO',
    'PROJETO_DECRETO_LEGISLATIVO'
  ]

  if (tiposAbsoluta.includes(tipoProposicao)) {
    return 'VOTACAO_ABSOLUTA'
  }

  // Padrão: maioria simples
  return 'VOTACAO_SIMPLES'
}

/**
 * Verifica se votação nominal é obrigatória
 */
export async function verificarVotacaoNominalObrigatoria(
  aplicacao: AplicacaoQuorum
): Promise<{ obrigatoria: boolean; motivo: string }> {
  const config = await getConfiguracaoQuorum(aplicacao)

  if (config?.requererVotacaoNominal) {
    return {
      obrigatoria: true,
      motivo: `Configuração de quórum "${config.nome}" exige votação nominal`
    }
  }

  // Regras fixas - sempre votação nominal
  const aplicacoesNominais: AplicacaoQuorum[] = [
    'VOTACAO_QUALIFICADA',
    'DERRUBADA_VETO'
  ]

  if (aplicacoesNominais.includes(aplicacao)) {
    return {
      obrigatoria: true,
      motivo: `${aplicacao.replace('_', ' ').toLowerCase()} exige votação nominal`
    }
  }

  return {
    obrigatoria: false,
    motivo: 'Votação simbólica permitida'
  }
}

/**
 * Obtém todas as configurações de quórum ativas
 */
export async function listarConfiguracoesQuorum(): Promise<ConfiguracaoQuorum[]> {
  const configs = await prisma.configuracaoQuorum.findMany({
    where: { ativo: true },
    orderBy: [
      { ordem: 'asc' },
      { nome: 'asc' }
    ]
  })

  return configs.map(config => ({
    id: config.id,
    nome: config.nome,
    descricao: config.descricao,
    aplicacao: config.aplicacao as AplicacaoQuorum,
    tipoQuorum: config.tipoQuorum as TipoQuorum,
    percentualMinimo: config.percentualMinimo,
    numeroMinimo: config.numeroMinimo,
    baseCalculo: config.baseCalculo,
    permitirAbstencao: config.permitirAbstencao,
    abstencaoContaContra: config.abstencaoContaContra,
    requererVotacaoNominal: config.requererVotacaoNominal,
    mensagemAprovacao: config.mensagemAprovacao,
    mensagemRejeicao: config.mensagemRejeicao,
    ativo: config.ativo
  }))
}

/**
 * Cria configurações padrão de quórum (seed)
 */
export async function criarConfiguracoesPadrao(): Promise<void> {
  const configuracoesPadrao = [
    {
      nome: 'Instalação de Sessão',
      descricao: 'Quórum mínimo para iniciar uma sessão plenária',
      aplicacao: 'INSTALACAO_SESSAO',
      tipoQuorum: 'MAIORIA_ABSOLUTA',
      baseCalculo: 'TOTAL_MEMBROS',
      permitirAbstencao: false,
      abstencaoContaContra: false,
      requererVotacaoNominal: false,
      ordem: 1
    },
    {
      nome: 'Votação Simples',
      descricao: 'Maioria simples dos presentes para matérias ordinárias',
      aplicacao: 'VOTACAO_SIMPLES',
      tipoQuorum: 'MAIORIA_SIMPLES',
      baseCalculo: 'PRESENTES',
      permitirAbstencao: true,
      abstencaoContaContra: false,
      requererVotacaoNominal: false,
      ordem: 2
    },
    {
      nome: 'Votação Absoluta',
      descricao: 'Maioria absoluta para projetos de lei ordinária',
      aplicacao: 'VOTACAO_ABSOLUTA',
      tipoQuorum: 'MAIORIA_ABSOLUTA',
      baseCalculo: 'TOTAL_MEMBROS',
      permitirAbstencao: true,
      abstencaoContaContra: false,
      requererVotacaoNominal: false,
      ordem: 3
    },
    {
      nome: 'Votação Qualificada',
      descricao: 'Dois terços para emendas à Lei Orgânica e matérias especiais',
      aplicacao: 'VOTACAO_QUALIFICADA',
      tipoQuorum: 'DOIS_TERCOS',
      baseCalculo: 'TOTAL_MEMBROS',
      permitirAbstencao: true,
      abstencaoContaContra: false,
      requererVotacaoNominal: true,
      ordem: 4
    },
    {
      nome: 'Regime de Urgência',
      descricao: 'Maioria absoluta para aprovar regime de urgência',
      aplicacao: 'VOTACAO_URGENCIA',
      tipoQuorum: 'MAIORIA_ABSOLUTA',
      baseCalculo: 'TOTAL_MEMBROS',
      permitirAbstencao: true,
      abstencaoContaContra: false,
      requererVotacaoNominal: false,
      ordem: 5
    },
    {
      nome: 'Votação em Comissão',
      descricao: 'Maioria simples dos membros presentes na comissão',
      aplicacao: 'VOTACAO_COMISSAO',
      tipoQuorum: 'MAIORIA_SIMPLES',
      baseCalculo: 'PRESENTES',
      permitirAbstencao: true,
      abstencaoContaContra: false,
      requererVotacaoNominal: false,
      ordem: 6
    },
    {
      nome: 'Derrubada de Veto',
      descricao: 'Maioria absoluta para derrubar veto do Executivo',
      aplicacao: 'DERRUBADA_VETO',
      tipoQuorum: 'MAIORIA_ABSOLUTA',
      baseCalculo: 'TOTAL_MEMBROS',
      permitirAbstencao: true,
      abstencaoContaContra: false,
      requererVotacaoNominal: true,
      mensagemAprovacao: 'Veto derrubado',
      mensagemRejeicao: 'Veto mantido',
      ordem: 7
    }
  ]

  for (const config of configuracoesPadrao) {
    await prisma.configuracaoQuorum.upsert({
      where: { aplicacao: config.aplicacao as any },
      update: {},
      create: config as any
    })
  }

  logger.info('Configurações padrão de quórum criadas', {
    action: 'criar_configuracoes_padrao',
    total: configuracoesPadrao.length
  })
}
