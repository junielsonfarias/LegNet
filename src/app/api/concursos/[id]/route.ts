import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError, validateId, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { concursosService } from '@/lib/services/concursos-service'

export const dynamic = 'force-dynamic'

export const GET = withAuth(withErrorHandler(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const concurso = await concursosService.getById(validateId(id, 'Concurso'))
  if (!concurso) throw new NotFoundError('Concurso')
  return createSuccessResponse(concurso)
}))

export const PATCH = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const concursoId = validateId(id, 'Concurso')
  const existing = await concursosService.getById(concursoId)
  if (!existing) throw new NotFoundError('Concurso')

  const body = await request.json()
  const concurso = await concursosService.update(concursoId, {
    titulo: body.titulo,
    edital: body.edital,
    descricao: body.descricao,
    status: body.status,
    dataPublicacao: body.dataPublicacao,
    dataInscricaoInicio: body.dataInscricaoInicio,
    dataInscricaoFim: body.dataInscricaoFim,
    dataProva: body.dataProva,
    vagas: body.vagas !== undefined ? parseInt(body.vagas) : undefined,
    observacoes: body.observacoes,
    arquivo: body.arquivo
  })

  return createSuccessResponse(concurso, 'Concurso atualizado com sucesso')
}))

export const DELETE = withAuth(withErrorHandler(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const concursoId = validateId(id, 'Concurso')
  const existing = await concursosService.getById(concursoId)
  if (!existing) throw new NotFoundError('Concurso')

  await concursosService.delete(concursoId)
  return createSuccessResponse(null, 'Concurso excluído com sucesso')
}))
