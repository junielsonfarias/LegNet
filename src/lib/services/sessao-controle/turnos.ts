/**
 * Controle de turnos de votação em sessão (extraído de sessao-controle.ts).
 *
 * Responsável por iniciar/finalizar turnos, verificar interstício e iniciar
 * segundo turno de votação conforme tipo de proposição e regimento.
 *
 * Dependências cruzadas:
 * - `../sessao-controle` para helpers compartilhados (obterSessaoParaControle,
 *   contabilizarVotos, atualizarResultadoProposicao, tempo helpers).
 *   Ciclo seguro: todos os usos ocorrem dentro de corpos de função assíncrona,
 *   nunca em top-level.
 */

import { prisma } from '@/lib/prisma'
import { ValidationError } from '@/lib/error-handler'
import type { ResultadoVotacaoAgrupada, TipoQuorum, TipoVotacao } from '@prisma/client'
import {
  getConfiguracaoTurno,
  inicializarTurnoPautaItem,
  registrarResultadoTurno,
  podeIniciarSegundoTurno,
  iniciarSegundoTurno as iniciarSegundoTurnoService,
  registrarVotacaoAgrupada,
  listarItensEmIntersticio,
} from '@/lib/services/turno-service'
import {
  obterSessaoParaControle,
  contabilizarVotos,
  atualizarResultadoProposicao,
  calcularTempoAcumulado,
  atualizarTempoTotalReal,
} from '../sessao-controle'

/**
 * Inicializa turno de votação para um item da pauta.
 * Configura os campos de turno baseado no tipo da proposição.
 */
export async function iniciarTurnoItem(
  sessaoId: string,
  itemId: string
): Promise<{
  item: Record<string, unknown> | null
  configuracao: {
    totalTurnos: number
    tipoQuorum: TipoQuorum
    descricao: string
  }
}> {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para iniciar turno de votação')
  }

  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: true,
      proposicao: true,
    },
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (!item.proposicaoId || !item.proposicao) {
    throw new ValidationError('Item deve ter uma proposição vinculada para votação por turnos')
  }

  const tipoProposicao = item.proposicao.tipo
  const config = getConfiguracaoTurno(tipoProposicao)

  await inicializarTurnoPautaItem(itemId, tipoProposicao)

  await prisma.$transaction([
    prisma.pautaItem.update({
      where: { id: itemId },
      data: {
        status: 'EM_DISCUSSAO',
        iniciadoEm: new Date(),
      },
    }),
    prisma.pautaSessao.update({
      where: { id: item.pautaId },
      data: {
        itemAtualId: itemId,
      },
    }),
  ])

  const itemAtualizado = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { proposicao: true },
  })

  return {
    item: itemAtualizado,
    configuracao: {
      totalTurnos: config.totalTurnos,
      tipoQuorum: config.tipoQuorum as TipoQuorum,
      descricao: config.descricao,
    },
  }
}

/**
 * Finaliza turno de votação e registra resultado.
 */
export async function finalizarTurnoItem(
  sessaoId: string,
  itemId: string,
  resultado: 'APROVADO' | 'REJEITADO'
): Promise<{
  item: Record<string, unknown> | null
  resultado: {
    proximoTurno: boolean
    mensagem: string
    prazoIntersticio?: Date
  }
  votos: {
    sim: number
    nao: number
    abstencao: number
    total: number
  }
}> {
  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: true,
      proposicao: true,
    },
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (item.status !== 'EM_VOTACAO') {
    throw new ValidationError('O item deve estar em votação para finalizar o turno')
  }

  if (!item.proposicaoId || !item.proposicao) {
    throw new ValidationError('Item deve ter uma proposição vinculada')
  }

  const turnoAtual = item.turnoAtual || 1
  const tipoProposicao = item.proposicao.tipo

  const contagem = await contabilizarVotos(item.proposicaoId, {
    tipoProposicao,
    sessaoId,
    turno: turnoAtual,
  })

  const resultadoAgrupado: ResultadoVotacaoAgrupada =
    resultado === 'APROVADO' ? 'APROVADA' : 'REJEITADA'

  const resultadoTurno = await registrarResultadoTurno(
    itemId,
    turnoAtual,
    resultadoAgrupado,
    tipoProposicao
  )

  const totalMembros = await prisma.parlamentar.count({ where: { ativo: true } })
  const totalPresentes = await prisma.presencaSessao.count({
    where: { sessaoId, presente: true },
  })

  const config = getConfiguracaoTurno(tipoProposicao)

  await registrarVotacaoAgrupada(
    item.proposicaoId,
    sessaoId,
    turnoAtual,
    {
      sim: contagem.sim,
      nao: contagem.nao,
      abstencao: contagem.abstencao,
      ausente: totalPresentes - contagem.total,
    },
    totalMembros,
    totalPresentes,
    config.tipoQuorum as TipoQuorum,
    item.tipoVotacao as TipoVotacao,
    resultadoAgrupado,
    contagem.votoMinerva || false
  )

  if (!resultadoTurno.proximoTurno) {
    const acumulado = calcularTempoAcumulado(item.iniciadoEm, item.tempoAcumulado)

    // Atomicidade: sincroniza proposicao, pautaItem e pautaSessao na mesma transação
    await prisma.$transaction(async (tx) => {
      await atualizarResultadoProposicao(
        item.proposicaoId!,
        contagem.resultado,
        resultado,
        sessaoId,
        tx
      )

      await tx.pautaItem.update({
        where: { id: itemId },
        data: {
          tempoAcumulado: acumulado,
          tempoReal: acumulado,
          iniciadoEm: null,
        },
      })

      await tx.pautaSessao.update({
        where: { id: item.pautaId },
        data: { itemAtualId: null },
      })
    })

    await atualizarTempoTotalReal(item.pautaId)
  }

  const itemAtualizado = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { proposicao: true },
  })

  return {
    item: itemAtualizado,
    resultado: resultadoTurno,
    votos: {
      sim: contagem.sim,
      nao: contagem.nao,
      abstencao: contagem.abstencao,
      total: contagem.total,
    },
  }
}

/**
 * Verifica se item pode iniciar segundo turno.
 */
export async function verificarIntersticio(
  sessaoId: string,
  itemId: string
): Promise<{
  pode: boolean
  motivo: string
  prazoIntersticio?: Date
  horasRestantes?: number
}> {
  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { pauta: true },
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  const verificacao = await podeIniciarSegundoTurno(itemId)

  const resultado: {
    pode: boolean
    motivo: string
    prazoIntersticio?: Date
    horasRestantes?: number
  } = {
    pode: verificacao.pode,
    motivo: verificacao.motivo,
  }

  if (item.prazoIntersticio) {
    resultado.prazoIntersticio = item.prazoIntersticio
    if (!verificacao.pode && item.prazoIntersticio > new Date()) {
      resultado.horasRestantes = Math.ceil(
        (item.prazoIntersticio.getTime() - Date.now()) / (1000 * 60 * 60)
      )
    }
  }

  return resultado
}

/**
 * Inicia segundo turno de votação após interstício.
 */
export async function iniciarSegundoTurnoItem(
  sessaoId: string,
  itemId: string
): Promise<unknown> {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para iniciar o segundo turno')
  }

  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { pauta: true },
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  const verificacao = await podeIniciarSegundoTurno(itemId)
  if (!verificacao.pode) {
    throw new ValidationError(verificacao.motivo)
  }

  await iniciarSegundoTurnoService(itemId)

  await prisma.pautaSessao.update({
    where: { id: item.pautaId },
    data: { itemAtualId: itemId },
  })

  return prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { proposicao: true },
  })
}

/**
 * Lista todos os itens em interstício aguardando segundo turno.
 */
export async function listarItensAguardandoSegundoTurno(): Promise<
  Array<{
    id: string
    titulo: string
    prazoIntersticio: Date
    podeProsseguir: boolean
  }>
> {
  return listarItensEmIntersticio()
}
