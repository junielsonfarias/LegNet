import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Gerar notificações para prazos próximos (chamar via cron diário)
export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const agora = new Date()
  const em3Dias = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000)
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

  for (const p of pareceresPendentes) {
    if (!p.relatorId) continue
    const dias = Math.ceil(((p.prazoEmissao?.getTime() || 0) - agora.getTime()) / (1000 * 60 * 60 * 24))
    const assunto = dias < 0
      ? `VENCIDO: Parecer ${p.comissao?.sigla} - ${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano}`
      : `Prazo em ${dias} dia(s): Parecer ${p.comissao?.sigla} - ${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano}`

    // Verificar se já existe notificação recente para este parecer
    const existente = await prisma.notificacaoMulticanal.findFirst({
      where: {
        canal: 'SISTEMA',
        metadata: { path: ['entidadeId'], equals: p.id },
        createdAt: { gte: new Date(agora.getTime() - 24 * 60 * 60 * 1000) }
      }
    })

    if (!existente) {
      // Buscar o usuário vinculado ao parlamentar relator
      const usuario = await prisma.user.findFirst({
        where: { parlamentarId: p.relatorId, ativo: true },
        select: { id: true, email: true }
      })

      const destinatario = usuario?.email || p.relatorId

      await prisma.notificacaoMulticanal.create({
        data: {
          canal: 'SISTEMA',
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
        }
      })
      notificacoesCriadas++
    }
  }

  // 2. Vetos próximos do prazo de 30 dias
  const vetosPendentes = await prisma.proposicao.findMany({
    where: { status: 'VETADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true }
  })

  for (const v of vetosPendentes) {
    const prazoVeto = new Date(v.updatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const dias = Math.ceil((prazoVeto.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))

    if (dias <= 7) {
      const existente = await prisma.notificacaoMulticanal.findFirst({
        where: {
          canal: 'SISTEMA',
          metadata: { path: ['entidadeId'], equals: v.id },
          createdAt: { gte: new Date(agora.getTime() - 24 * 60 * 60 * 1000) }
        }
      })

      if (!existente) {
        // Notificar todos os admins/secretaria
        const admins = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SECRETARIA'] }, ativo: true },
          select: { id: true, email: true }
        })

        for (const admin of admins) {
          await prisma.notificacaoMulticanal.create({
            data: {
              canal: 'SISTEMA',
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
            }
          })
          notificacoesCriadas++
        }
      }
    }
  }

  return createSuccessResponse({
    notificacoesCriadas,
    dataExecucao: agora.toISOString()
  }, `${notificacoesCriadas} notificação(ões) de prazo gerada(s)`)
}, { permissions: 'config.manage' })
