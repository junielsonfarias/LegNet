/**
 * API para copiar presença da sessão para ordem do dia
 * POST: Copia todas as presenças da sessão
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// POST - Copia presenças da sessão para ordem do dia
export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id

  // Verificar se sessão existe e buscar presenças
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
        where: { presente: true },
        select: { parlamentarId: true }
      }
    }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  if (sessao.presencas.length === 0) {
    return createSuccessResponse({
      copiados: 0,
      mensagem: 'Nenhuma presença registrada na sessão para copiar'
    })
  }

  // Criar presenças na ordem do dia para todos os presentes na sessão
  const resultados = await Promise.all(
    sessao.presencas.map(async (p) => {
      return prisma.presencaOrdemDia.upsert({
        where: {
          sessaoId_parlamentarId: {
            sessaoId,
            parlamentarId: p.parlamentarId
          }
        },
        update: {
          presente: true,
          registradoEm: new Date(),
          observacoes: 'Copiado da presença da sessão'
        },
        create: {
          sessaoId,
          parlamentarId: p.parlamentarId,
          presente: true,
          observacoes: 'Copiado da presença da sessão'
        }
      })
    })
  )

  await logAudit({
    request,
    session,
    action: 'PRESENCA_ORDEM_DIA_COPIADA',
    entity: 'PresencaOrdemDia',
    entityId: sessaoId,
    metadata: {
      totalCopiados: resultados.length
    }
  })

  return createSuccessResponse({
    copiados: resultados.length,
    mensagem: `${resultados.length} presenças copiadas da sessão para ordem do dia`
  })
}), { permissions: 'sessao.manage' })
