/**
 * API para listar sessões disponíveis para vinculação de pauta
 * Retorna sessões que ainda não têm PautaSessao vinculada
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export const GET = withAuth(withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const incluirComPauta = searchParams.get('incluirComPauta') === 'true'
  const incluirFinalizadas = searchParams.get('incluirFinalizadas') === 'true'

  // Buscar sessões que ainda NÃO têm pauta vinculada
  // Se incluirFinalizadas, inclui também sessões CONCLUIDAS
  const whereClause: any = incluirComPauta ? {} : { pautaSessao: null }

  // Por padrão, não incluir sessões canceladas
  if (!incluirFinalizadas) {
    whereClause.status = { not: 'CANCELADA' }
  }

  const sessoes = await prisma.sessao.findMany({
    where: whereClause,
    include: {
      legislatura: {
        select: {
          numero: true,
          anoInicio: true,
          anoFim: true
        }
      },
      pautaSessao: {
        select: {
          id: true,
          status: true,
          tempoTotalEstimado: true,
          _count: {
            select: {
              itens: true
            }
          }
        }
      }
    },
    orderBy: [
      { data: 'desc' },
      { numero: 'desc' }
    ],
    take: 100
  })

  // Separar em com e sem pauta
  const sessoesFormatadas = sessoes.map(sessao => ({
    id: sessao.id,
    numero: sessao.numero,
    tipo: sessao.tipo,
    data: sessao.data,
    horario: sessao.horario,
    local: sessao.local,
    status: sessao.status,
    descricao: sessao.descricao,
    legislatura: sessao.legislatura ? {
      numero: sessao.legislatura.numero,
      periodo: `${sessao.legislatura.anoInicio}-${sessao.legislatura.anoFim}`
    } : null,
    temPauta: !!sessao.pautaSessao,
    pauta: sessao.pautaSessao ? {
      id: sessao.pautaSessao.id,
      status: sessao.pautaSessao.status,
      tempoTotalEstimado: sessao.pautaSessao.tempoTotalEstimado,
      totalItens: sessao.pautaSessao._count.itens
    } : null
  }))

  const semPauta = sessoesFormatadas.filter(s => !s.temPauta)
  const comPauta = sessoesFormatadas.filter(s => s.temPauta)
  const finalizadas = semPauta.filter(s => s.status === 'CONCLUIDA')
  const agendadas = semPauta.filter(s => s.status === 'AGENDADA')

  return createSuccessResponse({
    sessoesSemPauta: semPauta,
    sessoesComPauta: incluirComPauta ? comPauta : [],
    sessoesFinaliadasSemPauta: finalizadas,
    sessoesAgendadasSemPauta: agendadas,
    totais: {
      semPauta: semPauta.length,
      comPauta: comPauta.length,
      finalizadasSemPauta: finalizadas.length,
      agendadasSemPauta: agendadas.length
    }
  }, `${semPauta.length} sessão(ões) disponível(is) para nova pauta`)
}), { permissions: 'pauta.manage' })
