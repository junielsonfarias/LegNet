/**
 * Jobs de prazos legais — executados diariamente via cron.
 *
 * - RN-081: Sanção tácita após 15 dias úteis sem ação do Executivo
 * - RN-084: Alerta de apreciação de veto próximo ao prazo de 30 dias
 * - Pareceres de comissão próximos do prazo
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('jobs/prazos-legais')

const DIAS_UTEIS_SANCAO = 15
const DIAS_PRAZO_VETO = 30
const DIAS_ANTECEDENCIA_AVISO = 7
const DIAS_ANTECEDENCIA_PARECER = 3

function diasUteis(from: Date, to: Date): number {
  let count = 0
  const current = new Date(from)
  while (current < to) {
    current.setDate(current.getDate() + 1)
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

/**
 * RN-081: Aplica sanção tácita em proposições APROVADAS com 15 dias úteis
 * sem ação do Executivo (sanção ou veto).
 */
export async function processarSancaoTacita(): Promise<{
  sancionadas: string[]
  total: number
}> {
  const proposicoes = await prisma.proposicao.findMany({
    where: { status: 'APROVADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true, dataVotacao: true }
  })

  const agora = new Date()
  const elegiveis = proposicoes.filter((prop) => {
    const dataBase = prop.dataVotacao || prop.updatedAt
    return diasUteis(dataBase, agora) >= DIAS_UTEIS_SANCAO
  })

  if (elegiveis.length > 0) {
    await prisma.proposicao.updateMany({
      where: { id: { in: elegiveis.map((p) => p.id) } },
      data: { status: 'SANCIONADA' }
    })
    logger.info(`Sanção tácita aplicada em ${elegiveis.length} proposição(ões)`, {
      ids: elegiveis.map((p) => p.id)
    })
  }

  return {
    sancionadas: elegiveis.map((p) => `${p.tipo} ${p.numero}/${p.ano}`),
    total: elegiveis.length
  }
}

/**
 * RN-084: Gera notificações para prazos próximos (pareceres e vetos).
 * Deduplica criando 1 notificação por entidade a cada 24h.
 */
export async function gerarNotificacoesPrazo(): Promise<{
  notificacoesCriadas: number
}> {
  const agora = new Date()
  const em3Dias = new Date(agora.getTime() + DIAS_ANTECEDENCIA_PARECER * 24 * 60 * 60 * 1000)
  const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
  let notificacoesCriadas = 0

  // 1. Pareceres próximos do prazo
  const pareceresPendentes = await prisma.parecer.findMany({
    where: {
      status: { in: ['RASCUNHO', 'AGUARDANDO_PAUTA', 'AGUARDANDO_VOTACAO'] },
      prazoEmissao: { not: null, lte: em3Dias }
    },
    select: {
      id: true,
      prazoEmissao: true,
      relatorId: true,
      proposicao: { select: { tipo: true, numero: true, ano: true } },
      comissao: { select: { sigla: true, nome: true } }
    }
  })

  if (pareceresPendentes.length > 0) {
    const notificacoesExistentes = await prisma.notificacaoMulticanal.findMany({
      where: {
        canal: 'SISTEMA',
        metadata: { path: ['entidadeTipo'], equals: 'PARECER' },
        createdAt: { gte: ontem }
      },
      select: { metadata: true }
    })
    const idsNotificados = new Set(
      notificacoesExistentes
        .map((n) => (n.metadata as Record<string, unknown>)?.entidadeId)
        .filter(Boolean)
    )

    const relatorIds = Array.from(
      new Set(pareceresPendentes.map((p) => p.relatorId).filter(Boolean))
    ) as string[]
    const usuarios =
      relatorIds.length > 0
        ? await prisma.user.findMany({
            where: { parlamentarId: { in: relatorIds }, ativo: true },
            select: { id: true, email: true, parlamentarId: true }
          })
        : []
    const usuarioPorParlamentar = new Map(usuarios.map((u) => [u.parlamentarId, u]))

    const notificacoesParaCriar: Prisma.NotificacaoMulticanalCreateManyInput[] = []
    for (const p of pareceresPendentes) {
      if (!p.relatorId || idsNotificados.has(p.id)) continue
      const dias = Math.ceil(
        ((p.prazoEmissao?.getTime() || 0) - agora.getTime()) / (1000 * 60 * 60 * 24)
      )
      const assunto =
        dias < 0
          ? `VENCIDO: Parecer ${p.comissao?.sigla} - ${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano}`
          : `Prazo em ${dias} dia(s): Parecer ${p.comissao?.sigla} - ${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano}`

      const usuario = usuarioPorParlamentar.get(p.relatorId)
      const destinatario = usuario?.email || p.relatorId

      notificacoesParaCriar.push({
        canal: 'SISTEMA' as const,
        destinatario,
        assunto,
        mensagem: `O prazo para emissão do parecer da ${p.comissao?.nome || 'comissão'} sobre ${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano} ${dias < 0 ? 'está vencido' : `vence em ${dias} dia(s)`}.`,
        metadata: {
          tipo: 'ALERTA_PRAZO',
          entidadeId: p.id,
          entidadeTipo: 'PARECER',
          prioridade: dias < 0 ? 'ALTA' : 'MEDIA',
          destinatarioUserId: usuario?.id || null,
          diasRestantes: dias
        }
      })
    }

    if (notificacoesParaCriar.length > 0) {
      await prisma.notificacaoMulticanal.createMany({ data: notificacoesParaCriar })
      notificacoesCriadas += notificacoesParaCriar.length
    }
  }

  // 2. Vetos próximos dos 30 dias (RN-084)
  const vetosPendentes = await prisma.proposicao.findMany({
    where: { status: 'VETADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true }
  })

  const vetosComPrazo = vetosPendentes.filter((v) => {
    const prazoVeto = new Date(v.updatedAt.getTime() + DIAS_PRAZO_VETO * 24 * 60 * 60 * 1000)
    const dias = Math.ceil((prazoVeto.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    return dias <= DIAS_ANTECEDENCIA_AVISO
  })

  if (vetosComPrazo.length > 0) {
    const notificacoesVetoExistentes = await prisma.notificacaoMulticanal.findMany({
      where: {
        canal: 'SISTEMA',
        metadata: { path: ['entidadeTipo'], equals: 'PROPOSICAO' },
        createdAt: { gte: ontem }
      },
      select: { metadata: true }
    })
    const idsVetoNotificados = new Set(
      notificacoesVetoExistentes
        .map((n) => (n.metadata as Record<string, unknown>)?.entidadeId)
        .filter(Boolean)
    )

    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SECRETARIA'] }, ativo: true },
      select: { id: true, email: true }
    })

    const notificacoesVetoCriar: Prisma.NotificacaoMulticanalCreateManyInput[] = []
    for (const v of vetosComPrazo) {
      if (idsVetoNotificados.has(v.id)) continue
      const prazoVeto = new Date(v.updatedAt.getTime() + DIAS_PRAZO_VETO * 24 * 60 * 60 * 1000)
      const dias = Math.ceil((prazoVeto.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))

      for (const admin of admins) {
        notificacoesVetoCriar.push({
          canal: 'SISTEMA' as const,
          destinatario: admin.email,
          assunto:
            dias < 0
              ? `URGENTE: Veto com prazo expirado - ${v.tipo} ${v.numero}/${v.ano}`
              : `Veto em ${dias} dia(s) - ${v.tipo} ${v.numero}/${v.ano}`,
          mensagem: `O prazo de ${DIAS_PRAZO_VETO} dias para apreciação do veto sobre ${v.tipo} ${v.numero}/${v.ano} ${dias < 0 ? 'está expirado (pauta trancada)' : `expira em ${dias} dia(s)`}.`,
          metadata: {
            tipo: 'ALERTA_PRAZO',
            entidadeId: v.id,
            entidadeTipo: 'PROPOSICAO',
            prioridade: dias < 0 ? 'URGENTE' : 'ALTA',
            destinatarioUserId: admin.id,
            diasRestantes: dias
          }
        })
      }
    }

    if (notificacoesVetoCriar.length > 0) {
      await prisma.notificacaoMulticanal.createMany({ data: notificacoesVetoCriar })
      notificacoesCriadas += notificacoesVetoCriar.length
    }
  }

  return { notificacoesCriadas }
}
