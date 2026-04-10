import { NextRequest } from 'next/server'
import { diariasService } from '@/lib/services/diarias-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar diaria por ID (admin)
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const diaria = await diariasService.getById(id)

    if (!diaria) {
      throw new NotFoundError('Diaria')
    }

    return createSuccessResponse(diaria)
  },
  { permissions: 'financeiro.view' }
)

/**
 * PATCH - Atualizar diaria (admin)
 */
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    const diariaExistente = await diariasService.getById(id)
    if (!diariaExistente) {
      throw new NotFoundError('Diaria')
    }

    const diaria = await diariasService.update(id, {
      destino: body.destino,
      motivo: body.motivo,
      valorUnitario: body.valorUnitario !== undefined ? parseFloat(body.valorUnitario) : undefined,
      quantidade: body.quantidade !== undefined ? parseInt(body.quantidade) : undefined,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      comprovante: body.comprovante,
      nome: body.nome,
      cargo: body.cargo
    })

    return createSuccessResponse(diaria, 'Diaria atualizada com sucesso')
  },
  { permissions: 'financeiro.manage' }
)

/**
 * DELETE - Excluir diaria (admin)
 */
export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params

    const diariaExistente = await diariasService.getById(id)
    if (!diariaExistente) {
      throw new NotFoundError('Diaria')
    }

    await diariasService.delete(id)

    return createSuccessResponse(null, 'Diaria excluida com sucesso')
  },
  { permissions: 'financeiro.manage' }
)
