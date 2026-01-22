/**
 * Serviço de Emendas a Proposições
 * Implementa sistema completo de emendas seguindo padrão SAPL
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type {
  TipoEmenda,
  StatusEmenda,
  TipoVoto
} from '@prisma/client'

const logger = createLogger('emenda')

// Tipos exportados
export type { TipoEmenda, StatusEmenda }

export interface CriarEmendaInput {
  proposicaoId: string
  autorId: string
  coautores?: string[]
  tipo: TipoEmenda
  numero?: string
  artigo?: string
  paragrafo?: string
  inciso?: string
  alinea?: string
  textoOriginal?: string
  textoNovo: string
  justificativa: string
  turnoApresentacao?: number
}

export interface AtualizarEmendaInput {
  status?: StatusEmenda
  parecerComissao?: string
  parecerTipo?: 'FAVORAVEL' | 'CONTRARIO' | 'FAVORAVEL_COM_RESSALVAS'
  parecerTexto?: string
}

export interface VotarEmendaInput {
  parlamentarId: string
  voto: TipoVoto
}

export interface FiltrosEmenda {
  proposicaoId?: string
  autorId?: string
  tipo?: TipoEmenda
  status?: StatusEmenda
  turno?: number
}

/**
 * Gera número sequencial de emenda para a proposição
 */
async function gerarNumeroEmenda(proposicaoId: string): Promise<string> {
  const count = await prisma.emenda.count({
    where: { proposicaoId }
  })
  return (count + 1).toString().padStart(3, '0')
}

/**
 * Cria nova emenda a uma proposição
 */
export async function criarEmenda(input: CriarEmendaInput) {
  const numero = input.numero || await gerarNumeroEmenda(input.proposicaoId)

  const ano = new Date().getFullYear()
  const emenda = await prisma.emenda.create({
    data: {
      proposicaoId: input.proposicaoId,
      autorId: input.autorId,
      coautores: input.coautores ? JSON.stringify(input.coautores) : null,
      tipo: input.tipo,
      numero: parseInt(numero),
      ano,
      artigo: input.artigo,
      paragrafo: input.paragrafo,
      inciso: input.inciso,
      alinea: input.alinea,
      textoOriginal: input.textoOriginal,
      textoNovo: input.textoNovo,
      justificativa: input.justificativa,
      turnoApresentacao: input.turnoApresentacao || 1,
      status: 'APRESENTADA'
    },
    include: {
      votos: true
    }
  })

  logger.info('Emenda criada', {
    action: 'criar_emenda',
    emendaId: emenda.id,
    proposicaoId: input.proposicaoId,
    autorId: input.autorId,
    tipo: input.tipo
  })

  return emenda
}

/**
 * Busca emenda por ID
 */
export async function buscarEmendaPorId(id: string) {
  const emenda = await prisma.emenda.findUnique({
    where: { id },
    include: {
      votos: true
    }
  })

  if (!emenda) return null

  // Buscar dados do autor
  const autor = await prisma.parlamentar.findUnique({
    where: { id: emenda.autorId },
    select: { id: true, nome: true, partido: true, foto: true }
  })

  // Buscar dados da proposição
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: emenda.proposicaoId },
    select: { id: true, numero: true, ano: true, titulo: true, tipo: true, ementa: true }
  })

  return {
    ...emenda,
    autor,
    proposicao
  }
}

/**
 * Lista emendas de uma proposição
 */
export async function listarEmendasProposicao(
  proposicaoId: string,
  turno?: number
) {
  const where: any = { proposicaoId }

  if (turno) {
    where.turnoApresentacao = turno
  }

  return prisma.emenda.findMany({
    where,
    include: {
      _count: {
        select: { votos: true }
      }
    },
    orderBy: [
      { numero: 'asc' }
    ]
  })
}

/**
 * Lista emendas com filtros
 */
export async function listarEmendas(
  filtros: FiltrosEmenda,
  page: number = 1,
  limit: number = 20
) {
  const where: any = {}

  if (filtros.proposicaoId) {
    where.proposicaoId = filtros.proposicaoId
  }

  if (filtros.autorId) {
    where.autorId = filtros.autorId
  }

  if (filtros.tipo) {
    where.tipo = filtros.tipo
  }

  if (filtros.status) {
    where.status = filtros.status
  }

  if (filtros.turno) {
    where.turnoApresentacao = filtros.turno
  }

  const [emendas, total] = await Promise.all([
    prisma.emenda.findMany({
      where,
      include: {
        _count: {
          select: { votos: true }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.emenda.count({ where })
  ])

  return {
    emendas,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Atualiza emenda
 */
export async function atualizarEmenda(
  id: string,
  input: AtualizarEmendaInput
) {
  const emenda = await prisma.emenda.update({
    where: { id },
    data: {
      status: input.status,
      parecerComissao: input.parecerComissao,
      parecerTipo: input.parecerTipo,
      parecerTexto: input.parecerTexto
    }
  })

  logger.info('Emenda atualizada', {
    action: 'atualizar_emenda',
    emendaId: id,
    status: input.status
  })

  return emenda
}

/**
 * Registra voto em emenda
 */
export async function votarEmenda(
  emendaId: string,
  input: VotarEmendaInput
) {
  // Verificar se já votou
  const votoExistente = await prisma.votoEmenda.findUnique({
    where: {
      emendaId_parlamentarId: {
        emendaId,
        parlamentarId: input.parlamentarId
      }
    }
  })

  if (votoExistente) {
    // Atualizar voto existente
    const voto = await prisma.votoEmenda.update({
      where: { id: votoExistente.id },
      data: { voto: input.voto }
    })

    logger.info('Voto em emenda atualizado', {
      action: 'atualizar_voto_emenda',
      emendaId,
      parlamentarId: input.parlamentarId,
      voto: input.voto
    })

    return voto
  }

  // Criar novo voto
  const voto = await prisma.votoEmenda.create({
    data: {
      emendaId,
      parlamentarId: input.parlamentarId,
      voto: input.voto
    }
  })

  logger.info('Voto em emenda registrado', {
    action: 'votar_emenda',
    emendaId,
    parlamentarId: input.parlamentarId,
    voto: input.voto
  })

  return voto
}

/**
 * Apura resultado da votação de uma emenda
 */
export async function apurarVotacaoEmenda(emendaId: string) {
  const votos = await prisma.votoEmenda.findMany({
    where: { emendaId }
  })

  const contagem = {
    SIM: 0,
    NAO: 0,
    ABSTENCAO: 0,
    AUSENTE: 0
  }

  votos.forEach(voto => {
    contagem[voto.voto]++
  })

  const total = votos.length
  const votosValidos = contagem.SIM + contagem.NAO

  // Maioria simples para emendas
  const aprovada = contagem.SIM > contagem.NAO

  return {
    total,
    votosValidos,
    contagem,
    aprovada,
    resultado: aprovada ? 'APROVADA' : 'REJEITADA'
  }
}

/**
 * Finaliza votação de emenda
 */
export async function finalizarVotacaoEmenda(emendaId: string) {
  const apuracao = await apurarVotacaoEmenda(emendaId)

  const emenda = await prisma.emenda.update({
    where: { id: emendaId },
    data: {
      status: apuracao.aprovada ? 'APROVADA' : 'REJEITADA',
      dataVotacao: new Date(),
      resultado: apuracao.resultado as any,
      votosSim: apuracao.contagem.SIM,
      votosNao: apuracao.contagem.NAO,
      votosAbstencao: apuracao.contagem.ABSTENCAO
    }
  })

  logger.info('Votação de emenda finalizada', {
    action: 'finalizar_votacao_emenda',
    emendaId,
    resultado: apuracao.resultado
  })

  return { emenda, apuracao }
}

/**
 * Retira emenda
 */
export async function retirarEmenda(id: string, motivo?: string) {
  const emenda = await prisma.emenda.update({
    where: { id },
    data: {
      status: 'RETIRADA'
    }
  })

  logger.info('Emenda retirada', {
    action: 'retirar_emenda',
    emendaId: id,
    motivo
  })

  return emenda
}

/**
 * Marca emenda como prejudicada
 */
export async function prejudicarEmenda(id: string, motivo?: string) {
  const emenda = await prisma.emenda.update({
    where: { id },
    data: {
      status: 'PREJUDICADA'
    }
  })

  logger.info('Emenda prejudicada', {
    action: 'prejudicar_emenda',
    emendaId: id,
    motivo
  })

  return emenda
}

/**
 * Aglutina emendas
 * Cria uma nova emenda que incorpora outras
 */
export async function aglutinarEmendas(
  proposicaoId: string,
  emendasIds: string[],
  autorId: string,
  textoNovo: string,
  justificativa: string
) {
  // Verificar se todas as emendas são da mesma proposição
  const emendas = await prisma.emenda.findMany({
    where: {
      id: { in: emendasIds },
      proposicaoId
    }
  })

  if (emendas.length !== emendasIds.length) {
    throw new Error('Uma ou mais emendas não pertencem à proposição')
  }

  // Criar emenda aglutinada
  const numero = await gerarNumeroEmenda(proposicaoId)
  const ano = new Date().getFullYear()

  const emendaAglutinada = await prisma.$transaction(async (tx) => {
    // Criar nova emenda
    const novaEmenda = await tx.emenda.create({
      data: {
        proposicaoId,
        autorId,
        tipo: 'SUBSTITUTIVA',
        numero: parseInt(numero),
        ano,
        textoNovo,
        justificativa,
        turnoApresentacao: emendas[0].turnoApresentacao,
        status: 'APRESENTADA',
        aglutinada: false
      }
    })

    // Marcar emendas originais como aglutinadas
    await tx.emenda.updateMany({
      where: { id: { in: emendasIds } },
      data: {
        aglutinada: true,
        emendaAglutinadaId: novaEmenda.id,
        status: 'AGLUTINADA'
      }
    })

    return novaEmenda
  })

  logger.info('Emendas aglutinadas', {
    action: 'aglutinar_emendas',
    emendaAglutinadaId: emendaAglutinada.id,
    emendasOriginais: emendasIds
  })

  return emendaAglutinada
}

/**
 * Gera texto consolidado da proposição com emendas aprovadas
 */
export async function gerarTextoConsolidado(proposicaoId: string) {
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: {
      id: true,
      numero: true,
      ano: true,
      titulo: true,
      ementa: true,
      texto: true
    }
  })

  if (!proposicao) {
    throw new Error('Proposição não encontrada')
  }

  // Buscar emendas aprovadas
  const emendasAprovadas = await prisma.emenda.findMany({
    where: {
      proposicaoId,
      status: 'APROVADA',
      aglutinada: false
    },
    orderBy: [
      { artigo: 'asc' },
      { paragrafo: 'asc' },
      { inciso: 'asc' },
      { numero: 'asc' }
    ]
  })

  // Gerar relatório de alterações
  const alteracoes = emendasAprovadas.map(emenda => ({
    numero: emenda.numero,
    tipo: emenda.tipo,
    referencia: [
      emenda.artigo ? `Art. ${emenda.artigo}` : null,
      emenda.paragrafo ? `§ ${emenda.paragrafo}` : null,
      emenda.inciso ? `Inc. ${emenda.inciso}` : null,
      emenda.alinea ? `Alínea ${emenda.alinea}` : null
    ].filter(Boolean).join(', ') || 'Texto geral',
    textoOriginal: emenda.textoOriginal,
    textoNovo: emenda.textoNovo,
    justificativa: emenda.justificativa
  }))

  return {
    proposicao,
    textoOriginal: proposicao.texto,
    emendasAprovadas: emendasAprovadas.length,
    alteracoes,
    geradoEm: new Date()
  }
}

/**
 * Verifica prazo para apresentação de emendas
 */
export async function verificarPrazoEmendas(proposicaoId: string) {
  // Buscar emenda mais recente da proposição para verificar prazo
  const emendaRecente = await prisma.emenda.findFirst({
    where: {
      proposicaoId,
      prazoEmenda: { not: null }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!emendaRecente || !emendaRecente.prazoEmenda) {
    return {
      prazoDeterminado: false,
      podeCadastrar: true
    }
  }

  const agora = new Date()
  const prazo = new Date(emendaRecente.prazoEmenda)

  return {
    prazoDeterminado: true,
    prazo,
    podeCadastrar: agora < prazo,
    prazoVencido: agora >= prazo
  }
}

/**
 * Estatísticas de emendas por proposição
 */
export async function getEstatisticasEmendas(proposicaoId: string) {
  const emendas = await prisma.emenda.groupBy({
    by: ['status'],
    where: { proposicaoId },
    _count: true
  })

  const porTipo = await prisma.emenda.groupBy({
    by: ['tipo'],
    where: { proposicaoId },
    _count: true
  })

  const total = await prisma.emenda.count({
    where: { proposicaoId }
  })

  return {
    total,
    porStatus: emendas.map(e => ({ status: e.status, quantidade: e._count })),
    porTipo: porTipo.map(t => ({ tipo: t.tipo, quantidade: t._count }))
  }
}
