import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Gerar notificações para prazos próximos (chamar via cron diário)
export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const agora = new Date()
  const em3Dias = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000)
  const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
  let notificacoesCriadas = 0

  // 1. Pareceres com prazo próximo
  const pareceresPendentes = await prisma.parecer.findMany({
    where: {
      status: { in: ['RASCUNHO', 'AGUARDANDO_PAUTA', 'AGUARDANDO_VOTACAO'] },
      prazoEmissao: { not: null, lte: em3Dias }
    },
    select: {
      id: true, prazoEmissao: true, relatorId: true,
      proposicao: { select: { tipo: true, numero: true, ano: true } },
      comissao: { select: { sigla: true, nome: true } }
    }
  })

  if (pareceresPendentes.length > 0) {
    // Batch: buscar notificações existentes para todos os pareceres de uma vez
    const parecerIds = pareceresPendentes.map(p => p.id)
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
        .map(n => (n.metadata as Record<string, unknown>)?.entidadeId)
        .filter(Boolean)
    )

    // Batch: buscar todos os usuários relatores de uma vez
    const relatorIds = Array.from(new Set(pareceresPendentes.map(p => p.relatorId).filter(Boolean))) as string[]
    const usuarios = relatorIds.length > 0
      ? await prisma.user.findMany({
          where: { parlamentarId: { in: relatorIds }, ativo: true },
          select: { id: true, email: true, parlamentarId: true }
        })
      : []
    const usuarioPorParlamentar = new Map(usuarios.map(u => [u.parlamentarId, u]))

    // Criar notificações em batch
    const notificacoesParaCriar = []
    for (const p of pareceresPendentes) {
      if (!p.relatorId || idsNotificados.has(p.id)) continue
      const dias = Math.ceil(((p.prazoEmissao?.getTime() || 0) - agora.getTime()) / (1000 * 60 * 60 * 24))
      const assunto = dias < 0
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

  // 2. Vetos próximos do prazo de 30 dias
  const vetosPendentes = await prisma.proposicao.findMany({
    where: { status: 'VETADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true }
  })

  const vetosComPrazo = vetosPendentes.filter(v => {
    const prazoVeto = new Date(v.updatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const dias = Math.ceil((prazoVeto.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    return dias <= 7
  })

  if (vetosComPrazo.length > 0) {
    // Batch: buscar notificações existentes para vetos
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
        .map(n => (n.metadata as Record<string, unknown>)?.entidadeId)
        .filter(Boolean)
    )

    // Batch: buscar admins/secretaria UMA vez
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SECRETARIA'] }, ativo: true },
      select: { id: true, email: true }
    })

    const notificacoesVetoCriar = []
    for (const v of vetosComPrazo) {
      if (idsVetoNotificados.has(v.id)) continue
      const prazoVeto = new Date(v.updatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
      const dias = Math.ceil((prazoVeto.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))

      for (const admin of admins) {
        notificacoesVetoCriar.push({
          canal: 'SISTEMA' as const,
          destinatario: admin.email,
          assunto: dias < 0
            ? `URGENTE: Veto com prazo expirado - ${v.tipo} ${v.numero}/${v.ano}`
            : `Veto em ${dias} dia(s) - ${v.tipo} ${v.numero}/${v.ano}`,
          mensagem: `O prazo de 30 dias para apreciação do veto sobre ${v.tipo} ${v.numero}/${v.ano} ${dias < 0 ? 'está expirado (pauta trancada)' : `expira em ${dias} dia(s)`}.`,
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

  return createSuccessResponse({
    notificacoesCriadas,
    dataExecucao: agora.toISOString()
  }, `${notificacoesCriadas} notificação(ões) de prazo gerada(s)`)
}, { permissions: 'config.manage' })
