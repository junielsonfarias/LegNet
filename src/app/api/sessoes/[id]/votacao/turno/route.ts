import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  assertSessaoPermiteVotacao,
  obterSessaoParaControle,
  contabilizarVotos,
  resolverSessaoId
} from '@/lib/services/sessao-controle'
import {
  getConfiguracaoTurno,
  registrarResultadoTurno,
  podeIniciarSegundoTurno,
  iniciarSegundoTurno,
  registrarVotacaoAgrupada,
  getHistoricoVotacoesTurnos
} from '@/lib/services/turno-service'
import {
  determinarAplicacaoQuorum,
  calcularResultadoVotacao
} from '@/lib/services/quorum-service'
import {
  getPautaItemComTurno,
  listPautaItensTurno,
  iniciarPrimeiroTurnoItem,
  getTotaisParaVotacao,
  atualizarProposicaoAposVotacaoFinal
} from '@/lib/services/votacao-service'

export const dynamic = 'force-dynamic'

const IniciarTurnoSchema = z.object({
  itemId: z.string(),
  turno: z.number().min(1).max(2)
})

const FinalizarTurnoSchema = z.object({
  itemId: z.string(),
  turno: z.number().min(1).max(2),
  resultado: z.enum(['APROVADA', 'REJEITADA', 'EMPATE', 'SEM_QUORUM', 'ADIADA']).optional()
})

/**
 * GET - Obtém informações do turno atual de um item
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const sessaoId = await resolverSessaoId(id)
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')
  const proposicaoId = searchParams.get('proposicaoId')

  if (itemId) {
    // Buscar informações do turno do item
    const item = await getPautaItemComTurno(itemId)

    if (!item || item.pauta?.sessaoId !== sessaoId) {
      throw new NotFoundError('Item da pauta')
    }

    const config = item.proposicao
      ? getConfiguracaoTurno(item.proposicao.tipo)
      : getConfiguracaoTurno('DEFAULT')

    // Verificar se pode iniciar 2º turno
    let podeSegundoTurno = { pode: false, motivo: '' }
    if (item.intersticio) {
      podeSegundoTurno = await podeIniciarSegundoTurno(itemId)
    }

    return createSuccessResponse({
      itemId: item.id,
      turnoAtual: item.turnoAtual,
      turnoFinal: item.turnoFinal || config.totalTurnos,
      resultadoTurno1: item.resultadoTurno1,
      resultadoTurno2: item.resultadoTurno2,
      dataVotacaoTurno1: item.dataVotacaoTurno1,
      dataVotacaoTurno2: item.dataVotacaoTurno2,
      intersticio: item.intersticio,
      prazoIntersticio: item.prazoIntersticio,
      podeSegundoTurno: podeSegundoTurno.pode,
      motivoSegundoTurno: podeSegundoTurno.motivo,
      configuracao: {
        totalTurnos: config.totalTurnos,
        intersticioDias: config.intersticioDias,
        tipoQuorum: config.tipoQuorum,
        descricao: config.descricao
      }
    }, 'Informações de turno obtidas')
  }

  if (proposicaoId) {
    // Buscar histórico de votações por turno
    const historico = await getHistoricoVotacoesTurnos(proposicaoId)
    return createSuccessResponse(historico, 'Histórico de votações por turno')
  }

  // Listar todos os itens com informações de turno
  const itens = await listPautaItensTurno(sessaoId)

  const itensComTurno = itens.map(item => {
    const config = item.proposicao
      ? getConfiguracaoTurno(item.proposicao.tipo)
      : getConfiguracaoTurno('DEFAULT')

    return {
      itemId: item.id,
      titulo: item.titulo,
      proposicaoId: item.proposicaoId,
      status: item.status,
      turnoAtual: item.turnoAtual,
      turnoFinal: item.turnoFinal || config.totalTurnos,
      resultadoTurno1: item.resultadoTurno1,
      resultadoTurno2: item.resultadoTurno2,
      intersticio: item.intersticio,
      prazoIntersticio: item.prazoIntersticio,
      requerDoisTurnos: config.totalTurnos === 2
    }
  })

  return createSuccessResponse(itensComTurno, 'Itens com informações de turno')
})

/**
 * POST - Iniciar votação de turno específico
 * SEGURANÇA: Requer autenticação e permissão de votação
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const sessaoId = await resolverSessaoId(rawId)
  const body = await request.json()

  const { itemId, turno } = IniciarTurnoSchema.parse(body)

  // Verificar sessão
  const sessao = await obterSessaoParaControle(sessaoId)
  assertSessaoPermiteVotacao(sessao)

  // Buscar item
  const item = await getPautaItemComTurno(itemId)

  if (!item || item.pauta?.sessaoId !== sessaoId) {
    throw new NotFoundError('Item da pauta')
  }

  if (turno === 2) {
    // Verificar se pode iniciar 2º turno
    const verificacao = await podeIniciarSegundoTurno(itemId)
    if (!verificacao.pode) {
      throw new ValidationError(verificacao.motivo)
    }

    await iniciarSegundoTurno(itemId)

    return createSuccessResponse({
      itemId,
      turno: 2,
      status: 'EM_VOTACAO',
      mensagem: 'Votação em 2º turno iniciada'
    }, 'Votação em 2º turno iniciada')
  }

  // Iniciar 1º turno
  const config = item.proposicao
    ? getConfiguracaoTurno(item.proposicao.tipo)
    : getConfiguracaoTurno('DEFAULT')

  await iniciarPrimeiroTurnoItem(itemId, config.totalTurnos)

  return createSuccessResponse({
    itemId,
    turno: 1,
    turnoFinal: config.totalTurnos,
    status: 'EM_VOTACAO',
    mensagem: config.totalTurnos === 2
      ? `Votação em 1º turno iniciada. Esta matéria requer 2 turnos com interstício de ${config.intersticioDias} dia(s).`
      : 'Votação iniciada (turno único).'
  }, 'Votação iniciada')
}, { permissions: 'votacao.manage' })

/**
 * PUT - Finalizar turno e registrar resultado
 * SEGURANÇA: Requer autenticação e permissão de votação
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const sessaoId = await resolverSessaoId(rawId)
  const body = await request.json()

  const { itemId, turno, resultado: resultadoManual } = FinalizarTurnoSchema.parse(body)

  // Verificar sessão
  const sessao = await obterSessaoParaControle(sessaoId)

  // Buscar item
  const item = await getPautaItemComTurno(itemId)

  if (!item || item.pauta?.sessaoId !== sessaoId) {
    throw new NotFoundError('Item da pauta')
  }

  if (item.status !== 'EM_VOTACAO') {
    throw new ValidationError('Item não está em votação')
  }

  if (!item.proposicaoId || !item.proposicao) {
    throw new ValidationError('Item não possui proposição vinculada para votação')
  }

  // Contabilizar votos
  const contagemVotos = await contabilizarVotos(item.proposicaoId, {
    tipoProposicao: item.proposicao.tipo,
    sessaoId
  })

  // Determinar tipo de quórum baseado no tipo de proposição
  const aplicacaoQuorum = determinarAplicacaoQuorum(item.proposicao.tipo)

  // Buscar totais
  const { totalMembros, totalPresentes } = await getTotaisParaVotacao(sessaoId, sessao.legislaturaId)

  // Calcular resultado com quórum
  const resultadoQuorum = await calcularResultadoVotacao(
    aplicacaoQuorum,
    {
      sim: contagemVotos.sim,
      nao: contagemVotos.nao,
      abstencao: contagemVotos.abstencao
    },
    totalMembros,
    totalPresentes
  )

  // Determinar resultado final
  const resultadoFinal = resultadoManual || (
    resultadoQuorum.aprovado ? 'APROVADA' :
    contagemVotos.resultado === 'EMPATE' ? 'EMPATE' : 'REJEITADA'
  )

  // Registrar votação agrupada
  await registrarVotacaoAgrupada(
    item.proposicaoId,
    sessaoId,
    turno,
    {
      sim: contagemVotos.sim,
      nao: contagemVotos.nao,
      abstencao: contagemVotos.abstencao,
      ausente: totalPresentes - contagemVotos.total
    },
    totalMembros,
    totalPresentes,
    resultadoQuorum.quorum.votosNecessarios > Math.floor(totalPresentes / 2) + 1
      ? 'MAIORIA_ABSOLUTA'
      : 'MAIORIA_SIMPLES',
    item.tipoVotacao,
    resultadoFinal as any
  )

  // Registrar resultado do turno
  const resultadoTurno = await registrarResultadoTurno(
    itemId,
    turno,
    resultadoFinal as any,
    item.proposicao.tipo
  )

  // Se foi resultado final (não há próximo turno), atualizar proposição
  if (!resultadoTurno.proximoTurno && item.proposicaoId) {
    const statusProposicao = resultadoFinal === 'APROVADA' ? 'APROVADA' : 'REJEITADA'

    await atualizarProposicaoAposVotacaoFinal(
      item.proposicaoId,
      contagemVotos.resultado,
      sessaoId,
      statusProposicao
    )
  }

  return createSuccessResponse({
    itemId,
    turno,
    resultado: resultadoFinal,
    votos: {
      sim: contagemVotos.sim,
      nao: contagemVotos.nao,
      abstencao: contagemVotos.abstencao,
      total: contagemVotos.total
    },
    quorum: {
      necessario: resultadoQuorum.quorum.votosNecessarios,
      totalMembros,
      totalPresentes,
      atingido: resultadoQuorum.aprovado
    },
    proximoTurno: resultadoTurno.proximoTurno,
    prazoIntersticio: resultadoTurno.prazoIntersticio,
    mensagem: resultadoTurno.mensagem,
    detalhesQuorum: resultadoQuorum.detalhes
  }, `Turno ${turno} finalizado`)
}, { permissions: 'votacao.manage' })
