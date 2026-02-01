import { prisma } from '@/lib/prisma'
import { NotFoundError, ValidationError } from '@/lib/error-handler'
import {
  calcularResultadoVotacao as calcularResultadoComQuorum,
  determinarAplicacaoQuorum,
  type AplicacaoQuorum
} from '@/lib/services/quorum-service'
import {
  getConfiguracaoTurno,
  requerDoisTurnos,
  inicializarTurnoPautaItem,
  registrarResultadoTurno,
  podeIniciarSegundoTurno,
  iniciarSegundoTurno as iniciarSegundoTurnoService,
  registrarVotacaoAgrupada,
  listarItensEmIntersticio
} from '@/lib/services/turno-service'
import type { ResultadoVotacaoAgrupada, TipoQuorum, TipoVotacao, StatusProposicao } from '@prisma/client'

type SessaoBasica = Awaited<ReturnType<typeof prisma.sessao.findUnique>>

/**
 * Mapeamento de PautaItemStatus para StatusProposicao
 * GAP #2: Sincronização entre status do item da pauta e status da proposição
 */
const MAPEAMENTO_STATUS_PAUTA_PROPOSICAO: Record<string, StatusProposicao | null> = {
  'PENDENTE': 'EM_PAUTA',
  'EM_DISCUSSAO': 'EM_DISCUSSAO',
  'EM_VOTACAO': 'EM_VOTACAO',
  'APROVADO': 'APROVADA',
  'REJEITADO': 'REJEITADA',
  'ADIADO': 'EM_PAUTA',       // Adiado volta para EM_PAUTA
  'RETIRADO': 'ARQUIVADA',    // Retirado = arquivada
  'VISTA': null,               // Vista mantém status atual
  'CONCLUIDO': null            // Concluído mantém status atual (usado para itens sem proposição)
}

/**
 * Sincroniza o status da proposição com o status do item da pauta
 * Chamada quando há mudança de status no item
 *
 * @param proposicaoId - ID da proposição
 * @param pautaItemStatus - Status do item da pauta
 * @param sessaoId - ID da sessão (opcional, para vincular sessaoVotacaoId)
 */
export async function sincronizarStatusProposicao(
  proposicaoId: string,
  pautaItemStatus: string,
  sessaoId?: string
): Promise<void> {
  const novoStatus = MAPEAMENTO_STATUS_PAUTA_PROPOSICAO[pautaItemStatus]

  // Se o mapeamento retornar null, não atualiza (mantém status atual)
  if (!novoStatus) {
    return
  }

  const data: { status: StatusProposicao; sessaoVotacaoId?: string } = {
    status: novoStatus
  }

  // Se tiver sessaoId e for status final, vincula a sessão
  if (sessaoId && ['APROVADA', 'REJEITADA', 'ARQUIVADA'].includes(novoStatus)) {
    data.sessaoVotacaoId = sessaoId
  }

  await prisma.proposicao.update({
    where: { id: proposicaoId },
    data
  })
}

const calcularTempoAcumulado = (iniciadoEm: Date | null, acumulado: number) => {
  if (!iniciadoEm) {
    return acumulado
  }
  const diff = Math.floor((Date.now() - iniciadoEm.getTime()) / 1000)
  return acumulado + (diff > 0 ? diff : 0)
}

const atualizarTempoTotalReal = async (pautaId: string) => {
  const itens = await prisma.pautaItem.findMany({
    where: { pautaId },
    select: { tempoReal: true, tempoAcumulado: true }
  })
  const total = itens.reduce((acc, item) => acc + (item.tempoReal ?? item.tempoAcumulado ?? 0), 0)
  await prisma.pautaSessao.update({
    where: { id: pautaId },
    data: { tempoTotalReal: total }
  })
}

/**
 * Resolve o ID da sessão, aceitando CUID ou slug no formato "sessao-{numero}-{ano}"
 */
export async function resolverSessaoId(sessaoIdOrSlug: string): Promise<string> {
  // Primeiro tenta buscar diretamente pelo ID
  const sessaoPorId = await prisma.sessao.findUnique({
    where: { id: sessaoIdOrSlug },
    select: { id: true }
  })

  if (sessaoPorId) {
    return sessaoPorId.id
  }

  // Tenta extrair número e ano do slug (formato: sessao-{numero}-{ano})
  const slugMatch = sessaoIdOrSlug.match(/^sessao-(\d+)-(\d{4})$/)

  if (slugMatch) {
    const numero = parseInt(slugMatch[1], 10)
    const ano = parseInt(slugMatch[2], 10)

    const sessaoPorSlug = await prisma.sessao.findFirst({
      where: {
        numero,
        data: {
          gte: new Date(`${ano}-01-01`),
          lt: new Date(`${ano + 1}-01-01`)
        }
      },
      select: { id: true }
    })

    if (sessaoPorSlug) {
      return sessaoPorSlug.id
    }
  }

  throw new NotFoundError('Sessão')
}

export async function obterSessaoParaControle(sessaoIdOrSlug: string) {
  const sessaoId = await resolverSessaoId(sessaoIdOrSlug)
  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  return sessao
}

export function assertSessaoPermitePresenca(sessao: { status: string; finalizada?: boolean }) {
  // Permite registro de presenças em sessões:
  // - AGENDADA: preparação
  // - EM_ANDAMENTO: durante a sessão
  // - CONCLUIDA: lançamento de dados pretéritos (sessões antigas)
  // Apenas CANCELADA não permite alterações
  if (sessao.status === 'CANCELADA') {
    throw new ValidationError('Não é possível alterar presenças em sessões canceladas')
  }
}

export function assertSessaoPermiteVotacao(sessao: { status: string; finalizada?: boolean }) {
  // Permite registro de votos em sessões:
  // - EM_ANDAMENTO: durante a sessão ao vivo
  // - CONCLUIDA: lançamento de dados pretéritos (sessões antigas)
  // AGENDADA e CANCELADA não permitem votação
  if (sessao.status === 'AGENDADA') {
    throw new ValidationError('Não é possível registrar votos em sessões que ainda não iniciaram')
  }
  if (sessao.status === 'CANCELADA') {
    throw new ValidationError('Não é possível registrar votos em sessões canceladas')
  }
}

export async function ensureParlamentarPresente(sessaoId: string, parlamentarId: string) {
  const presenca = await prisma.presencaSessao.findUnique({
    where: {
      sessaoId_parlamentarId: {
        sessaoId,
        parlamentarId
      }
    }
  })

  if (!presenca || !presenca.presente) {
    throw new ValidationError('Parlamentar deve estar presente na sessão para votar')
  }

  return presenca
}

export async function iniciarSessaoControle(sessaoId: string) {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status === 'CONCLUIDA' || sessao.finalizada) {
    throw new ValidationError('Sessão já finalizada não pode ser iniciada')
  }

  if (sessao.status === 'CANCELADA') {
    throw new ValidationError('Sessão cancelada não pode ser iniciada')
  }

  if (sessao.status === 'EM_ANDAMENTO') {
    return sessao
  }

  const agora = new Date()

  const pauta = await prisma.pautaSessao.findUnique({
    where: { sessaoId },
    include: {
      itens: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  // GAP CRÍTICO #1: Validar que existe pauta vinculada
  if (!pauta) {
    throw new ValidationError('Sessão não possui pauta vinculada. Crie uma pauta antes de iniciar a sessão.')
  }

  // GAP CRÍTICO #1: Validar que a pauta não está vazia
  if (pauta.itens.length === 0) {
    throw new ValidationError('Pauta da sessão está vazia. Adicione pelo menos um item antes de iniciar.')
  }

  // RN-125: Validar que a pauta foi publicada (status APROVADA)
  // Pautas devem ser publicadas com 48h de antecedência para garantir transparência
  if (pauta.status !== 'APROVADA' && pauta.status !== 'EM_ANDAMENTO') {
    throw new ValidationError(
      'RN-125: A pauta deve ser publicada antes de iniciar a sessão. ' +
      `Status atual: "${pauta.status}". ` +
      'Acesse a pauta e clique em "Publicar" para disponibilizá-la ao público.'
    )
  }

  const proximoItem = pauta.itens.find(item => item.status === 'PENDENTE' || item.status === 'ADIADO')

  await prisma.$transaction([
    prisma.sessao.update({
      where: { id: sessaoId },
      data: {
        status: 'EM_ANDAMENTO',
        data: sessao.data ?? agora,
        tempoInicio: agora // Salva o momento exato em que a sessão foi iniciada
      }
    }),
    prisma.pautaSessao.update({
      where: { id: pauta.id },
      data: {
        itemAtualId: proximoItem?.id ?? null,
        status: 'EM_ANDAMENTO'
      }
    })
  ])

  return prisma.sessao.findUnique({ where: { id: sessaoId } })
}

export async function finalizarSessaoControle(sessaoId: string) {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status === 'CANCELADA') {
    throw new ValidationError('Sessão cancelada não pode ser finalizada')
  }

  const pauta = await prisma.pautaSessao.findUnique({
    where: { sessaoId },
    include: {
      itens: true
    }
  })

  if (!pauta) {
    throw new ValidationError('Sessão sem pauta vinculada')
  }

  // Identificar itens que ainda estão em andamento
  const itensEmAndamento = pauta.itens.filter(item =>
    ['EM_DISCUSSAO', 'EM_VOTACAO', 'PENDENTE'].includes(item.status)
  )

  // Finalizar itens em andamento como ADIADO e itens pendentes mantêm PENDENTE
  const atualizacoesItens = itensEmAndamento.map(item => {
    const acumulado = calcularTempoAcumulado(item.iniciadoEm, item.tempoAcumulado)
    const novoStatus = item.status === 'PENDENTE' ? 'PENDENTE' : 'ADIADO'

    return prisma.pautaItem.update({
      where: { id: item.id },
      data: {
        status: novoStatus,
        tempoAcumulado: acumulado,
        tempoReal: item.status !== 'PENDENTE' ? acumulado : null,
        iniciadoEm: null,
        finalizadoEm: item.status !== 'PENDENTE' ? new Date() : null
      }
    })
  })

  // Calcular tempo total real
  const todosItens = pauta.itens
  const tempoTotal = todosItens.reduce((acc, item) => {
    const tempo = item.tempoReal ?? item.tempoAcumulado ?? 0
    return acc + tempo
  }, 0)

  // Executar todas as atualizações em transação
  await prisma.$transaction([
    // Finalizar itens em andamento
    ...atualizacoesItens,
    // Atualizar sessão
    prisma.sessao.update({
      where: { id: sessaoId },
      data: {
        status: 'CONCLUIDA',
        finalizada: true
      }
    }),
    // Atualizar pauta com status CONCLUIDA e tempo total
    prisma.pautaSessao.update({
      where: { id: pauta.id },
      data: {
        itemAtualId: null,
        status: 'CONCLUIDA',
        tempoTotalReal: tempoTotal
      }
    })
  ])

  return prisma.sessao.findUnique({ where: { id: sessaoId } })
}

const obterItemPauta = async (sessaoId: string, itemId: string) => {
  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: true
    }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  return item
}

export async function iniciarItemPauta(sessaoId: string, itemId: string) {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para iniciar um item')
  }

  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: true,
      proposicao: true
    }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (!['PENDENTE', 'ADIADO', 'EM_DISCUSSAO'].includes(item.status)) {
    throw new ValidationError('Item não pode ser iniciado no estado atual')
  }

  const agora = new Date()

  // Iniciar transação com atualização do item e pauta
  const updates: any[] = [
    prisma.pautaItem.update({
      where: { id: itemId },
      data: {
        status: 'EM_DISCUSSAO',
        iniciadoEm: agora,
        updatedAt: agora
      }
    }),
    prisma.pautaSessao.update({
      where: { id: item.pautaId },
      data: {
        itemAtualId: itemId
      }
    })
  ]

  // GAP CRÍTICO #5: Sincronizar status da proposição para EM_DISCUSSAO
  if (item.proposicaoId && item.proposicao) {
    // Apenas atualiza se a proposição está em status anterior
    const statusAtualizaveis = ['EM_PAUTA', 'AGUARDANDO_PAUTA', 'EM_TRAMITACAO']
    if (statusAtualizaveis.includes(item.proposicao.status)) {
      updates.push(
        prisma.proposicao.update({
          where: { id: item.proposicaoId },
          data: { status: 'EM_DISCUSSAO' }
        })
      )
    }
  }

  await prisma.$transaction(updates)

  return prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { proposicao: true }
  })
}

export async function pausarItemPauta(sessaoId: string, itemId: string) {
  const item = await obterItemPauta(sessaoId, itemId)

  if (!item.iniciadoEm) {
    throw new ValidationError('Item ainda não foi iniciado')
  }

  const acumulado = calcularTempoAcumulado(item.iniciadoEm, item.tempoAcumulado)

  await prisma.pautaItem.update({
    where: { id: itemId },
    data: {
      tempoAcumulado: acumulado,
      iniciadoEm: null
    }
  })

  await atualizarTempoTotalReal(item.pautaId)

  return prisma.pautaItem.findUnique({ where: { id: itemId } })
}

export async function retomarItemPauta(sessaoId: string, itemId: string) {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para retomar um item')
  }

  const item = await obterItemPauta(sessaoId, itemId)

  if (item.iniciadoEm) {
    return item
  }

  const agora = new Date()

  await prisma.$transaction([
    prisma.pautaItem.update({
      where: { id: itemId },
      data: {
        iniciadoEm: agora,
        status: item.status === 'EM_VOTACAO' ? 'EM_VOTACAO' : 'EM_DISCUSSAO'
      }
    }),
    prisma.pautaSessao.update({
      where: { id: item.pautaId },
      data: {
        itemAtualId: itemId
      }
    })
  ])

  return prisma.pautaItem.findUnique({ where: { id: itemId } })
}

export async function iniciarVotacaoItem(sessaoId: string, itemId: string) {
  const sessao = await obterSessaoParaControle(sessaoId)
  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para iniciar a votação de um item')
  }

  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: true,
      proposicao: true
    }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (!item.iniciadoEm) {
    throw new ValidationError('O item precisa estar em discussão antes de iniciar a votação')
  }

  // GAP CRÍTICO #3: Validar quorum antes de abrir votação (RN-060)
  const { verificarQuorumInstalacao } = await import('@/lib/services/quorum-service')
  const quorumResult = await verificarQuorumInstalacao(sessaoId)

  if (!quorumResult.temQuorum) {
    throw new ValidationError(
      `Quorum insuficiente para votação. ${quorumResult.detalhes}. ` +
      'Aguarde mais parlamentares ou registre presenças.'
    )
  }

  // Atualizar status do item para EM_VOTACAO
  await prisma.pautaItem.update({
    where: { id: itemId },
    data: {
      status: 'EM_VOTACAO'
    }
  })

  // GAP CRÍTICO #5: Sincronizar status da proposição
  if (item.proposicaoId) {
    await prisma.proposicao.update({
      where: { id: item.proposicaoId },
      data: { status: 'EM_VOTACAO' }
    })
  }

  return prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { proposicao: true }
  })
}

/**
 * Contabiliza os votos de uma proposição e retorna o resultado
 * Exportado para uso em APIs e outros serviços
 *
 * @param proposicaoId - ID da proposição
 * @param options - Opções adicionais para cálculo de quórum configurável
 */
export async function contabilizarVotos(
  proposicaoId: string,
  options?: {
    tipoProposicao?: string
    regimeUrgencia?: boolean
    isDerrubadaVeto?: boolean
    sessaoId?: string
  }
): Promise<{
  sim: number
  nao: number
  abstencao: number
  total: number
  resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  detalhesQuorum?: string
}> {
  const votos = await prisma.votacao.groupBy({
    by: ['voto'],
    where: { proposicaoId },
    _count: true
  })

  const contagem = {
    sim: 0,
    nao: 0,
    abstencao: 0
  }

  for (const v of votos) {
    if (v.voto === 'SIM') contagem.sim = v._count
    else if (v.voto === 'NAO') contagem.nao = v._count
    else if (v.voto === 'ABSTENCAO') contagem.abstencao = v._count
  }

  const total = contagem.sim + contagem.nao + contagem.abstencao

  // Se tiver tipo de proposição, usar quórum configurável
  if (options?.tipoProposicao) {
    try {
      // Buscar total de membros e presentes
      let totalMembros = 9 // Valor padrão
      let totalPresentes = total

      if (options.sessaoId) {
        const sessao = await prisma.sessao.findUnique({
          where: { id: options.sessaoId },
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

        totalMembros = await prisma.parlamentar.count({ where: whereClause })

        totalPresentes = await prisma.presencaSessao.count({
          where: {
            sessaoId: options.sessaoId,
            presente: true
          }
        })
      }

      const aplicacao = determinarAplicacaoQuorum(
        options.tipoProposicao,
        options.regimeUrgencia || false,
        options.isDerrubadaVeto || false,
        false
      )

      const resultadoQuorum = await calcularResultadoComQuorum(
        aplicacao,
        contagem,
        totalMembros,
        totalPresentes
      )

      return {
        ...contagem,
        total,
        resultado: resultadoQuorum.aprovado ? 'APROVADA' : 'REJEITADA',
        detalhesQuorum: resultadoQuorum.detalhes
      }
    } catch (error) {
      console.error('Erro ao calcular quórum configurável, usando regra padrão:', error)
    }
  }

  // Regra padrão: SIM > NAO para aprovação (abstenções não contam contra)
  let resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  if (contagem.sim > contagem.nao) {
    resultado = 'APROVADA'
  } else if (contagem.nao > contagem.sim) {
    resultado = 'REJEITADA'
  } else {
    resultado = 'EMPATE'
  }

  return {
    ...contagem,
    total,
    resultado
  }
}

/**
 * Atualiza a proposição com o resultado da votação
 */
async function atualizarResultadoProposicao(
  proposicaoId: string,
  resultadoVotacao: 'APROVADA' | 'REJEITADA' | 'EMPATE',
  statusItem: 'APROVADO' | 'REJEITADO',
  sessaoVotacaoId?: string
) {
  // Mapear status do item para status da proposição
  const statusProposicao = statusItem === 'APROVADO' ? 'APROVADA' : 'REJEITADA'

  await prisma.proposicao.update({
    where: { id: proposicaoId },
    data: {
      resultado: resultadoVotacao,
      dataVotacao: new Date(),
      status: statusProposicao,
      // Registra a sessão onde a proposição foi votada
      ...(sessaoVotacaoId && { sessaoVotacaoId })
    }
  })
}

/**
 * Registra pedido de vista em um item da pauta
 * @param sessaoId - ID da sessão
 * @param itemId - ID do item da pauta
 * @param parlamentarId - ID do parlamentar que pede vista
 * @param prazoDias - Prazo em dias para devolução (padrão: 2 dias úteis)
 */
export async function pedirVistaItem(
  sessaoId: string,
  itemId: string,
  parlamentarId: string,
  prazoDias: number = 2
) {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para pedir vista')
  }

  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: true
    }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (!['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status)) {
    throw new ValidationError('Só é possível pedir vista de item em discussão ou votação')
  }

  // Calcular prazo (dias úteis)
  const prazo = new Date()
  let diasAdicionados = 0
  while (diasAdicionados < prazoDias) {
    prazo.setDate(prazo.getDate() + 1)
    // Pular sábado (6) e domingo (0)
    if (prazo.getDay() !== 0 && prazo.getDay() !== 6) {
      diasAdicionados++
    }
  }

  // Buscar nome do parlamentar para log
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: parlamentarId },
    select: { nome: true, apelido: true }
  })

  if (!parlamentar) {
    throw new ValidationError('Parlamentar não encontrado')
  }

  const acumulado = calcularTempoAcumulado(item.iniciadoEm ?? null, item.tempoAcumulado)

  await prisma.$transaction([
    prisma.pautaItem.update({
      where: { id: itemId },
      data: {
        status: 'VISTA',
        tempoAcumulado: acumulado,
        iniciadoEm: null,
        vistaRequestedBy: parlamentarId,
        vistaRequestedAt: new Date(),
        vistaPrazo: prazo,
        observacoes: item.observacoes
          ? `${item.observacoes}\n\nPedido de vista por ${parlamentar.apelido || parlamentar.nome} em ${new Date().toLocaleString('pt-BR')}. Prazo: ${prazo.toLocaleDateString('pt-BR')}`
          : `Pedido de vista por ${parlamentar.apelido || parlamentar.nome} em ${new Date().toLocaleString('pt-BR')}. Prazo: ${prazo.toLocaleDateString('pt-BR')}`
      }
    }),
    prisma.pautaSessao.update({
      where: { id: item.pautaId },
      data: {
        itemAtualId: null
      }
    })
  ])

  console.log(`[Vista] Item ${item.titulo} - Vista pedida por ${parlamentar.apelido || parlamentar.nome}. Prazo: ${prazo.toLocaleDateString('pt-BR')}`)

  return prisma.pautaItem.findUnique({ where: { id: itemId } })
}

/**
 * Retoma um item que estava com pedido de vista
 */
export async function retomarItemVista(sessaoId: string, itemId: string) {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para retomar item')
  }

  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: true
    }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (item.status !== 'VISTA') {
    throw new ValidationError('Só é possível retomar item que está com pedido de vista')
  }

  const agora = new Date()

  await prisma.$transaction([
    prisma.pautaItem.update({
      where: { id: itemId },
      data: {
        status: 'EM_DISCUSSAO',
        iniciadoEm: agora,
        observacoes: item.observacoes
          ? `${item.observacoes}\n\nVista devolvida em ${agora.toLocaleString('pt-BR')}`
          : `Vista devolvida em ${agora.toLocaleString('pt-BR')}`
      }
    }),
    prisma.pautaSessao.update({
      where: { id: item.pautaId },
      data: {
        itemAtualId: itemId
      }
    })
  ])

  return prisma.pautaItem.findUnique({ where: { id: itemId } })
}

/**
 * Reordena itens da pauta
 * @param sessaoId - ID da sessão
 * @param itemId - ID do item a mover
 * @param direcao - 'subir' ou 'descer'
 */
export async function reordenarItemPauta(
  sessaoId: string,
  itemId: string,
  direcao: 'subir' | 'descer'
) {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status !== 'EM_ANDAMENTO' && sessao.status !== 'AGENDADA') {
    throw new ValidationError('Só é possível reordenar itens de sessão agendada ou em andamento')
  }

  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: {
        include: {
          itens: {
            where: { secao: undefined }, // Será definido abaixo
            orderBy: { ordem: 'asc' }
          }
        }
      }
    }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (item.status !== 'PENDENTE') {
    throw new ValidationError('Só é possível reordenar itens pendentes')
  }

  // Buscar todos os itens da mesma seção
  const itensSecao = await prisma.pautaItem.findMany({
    where: {
      pautaId: item.pautaId,
      secao: item.secao
    },
    orderBy: { ordem: 'asc' }
  })

  const indexAtual = itensSecao.findIndex(i => i.id === itemId)
  const indexAlvo = direcao === 'subir' ? indexAtual - 1 : indexAtual + 1

  if (indexAlvo < 0 || indexAlvo >= itensSecao.length) {
    throw new ValidationError(`Não é possível ${direcao} mais o item`)
  }

  const itemTroca = itensSecao[indexAlvo]

  // Trocar ordens
  await prisma.$transaction([
    prisma.pautaItem.update({
      where: { id: itemId },
      data: { ordem: itemTroca.ordem }
    }),
    prisma.pautaItem.update({
      where: { id: itemTroca.id },
      data: { ordem: item.ordem }
    })
  ])

  return prisma.pautaItem.findMany({
    where: { pautaId: item.pautaId },
    orderBy: [{ secao: 'asc' }, { ordem: 'asc' }]
  })
}

export async function finalizarItemPauta(
  sessaoId: string,
  itemId: string,
  resultado: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO' = 'CONCLUIDO',
  observacoes?: string  // Motivo da retirada ou outras observações
) {
  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      pauta: true,
      proposicao: true
    }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (item.status === 'CONCLUIDO') {
    return item
  }

  const acumulado = calcularTempoAcumulado(item.iniciadoEm ?? null, item.tempoAcumulado)
  const eraVotacao = item.status === 'EM_VOTACAO'
  const temProposicao = !!item.proposicaoId && !!item.proposicao

  // Se o item estava em votação e tem proposição vinculada, contabilizar votos
  let resultadoCalculado = resultado
  let contagemVotos: Awaited<ReturnType<typeof contabilizarVotos>> | null = null

  if (eraVotacao && temProposicao && (resultado === 'APROVADO' || resultado === 'REJEITADO')) {
    // Usar quórum configurável passando o tipo de proposição
    contagemVotos = await contabilizarVotos(item.proposicaoId!, {
      tipoProposicao: item.proposicao!.tipo,
      sessaoId
    })

    // Se o operador escolheu APROVADO/REJEITADO, usar a escolha dele
    // O resultado calculado e detalhes de quórum são armazenados na proposição
  }

  // Atualizar o item da pauta
  const atualizado = await prisma.pautaItem.update({
    where: { id: itemId },
    data: {
      status: resultadoCalculado,
      tempoAcumulado: acumulado,
      tempoReal: acumulado,
      iniciadoEm: null,
      finalizadoEm: new Date(),
      ...(observacoes && { observacoes }) // Registrar observações (motivo de retirada, etc.)
    }
  })

  // Se teve votação com proposição, atualizar a proposição com o resultado
  if (eraVotacao && temProposicao && contagemVotos && (resultado === 'APROVADO' || resultado === 'REJEITADO')) {
    await atualizarResultadoProposicao(
      item.proposicaoId!,
      contagemVotos.resultado,
      resultado,
      sessaoId  // Registra a sessão onde a proposição foi votada
    )
  }

  // GAP #2: Sincronizar status da proposição para casos sem votação efetiva
  if (temProposicao && !eraVotacao) {
    await sincronizarStatusProposicao(
      item.proposicaoId!,
      resultado,
      sessaoId
    )
  }

  // Registrar leitura da proposição quando item de LEITURA é finalizado com sucesso
  // Atualiza sessaoId (sessão onde foi lida) e dataLeitura (timestamp da leitura)
  if (temProposicao && item.tipoAcao === 'LEITURA' && resultado === 'CONCLUIDO') {
    await prisma.proposicao.update({
      where: { id: item.proposicaoId! },
      data: {
        sessaoId: sessaoId,       // Registra a sessão onde foi lida
        dataLeitura: new Date()   // Registra data/hora da leitura
      }
    })
  }

  await prisma.pautaSessao.update({
    where: { id: item.pautaId },
    data: {
      itemAtualId: null
    }
  })

  await atualizarTempoTotalReal(item.pautaId)

  return atualizado
}

// ==================== FUNÇÕES DE CONTROLE DE TURNOS ====================

/**
 * Inicializa turno de votação para um item da pauta
 * Configura os campos de turno baseado no tipo da proposição
 */
export async function iniciarTurnoItem(
  sessaoId: string,
  itemId: string
): Promise<{
  item: any
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
      proposicao: true
    }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  if (!item.proposicaoId || !item.proposicao) {
    throw new ValidationError('Item deve ter uma proposição vinculada para votação por turnos')
  }

  // Obter configuração de turnos baseada no tipo da proposição
  const tipoProposicao = item.proposicao.tipo
  const config = getConfiguracaoTurno(tipoProposicao)

  // Inicializar campos de turno
  await inicializarTurnoPautaItem(itemId, tipoProposicao)

  // Iniciar o item (muda status para EM_DISCUSSAO)
  await prisma.$transaction([
    prisma.pautaItem.update({
      where: { id: itemId },
      data: {
        status: 'EM_DISCUSSAO',
        iniciadoEm: new Date()
      }
    }),
    prisma.pautaSessao.update({
      where: { id: item.pautaId },
      data: {
        itemAtualId: itemId
      }
    })
  ])

  const itemAtualizado = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { proposicao: true }
  })

  return {
    item: itemAtualizado,
    configuracao: {
      totalTurnos: config.totalTurnos,
      tipoQuorum: config.tipoQuorum as TipoQuorum,
      descricao: config.descricao
    }
  }
}

/**
 * Finaliza turno de votação e registra resultado
 */
export async function finalizarTurnoItem(
  sessaoId: string,
  itemId: string,
  resultado: 'APROVADO' | 'REJEITADO'
): Promise<{
  item: any
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
      proposicao: true
    }
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

  // Contabilizar votos
  const contagem = await contabilizarVotos(item.proposicaoId, {
    tipoProposicao,
    sessaoId
  })

  // Mapear resultado para o enum
  const resultadoAgrupado: ResultadoVotacaoAgrupada = resultado === 'APROVADO' ? 'APROVADA' : 'REJEITADA'

  // Registrar resultado do turno
  const resultadoTurno = await registrarResultadoTurno(
    itemId,
    turnoAtual,
    resultadoAgrupado,
    tipoProposicao
  )

  // Obter totais para votação agrupada
  const totalMembros = await prisma.parlamentar.count({ where: { ativo: true } })
  const totalPresentes = await prisma.presencaSessao.count({
    where: { sessaoId, presente: true }
  })

  const config = getConfiguracaoTurno(tipoProposicao)

  // Registrar votação agrupada
  await registrarVotacaoAgrupada(
    item.proposicaoId,
    sessaoId,
    turnoAtual,
    {
      sim: contagem.sim,
      nao: contagem.nao,
      abstencao: contagem.abstencao,
      ausente: totalPresentes - contagem.total
    },
    totalMembros,
    totalPresentes,
    config.tipoQuorum as TipoQuorum,
    item.tipoVotacao as TipoVotacao,
    resultadoAgrupado
  )

  // Se não há próximo turno, atualizar a proposição
  if (!resultadoTurno.proximoTurno) {
    await atualizarResultadoProposicao(
      item.proposicaoId,
      contagem.resultado,
      resultado,
      sessaoId
    )

    // Atualizar tempo e limpar item atual
    const acumulado = calcularTempoAcumulado(item.iniciadoEm, item.tempoAcumulado)
    await prisma.pautaItem.update({
      where: { id: itemId },
      data: {
        tempoAcumulado: acumulado,
        tempoReal: acumulado,
        iniciadoEm: null
      }
    })

    await prisma.pautaSessao.update({
      where: { id: item.pautaId },
      data: { itemAtualId: null }
    })

    await atualizarTempoTotalReal(item.pautaId)
  }

  const itemAtualizado = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { proposicao: true }
  })

  return {
    item: itemAtualizado,
    resultado: resultadoTurno,
    votos: {
      sim: contagem.sim,
      nao: contagem.nao,
      abstencao: contagem.abstencao,
      total: contagem.total
    }
  }
}

/**
 * Verifica se item pode iniciar segundo turno
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
    include: { pauta: true }
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
    motivo: verificacao.motivo
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
 * Inicia segundo turno de votação após interstício
 */
export async function iniciarSegundoTurnoItem(
  sessaoId: string,
  itemId: string
): Promise<any> {
  const sessao = await obterSessaoParaControle(sessaoId)

  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para iniciar o segundo turno')
  }

  const item = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { pauta: true }
  })

  if (!item || !item.pauta || item.pauta.sessaoId !== sessaoId) {
    throw new ValidationError('Item inválido para a sessão informada')
  }

  // Verificar se pode iniciar segundo turno
  const verificacao = await podeIniciarSegundoTurno(itemId)
  if (!verificacao.pode) {
    throw new ValidationError(verificacao.motivo)
  }

  // Iniciar segundo turno
  await iniciarSegundoTurnoService(itemId)

  // Atualizar item atual da pauta
  await prisma.pautaSessao.update({
    where: { id: item.pautaId },
    data: { itemAtualId: itemId }
  })

  return prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: { proposicao: true }
  })
}

/**
 * Lista todos os itens em interstício aguardando segundo turno
 */
export async function listarItensAguardandoSegundoTurno(): Promise<Array<{
  id: string
  titulo: string
  prazoIntersticio: Date
  podeProsseguir: boolean
}>> {
  return listarItensEmIntersticio()
}

