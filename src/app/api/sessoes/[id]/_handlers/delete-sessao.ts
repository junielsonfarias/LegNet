import { NextRequest } from 'next/server'
import { Session } from 'next-auth'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { sessaoDbService } from '@/lib/services/sessao-db-service'

/**
 * Handler para excluir sessão
 * DELETE /api/sessoes/[id]
 */
export async function deleteSessaoHandler(
  request: NextRequest,
  params: { id: string },
  session: Session
) {
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const id = await resolverSessaoId(params.id)

  // Verificar se sessão existe
  const existingSessao = await sessaoDbService.getById(id)

  if (!existingSessao) {
    throw new NotFoundError('Sessão')
  }

  await sessaoDbService.delete(id)

  await logAudit({
    request,
    session,
    action: 'SESSAO_DELETE',
    entity: 'Sessao',
    entityId: id,
    metadata: {
      numero: existingSessao.numero,
      tipo: existingSessao.tipo
    }
  })

  return createSuccessResponse(null, 'Sessão excluída com sucesso')
}
