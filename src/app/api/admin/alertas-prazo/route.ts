import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Listar alertas de prazo
export const GET = withAuth(async () => {
  const agora = new Date()
  const alertas: Array<{
    tipo: string
    entidade: string
    identificacao: string
    prazo: string
    diasRestantes: number
    vencido: boolean
    urgencia: 'VENCIDO' | 'CRITICO' | 'ATENCAO' | 'NORMAL'
  }> = []

  // 1. Pareceres com prazo de emissão próximo/vencido
  const pareceresPendentes = await prisma.parecer.findMany({
    where: {
      status: { in: ['RASCUNHO', 'AGUARDANDO_PAUTA', 'AGUARDANDO_VOTACAO'] },
      prazoEmissao: { not: null }
    },
    select: {
      id: true, prazoEmissao: true, status: true,
      proposicao: { select: { numero: true, ano: true, tipo: true } },
      comissao: { select: { sigla: true, nome: true } }
    }
  })

  for (const p of pareceresPendentes) {
    if (!p.prazoEmissao) continue
    const dias = Math.ceil((p.prazoEmissao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    alertas.push({
      tipo: 'PARECER',
      entidade: `Parecer ${p.comissao?.sigla || p.comissao?.nome}`,
      identificacao: `${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano}`,
      prazo: p.prazoEmissao.toISOString(),
      diasRestantes: dias,
      vencido: dias < 0,
      urgencia: dias < 0 ? 'VENCIDO' : dias <= 1 ? 'CRITICO' : dias <= 3 ? 'ATENCAO' : 'NORMAL'
    })
  }

  // 2. Proposições vetadas (prazo 30 dias para apreciação)
  const vetosPendentes = await prisma.proposicao.findMany({
    where: { status: 'VETADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true }
  })

  for (const v of vetosPendentes) {
    const prazoVeto = new Date(v.updatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const dias = Math.ceil((prazoVeto.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    alertas.push({
      tipo: 'VETO',
      entidade: 'Apreciação de veto',
      identificacao: `${v.tipo} ${v.numero}/${v.ano}`,
      prazo: prazoVeto.toISOString(),
      diasRestantes: dias,
      vencido: dias < 0,
      urgencia: dias < 0 ? 'VENCIDO' : dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ATENCAO' : 'NORMAL'
    })
  }

  // 3. Proposições aprovadas aguardando sanção (prazo 15 dias úteis)
  const aguardandoSancao = await prisma.proposicao.findMany({
    where: { status: 'APROVADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true, dataVotacao: true }
  })

  for (const s of aguardandoSancao) {
    const dataBase = s.dataVotacao || s.updatedAt
    const prazoSancao = new Date(dataBase.getTime() + 21 * 24 * 60 * 60 * 1000) // ~15 dias úteis
    const dias = Math.ceil((prazoSancao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    alertas.push({
      tipo: 'SANCAO',
      entidade: 'Prazo de sanção',
      identificacao: `${s.tipo} ${s.numero}/${s.ano}`,
      prazo: prazoSancao.toISOString(),
      diasRestantes: dias,
      vencido: dias < 0,
      urgencia: dias < 0 ? 'VENCIDO' : dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ATENCAO' : 'NORMAL'
    })
  }

  // 4. Tramitações com prazo vencido
  const tramitacoesPendentes = await prisma.tramitacao.findMany({
    where: {
      status: 'EM_ANDAMENTO',
      prazoVencimento: { not: null }
    },
    select: {
      id: true, prazoVencimento: true,
      proposicao: { select: { numero: true, ano: true, tipo: true } },
      unidade: { select: { sigla: true, nome: true } }
    }
  })

  for (const t of tramitacoesPendentes) {
    if (!t.prazoVencimento) continue
    const dias = Math.ceil((t.prazoVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    alertas.push({
      tipo: 'TRAMITACAO',
      entidade: `Tramitação em ${t.unidade?.sigla || t.unidade?.nome}`,
      identificacao: `${t.proposicao?.tipo} ${t.proposicao?.numero}/${t.proposicao?.ano}`,
      prazo: t.prazoVencimento.toISOString(),
      diasRestantes: dias,
      vencido: dias < 0,
      urgencia: dias < 0 ? 'VENCIDO' : dias <= 1 ? 'CRITICO' : dias <= 3 ? 'ATENCAO' : 'NORMAL'
    })
  }

  // Ordenar: vencidos primeiro, depois por dias restantes
  alertas.sort((a, b) => {
    if (a.vencido && !b.vencido) return -1
    if (!a.vencido && b.vencido) return 1
    return a.diasRestantes - b.diasRestantes
  })

  return createSuccessResponse({
    alertas,
    resumo: {
      total: alertas.length,
      vencidos: alertas.filter(a => a.vencido).length,
      criticos: alertas.filter(a => a.urgencia === 'CRITICO').length,
      atencao: alertas.filter(a => a.urgencia === 'ATENCAO').length,
    }
  }, `${alertas.length} alertas de prazo encontrados`)
}, { permissions: 'dashboard.view' })
