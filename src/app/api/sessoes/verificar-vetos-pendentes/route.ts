import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Verificar vetos pendentes que trancam a pauta
export const GET = withAuth(async () => {
  const proposicoesVetadas = await prisma.proposicao.findMany({
    where: { status: 'VETADA' },
    select: {
      id: true, numero: true, ano: true, tipo: true, titulo: true,
      updatedAt: true, dataVotacao: true
    }
  })

  const agora = new Date()
  const vetosPendentes: Array<{
    id: string
    identificacao: string
    titulo: string
    diasPendente: number
    pautaTrancada: boolean
  }> = []

  for (const prop of proposicoesVetadas) {
    const dataVeto = prop.updatedAt
    const dias = Math.floor((agora.getTime() - dataVeto.getTime()) / (1000 * 60 * 60 * 24))

    vetosPendentes.push({
      id: prop.id,
      identificacao: `${prop.tipo} ${prop.numero}/${prop.ano}`,
      titulo: prop.titulo,
      diasPendente: dias,
      pautaTrancada: dias >= 30
    })
  }

  const pautaTrancada = vetosPendentes.some(v => v.pautaTrancada)

  return createSuccessResponse({
    vetosPendentes,
    totalVetos: vetosPendentes.length,
    pautaTrancada,
    mensagem: pautaTrancada
      ? 'PAUTA TRANCADA: Existem vetos pendentes há mais de 30 dias que devem ser apreciados antes de qualquer outra matéria'
      : vetosPendentes.length > 0
        ? `${vetosPendentes.length} veto(s) pendente(s) de apreciação`
        : 'Nenhum veto pendente'
  }, 'Verificação de vetos concluída')
}, { permissions: 'sessao.view' })
