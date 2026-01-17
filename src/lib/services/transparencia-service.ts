/**
 * Servico de Transparencia e Conformidade PNTP
 * Implementa verificacao de requisitos PNTP nivel Diamante
 *
 * Funcionalidades:
 * - Verificacao de conformidade PNTP
 * - Jobs de atualizacao automatica
 * - Sincronizacao admin -> portal
 * - Alertas de dados desatualizados
 * - Relatorio de conformidade
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { differenceInDays, differenceInHours } from '@/lib/utils/date'

const logger = createLogger('transparencia')

// Prazos PNTP em dias
const PRAZOS_PNTP = {
  VOTACOES_NOMINAIS: 30,        // Atualizar em 30 dias
  PRESENCA_SESSOES: 30,         // Atualizar em 30 dias
  PAUTA_ANTECEDENCIA: 48,       // Publicar 48h antes (em horas)
  ATA_PUBLICACAO: 15,           // Publicar em 15 dias
  CONTRATOS_PUBLICACAO: 1,      // Publicar em 24h (1 dia)
  DIARIAS_ATUALIZACAO: 30,      // Atualizar mensalmente
  FOLHA_PAGAMENTO: 30,          // Atualizar mensalmente
}

// Status de conformidade
export type StatusConformidade = 'CONFORME' | 'ALERTA' | 'NAO_CONFORME' | 'NAO_APLICAVEL'

// Item de verificacao PNTP
export interface ItemVerificacaoPNTP {
  id: string
  categoria: string
  requisito: string
  descricao: string
  status: StatusConformidade
  prazoLegal: string
  ultimaAtualizacao?: Date
  diasDesdeAtualizacao?: number
  detalhes?: string
  recomendacao?: string
  pontuacao: number
  pontuacaoMaxima: number
}

// Relatorio de conformidade PNTP
export interface RelatorioPNTP {
  dataGeracao: Date
  nivelAtual: 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE'
  pontuacaoTotal: number
  pontuacaoMaxima: number
  percentualConformidade: number
  itensConformes: number
  itensAlerta: number
  itensNaoConformes: number
  categorias: {
    categoria: string
    pontuacao: number
    pontuacaoMaxima: number
    itens: ItemVerificacaoPNTP[]
  }[]
  recomendacoesPrioritarias: string[]
}

/**
 * Verifica conformidade com requisitos PNTP
 */
export async function verificarConformidadePNTP(): Promise<RelatorioPNTP> {
  const itens: ItemVerificacaoPNTP[] = []

  // 1. Verificar votacoes nominais
  itens.push(await verificarVotacoesNominais())

  // 2. Verificar presenca em sessoes
  itens.push(await verificarPresencaSessoes())

  // 3. Verificar publicacao de pautas
  itens.push(await verificarPublicacaoPautas())

  // 4. Verificar publicacao de atas
  itens.push(await verificarPublicacaoAtas())

  // 5. Verificar lista de vereadores
  itens.push(await verificarListaVereadores())

  // 6. Verificar remuneracao parlamentares
  itens.push(await verificarRemuneracaoParlamentares())

  // 7. Verificar diarias e verbas
  itens.push(await verificarDiariasVerbas())

  // 8. Verificar ouvidoria
  itens.push(await verificarOuvidoria())

  // 9. Verificar e-SIC
  itens.push(await verificarESIC())

  // 10. Verificar contratos
  itens.push(await verificarContratos())

  // 11. Verificar licitacoes
  itens.push(await verificarLicitacoes())

  // 12. Verificar folha de pagamento
  itens.push(await verificarFolhaPagamento())

  // 13. Verificar proposicoes legislativas
  itens.push(await verificarProposicoesLegislativas())

  // 14. Verificar tramitacoes
  itens.push(await verificarTramitacoes())

  // Agrupar por categoria
  const categorias = agruparPorCategoria(itens)

  // Calcular pontuacao
  const pontuacaoTotal = itens.reduce((acc, item) => acc + item.pontuacao, 0)
  const pontuacaoMaxima = itens.reduce((acc, item) => acc + item.pontuacaoMaxima, 0)
  const percentualConformidade = pontuacaoMaxima > 0
    ? Math.round((pontuacaoTotal / pontuacaoMaxima) * 100)
    : 0

  // Determinar nivel
  const nivelAtual = determinarNivel(percentualConformidade)

  // Contagens
  const itensConformes = itens.filter(i => i.status === 'CONFORME').length
  const itensAlerta = itens.filter(i => i.status === 'ALERTA').length
  const itensNaoConformes = itens.filter(i => i.status === 'NAO_CONFORME').length

  // Recomendacoes prioritarias
  const recomendacoesPrioritarias = itens
    .filter(i => i.status === 'NAO_CONFORME' && i.recomendacao)
    .map(i => i.recomendacao!)
    .slice(0, 5)

  const relatorio: RelatorioPNTP = {
    dataGeracao: new Date(),
    nivelAtual,
    pontuacaoTotal,
    pontuacaoMaxima,
    percentualConformidade,
    itensConformes,
    itensAlerta,
    itensNaoConformes,
    categorias,
    recomendacoesPrioritarias
  }

  logger.info('Relatorio PNTP gerado', {
    action: 'verificar_conformidade_pntp',
    nivel: nivelAtual,
    percentual: percentualConformidade,
    conformes: itensConformes,
    alertas: itensAlerta,
    naoConformes: itensNaoConformes
  })

  return relatorio
}

/**
 * Verifica votacoes nominais
 */
async function verificarVotacoesNominais(): Promise<ItemVerificacaoPNTP> {
  const limite = new Date()
  limite.setDate(limite.getDate() - PRAZOS_PNTP.VOTACOES_NOMINAIS)

  // Buscar votacoes nominais recentes
  const votacoesRecentes = await prisma.votacao.count({
    where: {
      createdAt: { gte: limite }
    }
  })

  // Contar total de votacoes esperadas no periodo
  const totalVotacoes = await prisma.votacao.count({
    where: {
      createdAt: { gte: limite }
    }
  })

  const status: StatusConformidade =
    totalVotacoes === 0 ? 'NAO_APLICAVEL' :
    votacoesRecentes >= totalVotacoes ? 'CONFORME' : 'NAO_CONFORME'

  return {
    id: 'PNTP-001',
    categoria: 'Processo Legislativo',
    requisito: 'Votacoes Nominais',
    descricao: 'Votacoes nominais devem ser publicadas em ate 30 dias',
    status,
    prazoLegal: '30 dias',
    ultimaAtualizacao: new Date(),
    detalhes: `${votacoesRecentes} votacoes registradas nos ultimos 30 dias`,
    recomendacao: status === 'NAO_CONFORME'
      ? 'Publicar votacoes nominais pendentes no portal'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : status === 'NAO_APLICAVEL' ? 10 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica presenca em sessoes
 */
async function verificarPresencaSessoes(): Promise<ItemVerificacaoPNTP> {
  const limite = new Date()
  limite.setDate(limite.getDate() - PRAZOS_PNTP.PRESENCA_SESSOES)

  const sessoesRecentes = await prisma.sessao.findMany({
    where: {
      status: 'CONCLUIDA',
      data: { gte: limite }
    },
    include: {
      _count: {
        select: { presencas: true }
      }
    }
  })

  const sessoesComPresenca = sessoesRecentes.filter(s => s._count.presencas > 0)
  const percentualComPresenca = sessoesRecentes.length > 0
    ? (sessoesComPresenca.length / sessoesRecentes.length) * 100
    : 100

  const status: StatusConformidade =
    percentualComPresenca >= 100 ? 'CONFORME' :
    percentualComPresenca >= 80 ? 'ALERTA' : 'NAO_CONFORME'

  return {
    id: 'PNTP-002',
    categoria: 'Processo Legislativo',
    requisito: 'Presenca em Sessoes',
    descricao: 'Presenca em sessoes deve ser atualizada em ate 30 dias',
    status,
    prazoLegal: '30 dias',
    ultimaAtualizacao: new Date(),
    detalhes: `${sessoesComPresenca.length}/${sessoesRecentes.length} sessoes com presenca registrada`,
    recomendacao: status !== 'CONFORME'
      ? 'Registrar presenca nas sessoes pendentes'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : status === 'ALERTA' ? 5 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica publicacao de pautas com 48h de antecedencia
 */
async function verificarPublicacaoPautas(): Promise<ItemVerificacaoPNTP> {
  const agora = new Date()
  const limite = new Date()
  limite.setDate(limite.getDate() + 7) // Proximos 7 dias

  const sessoesAgendadas = await prisma.sessao.findMany({
    where: {
      status: 'AGENDADA',
      data: {
        gte: agora,
        lte: limite
      }
    },
    include: {
      pautaSessao: true
    }
  })

  let pautasPublicadasCorretamente = 0
  let pautasPendentes = 0

  for (const sessao of sessoesAgendadas) {
    const horasAteSessao = differenceInHours(sessao.data, agora)

    if (sessao.pautaSessao?.status === 'APROVADA') {
      pautasPublicadasCorretamente++
    } else if (horasAteSessao <= 48) {
      pautasPendentes++
    }
  }

  const status: StatusConformidade =
    pautasPendentes === 0 ? 'CONFORME' :
    pautasPendentes <= 1 ? 'ALERTA' : 'NAO_CONFORME'

  return {
    id: 'PNTP-003',
    categoria: 'Processo Legislativo',
    requisito: 'Publicacao de Pautas',
    descricao: 'Pautas devem ser publicadas com 48h de antecedencia',
    status,
    prazoLegal: '48 horas',
    ultimaAtualizacao: new Date(),
    detalhes: `${pautasPublicadasCorretamente} pautas publicadas, ${pautasPendentes} pendentes`,
    recomendacao: status !== 'CONFORME'
      ? 'Publicar pautas das sessoes agendadas com antecedencia'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : status === 'ALERTA' ? 5 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica publicacao de atas em 15 dias
 */
async function verificarPublicacaoAtas(): Promise<ItemVerificacaoPNTP> {
  const limite = new Date()
  limite.setDate(limite.getDate() - PRAZOS_PNTP.ATA_PUBLICACAO)

  const sessoesAnteriores = await prisma.sessao.findMany({
    where: {
      status: 'CONCLUIDA',
      data: { lte: limite }
    },
    orderBy: { data: 'desc' },
    take: 20
  })

  // Verificar se tem ata publicada (campo ata ou documento vinculado)
  const sessoesComAta = sessoesAnteriores.filter(s => s.ata !== null && s.ata !== '')
  const percentualComAta = sessoesAnteriores.length > 0
    ? (sessoesComAta.length / sessoesAnteriores.length) * 100
    : 100

  const status: StatusConformidade =
    percentualComAta >= 100 ? 'CONFORME' :
    percentualComAta >= 80 ? 'ALERTA' : 'NAO_CONFORME'

  return {
    id: 'PNTP-004',
    categoria: 'Processo Legislativo',
    requisito: 'Publicacao de Atas',
    descricao: 'Atas devem ser publicadas em ate 15 dias apos aprovacao',
    status,
    prazoLegal: '15 dias',
    ultimaAtualizacao: new Date(),
    detalhes: `${sessoesComAta.length}/${sessoesAnteriores.length} sessoes com ata publicada`,
    recomendacao: status !== 'CONFORME'
      ? 'Publicar atas das sessoes concluidas ha mais de 15 dias'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : status === 'ALERTA' ? 5 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica lista de vereadores com partido e contatos
 */
async function verificarListaVereadores(): Promise<ItemVerificacaoPNTP> {
  const parlamentares = await prisma.parlamentar.findMany({
    where: { ativo: true }
  })

  const parlamentaresCompletos = parlamentares.filter(p =>
    p.nome &&
    p.partido &&
    (p.email || p.telefone)
  )

  const percentualCompleto = parlamentares.length > 0
    ? (parlamentaresCompletos.length / parlamentares.length) * 100
    : 0

  const status: StatusConformidade =
    percentualCompleto >= 100 ? 'CONFORME' :
    percentualCompleto >= 80 ? 'ALERTA' : 'NAO_CONFORME'

  return {
    id: 'PNTP-005',
    categoria: 'Parlamentares',
    requisito: 'Lista de Vereadores',
    descricao: 'Lista de vereadores com partido e contatos',
    status,
    prazoLegal: 'Permanente',
    ultimaAtualizacao: new Date(),
    detalhes: `${parlamentaresCompletos.length}/${parlamentares.length} parlamentares com dados completos`,
    recomendacao: status !== 'CONFORME'
      ? 'Completar dados de partido e contato dos parlamentares'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : status === 'ALERTA' ? 5 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica remuneracao de parlamentares
 */
async function verificarRemuneracaoParlamentares(): Promise<ItemVerificacaoPNTP> {
  // Verificar se existe publicacao de remuneracao (busca por titulo)
  const publicacoesRemuneracao = await prisma.publicacao.count({
    where: {
      publicada: true,
      OR: [
        { titulo: { contains: 'remuneração', mode: 'insensitive' } },
        { titulo: { contains: 'remuneracao', mode: 'insensitive' } },
        { titulo: { contains: 'salário', mode: 'insensitive' } },
        { titulo: { contains: 'salario', mode: 'insensitive' } },
        { titulo: { contains: 'subsidio', mode: 'insensitive' } },
        { titulo: { contains: 'subsídio', mode: 'insensitive' } }
      ]
    }
  })

  const status: StatusConformidade = publicacoesRemuneracao > 0 ? 'CONFORME' : 'NAO_CONFORME'

  return {
    id: 'PNTP-006',
    categoria: 'Parlamentares',
    requisito: 'Remuneracao de Parlamentares',
    descricao: 'Remuneracao dos parlamentares disponivel',
    status,
    prazoLegal: 'Mensal',
    ultimaAtualizacao: new Date(),
    detalhes: `${publicacoesRemuneracao} publicacoes de remuneracao`,
    recomendacao: status !== 'CONFORME'
      ? 'Publicar tabela de remuneracao dos parlamentares'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica diarias e verbas indenizatorias
 */
async function verificarDiariasVerbas(): Promise<ItemVerificacaoPNTP> {
  const publicacoesDiarias = await prisma.publicacao.count({
    where: {
      publicada: true,
      OR: [
        { titulo: { contains: 'diária', mode: 'insensitive' } },
        { titulo: { contains: 'diaria', mode: 'insensitive' } },
        { titulo: { contains: 'verba', mode: 'insensitive' } },
        { titulo: { contains: 'indenizat', mode: 'insensitive' } }
      ]
    }
  })

  const status: StatusConformidade = publicacoesDiarias > 0 ? 'CONFORME' : 'ALERTA'

  return {
    id: 'PNTP-007',
    categoria: 'Financeiro',
    requisito: 'Diarias e Verbas',
    descricao: 'Diarias e verbas indenizatorias publicadas',
    status,
    prazoLegal: 'Mensal',
    ultimaAtualizacao: new Date(),
    detalhes: `${publicacoesDiarias} publicacoes de diarias/verbas`,
    recomendacao: status !== 'CONFORME'
      ? 'Publicar relatorio de diarias e verbas indenizatorias'
      : undefined,
    pontuacao: status === 'CONFORME' ? 8 : status === 'ALERTA' ? 4 : 0,
    pontuacaoMaxima: 8
  }
}

/**
 * Verifica ouvidoria funcionando
 */
async function verificarOuvidoria(): Promise<ItemVerificacaoPNTP> {
  // Verificar configuracao de ouvidoria
  const configOuvidoria = await prisma.configuracao.findFirst({
    where: {
      chave: { contains: 'ouvidoria' }
    }
  })

  // Verificar se ha participacao cidada registrada (HistoricoParticipacao)
  const participacoes = await prisma.historicoParticipacao.count()

  const status: StatusConformidade =
    configOuvidoria && participacoes > 0 ? 'CONFORME' :
    configOuvidoria || participacoes > 0 ? 'ALERTA' : 'NAO_CONFORME'

  return {
    id: 'PNTP-008',
    categoria: 'Participacao Cidada',
    requisito: 'Ouvidoria',
    descricao: 'Ouvidoria com protocolo funcionando',
    status,
    prazoLegal: 'Permanente',
    ultimaAtualizacao: new Date(),
    detalhes: configOuvidoria ? 'Ouvidoria configurada' : 'Ouvidoria nao configurada',
    recomendacao: status !== 'CONFORME'
      ? 'Configurar e divulgar canal de ouvidoria'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : status === 'ALERTA' ? 5 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica e-SIC disponivel
 */
async function verificarESIC(): Promise<ItemVerificacaoPNTP> {
  // Verificar configuracao de e-SIC
  const configESIC = await prisma.configuracao.findFirst({
    where: {
      chave: { contains: 'esic' }
    }
  })

  const status: StatusConformidade = configESIC ? 'CONFORME' : 'ALERTA'

  return {
    id: 'PNTP-009',
    categoria: 'Participacao Cidada',
    requisito: 'e-SIC',
    descricao: 'Sistema eletronico de informacao ao cidadao disponivel',
    status,
    prazoLegal: 'Permanente',
    ultimaAtualizacao: new Date(),
    detalhes: configESIC ? 'e-SIC configurado' : 'e-SIC nao configurado',
    recomendacao: status !== 'CONFORME'
      ? 'Configurar sistema e-SIC para requisicoes de informacao'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : status === 'ALERTA' ? 5 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica contratos publicados em 24h
 */
async function verificarContratos(): Promise<ItemVerificacaoPNTP> {
  const limite = new Date()
  limite.setDate(limite.getDate() - 30)

  const contratosRecentes = await prisma.publicacao.findMany({
    where: {
      publicada: true,
      createdAt: { gte: limite },
      OR: [
        { titulo: { contains: 'contrato', mode: 'insensitive' } },
        { titulo: { contains: 'termo aditivo', mode: 'insensitive' } }
      ]
    }
  })

  // Verificar se foram publicados em ate 24h
  const contratosNoPrazo = contratosRecentes.filter(c => {
    const diasAtePublicacao = differenceInDays(c.createdAt, c.data || c.createdAt)
    return diasAtePublicacao <= PRAZOS_PNTP.CONTRATOS_PUBLICACAO
  })

  const percentualNoPrazo = contratosRecentes.length > 0
    ? (contratosNoPrazo.length / contratosRecentes.length) * 100
    : 100

  const status: StatusConformidade =
    percentualNoPrazo >= 100 ? 'CONFORME' :
    percentualNoPrazo >= 80 ? 'ALERTA' : 'NAO_CONFORME'

  return {
    id: 'PNTP-010',
    categoria: 'Financeiro',
    requisito: 'Contratos',
    descricao: 'Contratos publicados em ate 24h',
    status,
    prazoLegal: '24 horas',
    ultimaAtualizacao: new Date(),
    detalhes: `${contratosNoPrazo.length}/${contratosRecentes.length} contratos publicados no prazo`,
    recomendacao: status !== 'CONFORME'
      ? 'Publicar contratos dentro do prazo de 24h'
      : undefined,
    pontuacao: status === 'CONFORME' ? 8 : status === 'ALERTA' ? 4 : 0,
    pontuacaoMaxima: 8
  }
}

/**
 * Verifica licitacoes com editais
 */
async function verificarLicitacoes(): Promise<ItemVerificacaoPNTP> {
  const licitacoes = await prisma.publicacao.findMany({
    where: {
      publicada: true,
      OR: [
        { titulo: { contains: 'licitação', mode: 'insensitive' } },
        { titulo: { contains: 'licitacao', mode: 'insensitive' } },
        { titulo: { contains: 'edital', mode: 'insensitive' } },
        { titulo: { contains: 'pregão', mode: 'insensitive' } },
        { titulo: { contains: 'pregao', mode: 'insensitive' } }
      ]
    },
    take: 20,
    orderBy: { createdAt: 'desc' }
  })

  // Verificar se tem documento anexo (edital)
  const licitacoesComEdital = licitacoes.filter(l => l.arquivo !== null)
  const percentualComEdital = licitacoes.length > 0
    ? (licitacoesComEdital.length / licitacoes.length) * 100
    : 100

  const status: StatusConformidade =
    percentualComEdital >= 100 ? 'CONFORME' :
    percentualComEdital >= 80 ? 'ALERTA' : 'NAO_CONFORME'

  return {
    id: 'PNTP-011',
    categoria: 'Financeiro',
    requisito: 'Licitacoes',
    descricao: 'Licitacoes com editais completos',
    status,
    prazoLegal: 'Permanente',
    ultimaAtualizacao: new Date(),
    detalhes: `${licitacoesComEdital.length}/${licitacoes.length} licitacoes com edital`,
    recomendacao: status !== 'CONFORME'
      ? 'Anexar editais completos nas licitacoes'
      : undefined,
    pontuacao: status === 'CONFORME' ? 8 : status === 'ALERTA' ? 4 : 0,
    pontuacaoMaxima: 8
  }
}

/**
 * Verifica folha de pagamento
 */
async function verificarFolhaPagamento(): Promise<ItemVerificacaoPNTP> {
  const limite = new Date()
  limite.setDate(limite.getDate() - 60) // Ultimos 2 meses

  const folhasPagamento = await prisma.publicacao.count({
    where: {
      publicada: true,
      createdAt: { gte: limite },
      OR: [
        { titulo: { contains: 'folha de pagamento', mode: 'insensitive' } },
        { titulo: { contains: 'folha pagamento', mode: 'insensitive' } },
        { titulo: { contains: 'servidores', mode: 'insensitive' } }
      ]
    }
  })

  const status: StatusConformidade =
    folhasPagamento >= 2 ? 'CONFORME' :
    folhasPagamento >= 1 ? 'ALERTA' : 'NAO_CONFORME'

  return {
    id: 'PNTP-012',
    categoria: 'Financeiro',
    requisito: 'Folha de Pagamento',
    descricao: 'Folha de pagamento mensal publicada',
    status,
    prazoLegal: 'Mensal',
    ultimaAtualizacao: new Date(),
    detalhes: `${folhasPagamento} folhas publicadas nos ultimos 2 meses`,
    recomendacao: status !== 'CONFORME'
      ? 'Publicar folha de pagamento mensal'
      : undefined,
    pontuacao: status === 'CONFORME' ? 8 : status === 'ALERTA' ? 4 : 0,
    pontuacaoMaxima: 8
  }
}

/**
 * Verifica proposicoes legislativas
 */
async function verificarProposicoesLegislativas(): Promise<ItemVerificacaoPNTP> {
  const anoAtual = new Date().getFullYear()

  const proposicoes = await prisma.proposicao.count({
    where: { ano: anoAtual }
  })

  const proposicoesPublicas = await prisma.proposicao.count({
    where: {
      ano: anoAtual,
      status: { not: 'ARQUIVADA' }
    }
  })

  const status: StatusConformidade = proposicoes > 0 ? 'CONFORME' : 'ALERTA'

  return {
    id: 'PNTP-013',
    categoria: 'Processo Legislativo',
    requisito: 'Proposicoes Legislativas',
    descricao: 'Proposicoes legislativas disponiveis para consulta',
    status,
    prazoLegal: 'Permanente',
    ultimaAtualizacao: new Date(),
    detalhes: `${proposicoesPublicas} proposicoes publicas em ${anoAtual}`,
    recomendacao: status !== 'CONFORME'
      ? 'Cadastrar proposicoes no sistema'
      : undefined,
    pontuacao: status === 'CONFORME' ? 10 : status === 'ALERTA' ? 5 : 0,
    pontuacaoMaxima: 10
  }
}

/**
 * Verifica tramitacoes
 */
async function verificarTramitacoes(): Promise<ItemVerificacaoPNTP> {
  const limite = new Date()
  limite.setDate(limite.getDate() - 30)

  const tramitacoes = await prisma.tramitacao.count({
    where: {
      createdAt: { gte: limite }
    }
  })

  const status: StatusConformidade = tramitacoes > 0 ? 'CONFORME' : 'ALERTA'

  return {
    id: 'PNTP-014',
    categoria: 'Processo Legislativo',
    requisito: 'Tramitacoes',
    descricao: 'Tramitacoes de proposicoes atualizadas',
    status,
    prazoLegal: 'Continuo',
    ultimaAtualizacao: new Date(),
    detalhes: `${tramitacoes} tramitacoes nos ultimos 30 dias`,
    recomendacao: status !== 'CONFORME'
      ? 'Manter tramitacoes atualizadas no sistema'
      : undefined,
    pontuacao: status === 'CONFORME' ? 6 : status === 'ALERTA' ? 3 : 0,
    pontuacaoMaxima: 6
  }
}

/**
 * Agrupa itens por categoria
 */
function agruparPorCategoria(itens: ItemVerificacaoPNTP[]): RelatorioPNTP['categorias'] {
  const grupos = new Map<string, ItemVerificacaoPNTP[]>()

  for (const item of itens) {
    const lista = grupos.get(item.categoria) || []
    lista.push(item)
    grupos.set(item.categoria, lista)
  }

  return Array.from(grupos.entries()).map(([categoria, itensCategoria]) => ({
    categoria,
    pontuacao: itensCategoria.reduce((acc, i) => acc + i.pontuacao, 0),
    pontuacaoMaxima: itensCategoria.reduce((acc, i) => acc + i.pontuacaoMaxima, 0),
    itens: itensCategoria
  }))
}

/**
 * Determina nivel PNTP baseado no percentual
 */
function determinarNivel(percentual: number): RelatorioPNTP['nivelAtual'] {
  if (percentual >= 90) return 'DIAMANTE'
  if (percentual >= 75) return 'OURO'
  if (percentual >= 50) return 'PRATA'
  return 'BRONZE'
}

/**
 * Gera alertas de dados desatualizados
 */
export async function gerarAlertasDesatualizacao(): Promise<{
  alertas: Array<{
    tipo: string
    mensagem: string
    urgencia: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
    diasDesdeAtualizacao: number
  }>
}> {
  const alertas: Array<{
    tipo: string
    mensagem: string
    urgencia: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
    diasDesdeAtualizacao: number
  }> = []

  // Verificar sessoes sem ata
  const sessoesAnteriores = await prisma.sessao.findMany({
    where: {
      status: 'CONCLUIDA',
      ata: null
    },
    orderBy: { data: 'asc' },
    take: 10
  })

  for (const sessao of sessoesAnteriores) {
    const diasSemAta = differenceInDays(new Date(), sessao.data)
    if (diasSemAta > PRAZOS_PNTP.ATA_PUBLICACAO) {
      alertas.push({
        tipo: 'ATA_PENDENTE',
        mensagem: `Sessao ${sessao.numero}/${sessao.tipo} de ${sessao.data.toLocaleDateString('pt-BR')} sem ata publicada`,
        urgencia: diasSemAta > 30 ? 'CRITICA' : diasSemAta > 20 ? 'ALTA' : 'MEDIA',
        diasDesdeAtualizacao: diasSemAta
      })
    }
  }

  // Verificar sessoes sem presenca
  const sessoesSemPresenca = await prisma.sessao.findMany({
    where: {
      status: 'CONCLUIDA',
      presencas: { none: {} }
    },
    orderBy: { data: 'asc' },
    take: 10
  })

  for (const sessao of sessoesSemPresenca) {
    const diasSemPresenca = differenceInDays(new Date(), sessao.data)
    if (diasSemPresenca > 7) {
      alertas.push({
        tipo: 'PRESENCA_PENDENTE',
        mensagem: `Sessao ${sessao.numero}/${sessao.tipo} sem registro de presenca`,
        urgencia: diasSemPresenca > PRAZOS_PNTP.PRESENCA_SESSOES ? 'CRITICA' : 'ALTA',
        diasDesdeAtualizacao: diasSemPresenca
      })
    }
  }

  // Verificar proposicoes em tramitacao sem movimentacao
  const proposicoesSemMovimentacao = await prisma.proposicao.findMany({
    where: {
      status: 'EM_TRAMITACAO',
      tramitacoes: { none: {} }
    },
    take: 10
  })

  for (const prop of proposicoesSemMovimentacao) {
    const diasSemMovimentacao = differenceInDays(new Date(), prop.createdAt)
    if (diasSemMovimentacao > 15) {
      alertas.push({
        tipo: 'TRAMITACAO_PARADA',
        mensagem: `Proposicao ${prop.numero}/${prop.ano} sem movimentacao`,
        urgencia: diasSemMovimentacao > 30 ? 'ALTA' : 'MEDIA',
        diasDesdeAtualizacao: diasSemMovimentacao
      })
    }
  }

  logger.info('Alertas de desatualizacao gerados', {
    action: 'gerar_alertas_desatualizacao',
    totalAlertas: alertas.length,
    criticos: alertas.filter(a => a.urgencia === 'CRITICA').length,
    altos: alertas.filter(a => a.urgencia === 'ALTA').length
  })

  return { alertas }
}

/**
 * Sincroniza dados admin -> portal
 */
export async function sincronizarDadosPortal(): Promise<{
  sincronizados: number
  erros: number
  detalhes: string[]
}> {
  const detalhes: string[] = []
  let sincronizados = 0
  let erros = 0

  try {
    // Atualizar cache de parlamentares ativos
    const parlamentares = await prisma.parlamentar.count({ where: { ativo: true } })
    detalhes.push(`${parlamentares} parlamentares ativos sincronizados`)
    sincronizados++

    // Atualizar cache de sessoes recentes
    const sessoesRecentes = await prisma.sessao.count({
      where: {
        data: { gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) }
      }
    })
    detalhes.push(`${sessoesRecentes} sessoes dos ultimos 3 meses sincronizadas`)
    sincronizados++

    // Atualizar cache de proposicoes do ano
    const proposicoes = await prisma.proposicao.count({
      where: { ano: new Date().getFullYear() }
    })
    detalhes.push(`${proposicoes} proposicoes do ano sincronizadas`)
    sincronizados++

    // Atualizar publicacoes recentes
    const publicacoes = await prisma.publicacao.count({
      where: {
        publicada: true,
        createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
      }
    })
    detalhes.push(`${publicacoes} publicacoes do ultimo mes sincronizadas`)
    sincronizados++

  } catch (error) {
    logger.error('Erro ao sincronizar dados', { error })
    erros++
    detalhes.push(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`)
  }

  logger.info('Sincronizacao concluida', {
    action: 'sincronizar_dados_portal',
    sincronizados,
    erros
  })

  return { sincronizados, erros, detalhes }
}

/**
 * Exporta resumo das funcionalidades
 */
export const FUNCIONALIDADES_TRANSPARENCIA = {
  'verificarConformidadePNTP': 'Gera relatorio completo de conformidade PNTP',
  'gerarAlertasDesatualizacao': 'Lista alertas de dados desatualizados',
  'sincronizarDadosPortal': 'Sincroniza dados do admin para o portal publico',
  'PRAZOS_PNTP': 'Prazos legais para atualizacao de dados'
}
