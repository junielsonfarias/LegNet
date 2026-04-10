import { NextRequest } from 'next/server'
import { servidoresDbService } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar servidor por ID
 * SEGURANCA: Requer permissao financeiro.view (dados sensiveis como CPF e salario)
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const servidor = await servidoresDbService.getById(id)

    if (!servidor) {
      throw new NotFoundError('Servidor')
    }

    return createSuccessResponse(servidor)
  },
  { permissions: 'financeiro.view' }
)

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    const servidorExistente = await servidoresDbService.getById(id)
    if (!servidorExistente) {
      throw new NotFoundError('Servidor')
    }

    const servidorAtualizado = await servidoresDbService.update(id, {
      nome: body.nome,
      cpf: body.cpf,
      matricula: body.matricula,
      cargo: body.cargo,
      funcao: body.funcao,
      unidade: body.unidade,
      lotacao: body.lotacao,
      vinculo: body.vinculo,
      dataAdmissao: body.dataAdmissao,
      dataDesligamento: body.dataDesligamento,
      salarioBruto: body.salarioBruto !== undefined ? parseFloat(body.salarioBruto) : undefined,
      situacao: body.situacao,
      observacoes: body.observacoes
    })

    return createSuccessResponse(servidorAtualizado, 'Servidor atualizado com sucesso')
  },
  { permissions: 'financeiro.manage' }
)

export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params

    const servidorExistente = await servidoresDbService.getById(id)
    if (!servidorExistente) {
      throw new NotFoundError('Servidor')
    }

    await servidoresDbService.remove(id)

    return createSuccessResponse(null, 'Servidor excluido com sucesso')
  },
  { permissions: 'financeiro.manage' }
)
