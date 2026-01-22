import { prisma } from '@/lib/prisma'
import { NotFoundError, ValidationError } from '@/lib/error-handler'
import {
  calcularResultadoVotacao as calcularResultadoComQuorum,
  determinarAplicacaoQuorum,
  type AplicacaoQuorum
} from '@/lib/services/quorum-service'

type SessaoBasica = Awaited<ReturnType<typeof prisma.sessao.findUnique>>

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

export async function obterSessaoParaControle(sessaoId: string) {
  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  return sessao
}

export function assertSessaoPermitePresenca(sessao: { status: string }) {
  if (sessao.status === 'CONCLUIDA' || sessao.status === 'CANCELADA') {
    throw new ValidationError('Não é possível alterar presenças para sessões finalizadas ou canceladas')
  }
}

export function assertSessaoPermiteVotacao(sessao: { status: string }) {
  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para registrar votos')
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

  if (!pauta) {
    throw new ValidationError('Não foi possível localizar a pauta da sessão')
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
        itemAtualId: proximoItem?.id ?? null
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

  const pauta = await prisma.pautaSessao.findUnique({ where: { sessaoId } })

  if (!pauta) {
    throw new ValidationError('Sessão sem pauta vinculada')
  }

  await prisma.$transaction([
    prisma.sessao.update({
      where: { id: sessaoId },
      data: {
        status: 'CONCLUIDA',
        finalizada: true
      }
    }),
    prisma.pautaSessao.update({
      where: { id: pauta.id },
      data: {
        itemAtualId: null
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

  const item = await obterItemPauta(sessaoId, itemId)

  if (!['PENDENTE', 'ADIADO', 'EM_DISCUSSAO'].includes(item.status)) {
    throw new ValidationError('Item não pode ser iniciado no estado atual')
  }

  const agora = new Date()

  await prisma.$transaction([
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
  ])

  return prisma.pautaItem.findUnique({ where: { id: itemId } })
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

  const item = await obterItemPauta(sessaoId, itemId)
  if (!item.iniciadoEm) {
    throw new ValidationError('O item precisa estar em discussão antes de iniciar a votação')
  }

  await prisma.pautaItem.update({
    where: { id: itemId },
    data: {
      status: 'EM_VOTACAO'
    }
  })

  return prisma.pautaItem.findUnique({ where: { id: itemId } })
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
  resultado: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO' = 'CONCLUIDO'
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
    // mas também calcular o resultado real baseado nos votos
    console.log(`[Votação] Proposição ${item.proposicao!.numero}/${item.proposicao!.ano}:`, {
      votos: contagemVotos,
      resultadoOperador: resultado,
      resultadoCalculado: contagemVotos.resultado,
      detalhesQuorum: contagemVotos.detalhesQuorum
    })
  }

  // Atualizar o item da pauta
  const atualizado = await prisma.pautaItem.update({
    where: { id: itemId },
    data: {
      status: resultadoCalculado,
      tempoAcumulado: acumulado,
      tempoReal: acumulado,
      iniciadoEm: null,
      finalizadoEm: new Date()
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

    console.log(`[Votação] Proposição ${item.proposicao!.numero}/${item.proposicao!.ano} atualizada:`, {
      resultado: contagemVotos.resultado,
      status: resultado === 'APROVADO' ? 'APROVADA' : 'REJEITADA',
      dataVotacao: new Date().toISOString(),
      sessaoVotacaoId: sessaoId
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

