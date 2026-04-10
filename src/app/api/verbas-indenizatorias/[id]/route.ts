import { NextRequest } from 'next/server'
import { verbasIndenizatoriasService } from '@/lib/services/verbas-indenizatorias-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar verba indenizatoria por ID (admin)
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const verba = await verbasIndenizatoriasService.getById(id)

    if (!verba) {
      throw new NotFoundError('Verba indenizatoria')
    }

    return createSuccessResponse(verba)
  },
  { permissions: 'financeiro.view' }
)

/**
 * PATCH - Atualizar verba indenizatoria (admin)
 */
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    const verbaExistente = await verbasIndenizatoriasService.getById(id)
    if (!verbaExistente) {
      throw new NotFoundError('Verba indenizatoria')
    }

    const verba = await verbasIndenizatoriasService.update(id, {
      tipo: body.tipo,
      descricao: body.descricao,
      valor: body.valor !== undefined ? parseFloat(body.valor) : undefined,
      mes: body.mes !== undefined ? parseInt(body.mes) : undefined,
      ano: body.ano !== undefined ? parseInt(body.ano) : undefined,
      parlamentarId: body.parlamentarId,
      nomeParlamentar: body.nomeParlamentar,
      comprovante: body.comprovante
    })

    return createSuccessResponse(verba, 'Verba indenizatoria atualizada com sucesso')
  },
  { permissions: 'financeiro.manage' }
)

/**
 * DELETE - Excluir verba indenizatoria (admin)
 */
export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params

    const verbaExistente = await verbasIndenizatoriasService.getById(id)
    if (!verbaExistente) {
      throw new NotFoundError('Verba indenizatoria')
    }

    await verbasIndenizatoriasService.delete(id)

    return createSuccessResponse(null, 'Verba indenizatoria excluida com sucesso')
  },
  { permissions: 'financeiro.manage' }
)
