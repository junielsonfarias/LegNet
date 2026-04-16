import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Calcula dias uteis entre duas datas (exclui sabado e domingo)
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

// POST - Verificar e aplicar sancao tacita (15 dias uteis sem acao do executivo)
export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const proposicoes = await prisma.proposicao.findMany({
    where: { status: 'APROVADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true, dataVotacao: true }
  })

  const agora = new Date()
  const elegíveis = proposicoes.filter(prop => {
    const dataBase = prop.dataVotacao || prop.updatedAt
    return diasUteis(dataBase, agora) >= 15
  })

  if (elegíveis.length > 0) {
    await prisma.proposicao.updateMany({
      where: { id: { in: elegíveis.map(p => p.id) } },
      data: { status: 'SANCIONADA' }
    })
  }

  const sancionadas = elegíveis.map(p => `${p.tipo} ${p.numero}/${p.ano}`)

  return createSuccessResponse(
    { sancionadas, total: sancionadas.length },
    sancionadas.length > 0
      ? `${sancionadas.length} proposição(ões) sancionada(s) tacitamente`
      : 'Nenhuma proposição com prazo de sanção expirado'
  )
}, { permissions: 'tramitacao.manage' })
