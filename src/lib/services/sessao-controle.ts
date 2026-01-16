import { prisma } from '@/lib/prisma'
import { NotFoundError, ValidationError } from '@/lib/error-handler'

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
        data: sessao.data ?? agora
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

export async function finalizarItemPauta(
  sessaoId: string,
  itemId: string,
  resultado: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO' = 'CONCLUIDO'
) {
  const item = await obterItemPauta(sessaoId, itemId)

  if (item.status === 'CONCLUIDO') {
    return item
  }

  const acumulado = calcularTempoAcumulado(item.iniciadoEm ?? null, item.tempoAcumulado)

  const atualizado = await prisma.pautaItem.update({
    where: { id: itemId },
    data: {
      status: resultado,
      tempoAcumulado: acumulado,
      tempoReal: acumulado,
      iniciadoEm: null,
      finalizadoEm: new Date()
    }
  })

  await prisma.pautaSessao.update({
    where: { id: item.pautaId },
    data: {
      itemAtualId: null
    }
  })

  await atualizarTempoTotalReal(item.pautaId)

  return atualizado
}

