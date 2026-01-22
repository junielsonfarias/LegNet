/**
 * Serviço de Emendas a Proposições
 * Implementa sistema completo de emendas seguindo padrão SAPL
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type {
  TipoEmenda,
  StatusEmenda,
  TipoVoto,
  ResultadoEmenda,
  TipoParecerEmenda
} from '@prisma/client'

const logger = createLogger('emenda')

// Tipos exportados
export type { TipoEmenda, StatusEmenda, ResultadoEmenda, TipoParecerEmenda }

export interface CriarEmendaInput {
  proposicaoId: string
  autorId: string
  coautores?: string[]
  tipo: TipoEmenda
  artigo?: string
  paragrafo?: string
  inciso?: string
  alinea?: string
  dispositivo?: string
  textoOriginal?: string
  textoNovo: string
  justificativa: string
  turnoApresentacao?: number
  prazoEmenda?: Date
}

export interface AtualizarEmendaInput {
  status?: StatusEmenda
  parecerComissao?: string
  parecerTipo?: TipoParecerEmenda
  parecerTexto?: string
  parecerData?: Date
  parecerRelatorId?: string
  observacoes?: string
}

export interface VotarEmendaInput {
  parlamentarId: string
  voto: TipoVoto
  sessaoId?: string
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
async function gerarNumeroEmenda(proposicaoId: string): Promise<number> {
  const count = await prisma.emenda.count({
    where: { proposicaoId }
  })
  return count + 1
}

/**
 * Cria nova emenda a uma proposição
 */
export async function criarEmenda(input: CriarEmendaInput) {
  const numero = await gerarNumeroEmenda(input.proposicaoId)

  const emenda = await prisma.emenda.create({
    data: {
      proposicaoId: input.proposicaoId,
      autorId: input.autorId,
      coautores: input.coautores ? JSON.stringify(input.coautores) : null,
      tipo: input.tipo,
      numero,
      artigo: input.artigo,
      paragrafo: input.paragrafo,
      inciso: input.inciso,
      alinea: input.alinea,
      dispositivo: input.dispositivo,
      textoOriginal: input.textoOriginal,
      textoNovo: input.textoNovo,
      justificativa: input.justificativa,
      turnoApresentacao: input.turnoApresentacao || 1,
      prazoEmenda: input.prazoEmenda,
      status: 'APRESENTADA'
    },
    include: {
      autor: {
        select: { id: true, nome: true, partido: true, foto: true }
      },
      proposicao: {
        select: { id: true, numero: true, ano: true, tipo: true, titulo: true }
      },
      votosEmenda: true
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
      autor: {
        select: { id: true, nome: true, apelido: true, partido: true, foto: true }
      },
      proposicao: {
        select: { id: true, numero: true, ano: true, tipo: true, titulo: true, ementa: true }
      },
      parecerRelator: {
        select: { id: true, nome: true, apelido: true, partido: true }
      },
      sessaoVotacao: {
        select: { id: true, numero: true, tipo: true, data: true }
      },
      votosEmenda: {
        include: {
          parlamentar: {
            select: { id: true, nome: true, apelido: true, partido: true }
          }
        }
      },
      emendaAglutinada: {
        select: { id: true, numero: true, tipo: true }
      },
      emendasAglutinadas: {
        select: { id: true, numero: true, tipo: true, status: true }
      }
    }
  })

  if (!emenda) return null

  // Parse coautores
  let coautoresParsed: string[] = []
  if (emenda.coautores) {
    try {
      coautoresParsed = JSON.parse(emenda.coautores)
    } catch {
      coautoresParsed = []
    }
  }

  return {
    ...emenda,
    coautoresParsed
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

  const emendas = await prisma.emenda.findMany({
    where,
    include: {
      autor: {
        select: { id: true, nome: true, apelido: true, partido: true, foto: true }
      },
      _count: {
        select: { votosEmenda: true }
      }
    },
    orderBy: [
      { numero: 'asc' }
    ]
  })

  return emendas
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
        autor: {
          select: { id: true, nome: true, apelido: true, partido: true }
        },
        proposicao: {
          select: { id: true, numero: true, ano: true, tipo: true, titulo: true }
        },
        _count: {
          select: { votosEmenda: true }
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
  const updateData: any = {}

  if (input.status !== undefined) updateData.status = input.status
  if (input.parecerComissao !== undefined) updateData.parecerComissao = input.parecerComissao
  if (input.parecerTipo !== undefined) updateData.parecerTipo = input.parecerTipo
  if (input.parecerTexto !== undefined) updateData.parecerTexto = input.parecerTexto
  if (input.parecerData !== undefined) updateData.parecerData = input.parecerData
  if (input.parecerRelatorId !== undefined) updateData.parecerRelatorId = input.parecerRelatorId
  if (input.observacoes !== undefined) updateData.observacoes = input.observacoes

  const emenda = await prisma.emenda.update({
    where: { id },
    data: updateData,
    include: {
      autor: {
        select: { id: true, nome: true, apelido: true, partido: true }
      },
      proposicao: {
        select: { id: true, numero: true, ano: true, tipo: true, titulo: true }
      }
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
 * Inicia votação de uma emenda
 */
export async function iniciarVotacaoEmenda(emendaId: string, sessaoId: string) {
  const emenda = await prisma.emenda.update({
    where: { id: emendaId },
    data: {
      status: 'EM_VOTACAO',
      sessaoVotacaoId: sessaoId
    }
  })

  logger.info('Votação de emenda iniciada', {
    action: 'iniciar_votacao_emenda',
    emendaId,
    sessaoId
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
      data: {
        voto: input.voto,
        sessaoId: input.sessaoId
      }
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
      voto: input.voto,
      sessaoId: input.sessaoId
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
 * Registra votos de múltiplos parlamentares em uma emenda
 */
export async function registrarVotosEmenda(
  emendaId: string,
  votos: Array<{ parlamentarId: string; voto: TipoVoto }>,
  sessaoId?: string
) {
  const results = await Promise.all(
    votos.map(v => votarEmenda(emendaId, { ...v, sessaoId }))
  )

  return results
}

/**
 * Apura resultado da votação de uma emenda
 */
export async function apurarVotacaoEmenda(emendaId: string) {
  const votos = await prisma.votoEmenda.findMany({
    where: { emendaId },
    include: {
      parlamentar: {
        select: { id: true, nome: true, apelido: true, partido: true }
      }
    }
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
    resultado: aprovada ? 'APROVADA' as ResultadoEmenda : 'REJEITADA' as ResultadoEmenda,
    votos
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
      resultado: apuracao.resultado,
      votosSim: apuracao.contagem.SIM,
      votosNao: apuracao.contagem.NAO,
      votosAbstencao: apuracao.contagem.ABSTENCAO
    },
    include: {
      autor: {
        select: { id: true, nome: true, apelido: true, partido: true }
      },
      proposicao: {
        select: { id: true, numero: true, ano: true, tipo: true, titulo: true }
      }
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
      status: 'RETIRADA',
      resultado: 'RETIRADA',
      observacoes: motivo
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
      status: 'PREJUDICADA',
      resultado: 'PREJUDICADA',
      observacoes: motivo
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
 * Marca emenda como incorporada ao texto (após aprovação)
 */
export async function incorporarEmenda(id: string) {
  const emenda = await prisma.emenda.update({
    where: { id },
    data: {
      status: 'INCORPORADA'
    }
  })

  logger.info('Emenda incorporada ao texto', {
    action: 'incorporar_emenda',
    emendaId: id
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

  // Verificar status das emendas
  const emendasInvalidas = emendas.filter(e =>
    !['APRESENTADA', 'EM_ANALISE', 'PARECER_EMITIDO'].includes(e.status)
  )
  if (emendasInvalidas.length > 0) {
    throw new Error('Uma ou mais emendas não podem ser aglutinadas (status inválido)')
  }

  // Criar emenda aglutinada
  const numero = await gerarNumeroEmenda(proposicaoId)

  const emendaAglutinada = await prisma.$transaction(async (tx) => {
    // Criar nova emenda aglutinativa
    const novaEmenda = await tx.emenda.create({
      data: {
        proposicaoId,
        autorId,
        tipo: 'AGLUTINATIVA',
        numero,
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
        emendaAglutinadaId: novaEmenda.id
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
 * Emite parecer sobre emenda
 */
export async function emitirParecerEmenda(
  emendaId: string,
  parecerTipo: TipoParecerEmenda,
  parecerTexto: string,
  comissaoId: string,
  relatorId: string
) {
  const emenda = await prisma.emenda.update({
    where: { id: emendaId },
    data: {
      status: 'PARECER_EMITIDO',
      parecerTipo,
      parecerTexto,
      parecerComissao: comissaoId,
      parecerRelatorId: relatorId,
      parecerData: new Date()
    },
    include: {
      autor: {
        select: { id: true, nome: true, apelido: true, partido: true }
      },
      parecerRelator: {
        select: { id: true, nome: true, apelido: true, partido: true }
      }
    }
  })

  logger.info('Parecer emitido sobre emenda', {
    action: 'emitir_parecer_emenda',
    emendaId,
    parecerTipo,
    comissaoId,
    relatorId
  })

  return emenda
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
      texto: true,
      tipo: true
    }
  })

  if (!proposicao) {
    throw new Error('Proposição não encontrada')
  }

  // Buscar emendas aprovadas (não aglutinadas)
  const emendasAprovadas = await prisma.emenda.findMany({
    where: {
      proposicaoId,
      status: { in: ['APROVADA', 'INCORPORADA'] },
      aglutinada: false
    },
    include: {
      autor: {
        select: { id: true, nome: true, apelido: true, partido: true }
      }
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
    autor: emenda.autor,
    referencia: [
      emenda.artigo ? `Art. ${emenda.artigo}` : null,
      emenda.paragrafo ? `§ ${emenda.paragrafo}` : null,
      emenda.inciso ? `Inc. ${emenda.inciso}` : null,
      emenda.alinea ? `Alínea ${emenda.alinea}` : null,
      emenda.dispositivo
    ].filter(Boolean).join(', ') || 'Texto geral',
    textoOriginal: emenda.textoOriginal,
    textoNovo: emenda.textoNovo,
    justificativa: emenda.justificativa,
    dataAprovacao: emenda.dataVotacao
  }))

  // Resumo por tipo de emenda
  const resumoPorTipo = emendasAprovadas.reduce((acc, emenda) => {
    acc[emenda.tipo] = (acc[emenda.tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    proposicao,
    textoOriginal: proposicao.texto,
    emendasAprovadas: emendasAprovadas.length,
    alteracoes,
    resumoPorTipo,
    geradoEm: new Date()
  }
}

/**
 * Verifica prazo para apresentação de emendas
 */
export async function verificarPrazoEmendas(proposicaoId: string) {
  // Buscar proposição para verificar se há prazo configurado
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: { id: true }
  })

  if (!proposicao) {
    return {
      prazoDeterminado: false,
      podeCadastrar: false,
      erro: 'Proposição não encontrada'
    }
  }

  // Buscar emenda mais recente da proposição para verificar prazo
  const emendaComPrazo = await prisma.emenda.findFirst({
    where: {
      proposicaoId,
      prazoEmenda: { not: null }
    },
    orderBy: { prazoEmenda: 'desc' },
    select: { prazoEmenda: true }
  })

  if (!emendaComPrazo || !emendaComPrazo.prazoEmenda) {
    return {
      prazoDeterminado: false,
      podeCadastrar: true
    }
  }

  const agora = new Date()
  const prazo = new Date(emendaComPrazo.prazoEmenda)

  return {
    prazoDeterminado: true,
    prazo,
    podeCadastrar: agora < prazo,
    prazoVencido: agora >= prazo
  }
}

/**
 * Define prazo para apresentação de emendas
 */
export async function definirPrazoEmendas(
  proposicaoId: string,
  prazo: Date
) {
  // Atualizar todas as emendas existentes com o novo prazo
  await prisma.emenda.updateMany({
    where: { proposicaoId },
    data: { prazoEmenda: prazo }
  })

  logger.info('Prazo para emendas definido', {
    action: 'definir_prazo_emendas',
    proposicaoId,
    prazo
  })

  return { proposicaoId, prazo }
}

/**
 * Estatísticas de emendas por proposição
 */
export async function getEstatisticasEmendas(proposicaoId: string) {
  const [
    porStatus,
    porTipo,
    total,
    votadasAprovadas,
    votadasRejeitadas
  ] = await Promise.all([
    prisma.emenda.groupBy({
      by: ['status'],
      where: { proposicaoId },
      _count: true
    }),
    prisma.emenda.groupBy({
      by: ['tipo'],
      where: { proposicaoId },
      _count: true
    }),
    prisma.emenda.count({
      where: { proposicaoId }
    }),
    prisma.emenda.count({
      where: { proposicaoId, status: 'APROVADA' }
    }),
    prisma.emenda.count({
      where: { proposicaoId, status: 'REJEITADA' }
    })
  ])

  return {
    total,
    aprovadas: votadasAprovadas,
    rejeitadas: votadasRejeitadas,
    porStatus: porStatus.map(e => ({ status: e.status, quantidade: e._count })),
    porTipo: porTipo.map(t => ({ tipo: t.tipo, quantidade: t._count }))
  }
}

/**
 * Lista votos de uma emenda
 */
export async function listarVotosEmenda(emendaId: string) {
  const votos = await prisma.votoEmenda.findMany({
    where: { emendaId },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true,
          foto: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return votos
}

/**
 * Excluir emenda (apenas se APRESENTADA ou EM_ANALISE)
 */
export async function excluirEmenda(id: string) {
  const emenda = await prisma.emenda.findUnique({
    where: { id }
  })

  if (!emenda) {
    throw new Error('Emenda não encontrada')
  }

  if (!['APRESENTADA', 'EM_ANALISE'].includes(emenda.status)) {
    throw new Error(`Não é possível excluir emenda com status ${emenda.status}`)
  }

  await prisma.emenda.delete({
    where: { id }
  })

  logger.info('Emenda excluída', {
    action: 'excluir_emenda',
    emendaId: id
  })

  return { success: true }
}
