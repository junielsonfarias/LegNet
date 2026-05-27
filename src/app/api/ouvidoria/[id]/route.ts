import { NextRequest } from 'next/server'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError, ValidationError } from '@/lib/error-handler'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/lgpd/ouvidoria-detalhe')

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar manifestação por ID (admin)
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const manifestacao = await ouvidoriaService.getById(id)

  if (!manifestacao) {
    throw new NotFoundError('Manifestação')
  }

  return createSuccessResponse(manifestacao)
})

/**
 * PATCH - Ações na manifestação (admin)
 * Ações: responder, encaminhar, concluir
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any
) => {
  const { id } = await params
  const body = await request.json()

  const manifestacao = await ouvidoriaService.getById(id)
  if (!manifestacao) {
    throw new NotFoundError('Manifestação')
  }

  let resultado

  switch (body.acao) {
    case 'responder':
      if (!body.resposta) {
        throw new ValidationError('Campo resposta é obrigatório')
      }
      resultado = await ouvidoriaService.responder(id, body.resposta, body.respondidoPor || session?.user?.name || 'Sistema')
      break

    case 'encaminhar':
      if (!body.setor) {
        throw new ValidationError('Campo setor é obrigatório para encaminhamento')
      }
      resultado = await ouvidoriaService.encaminhar(id, body.setor, body.respondidoPor || session?.user?.name || 'Sistema')
      break

    case 'concluir':
      resultado = await ouvidoriaService.concluir(id, body.respondidoPor || session?.user?.name || 'Sistema')
      break

    default:
      log.warn('Ação ouvidoria inválida bloqueada', {
        action: 'ouvidoria_action_invalid',
        id,
        acaoTentada: body.acao
      })
      throw new ValidationError('Ação inválida. Use: responder, encaminhar ou concluir')
  }

  log.info('Manifestação ouvidoria atualizada', {
    action: `ouvidoria_${body.acao}`,
    id,
    userId: session?.user?.id
  })

  return createSuccessResponse(
    resultado,
    `Manifestação ${body.acao === 'responder' ? 'respondida' : body.acao === 'encaminhar' ? 'encaminhada' : 'concluída'} com sucesso`
  )
})
