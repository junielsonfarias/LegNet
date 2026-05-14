import { NextRequest } from 'next/server'
import { servidoresDbService, serializeServidor } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError, ValidationError } from '@/lib/error-handler'
import { UpdateServidorSchema } from '@/lib/validation/servidor-schema'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar servidor por ID (retorna CPF mascarado)
 * SEGURANCA: financeiro-resumo.view permite ver dados mascarados.
 * Para ver CPF puro/decriptado, e necessario financeiro-detalhe.view (futuro).
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

    return createSuccessResponse(serializeServidor(servidor))
  },
  { permissions: 'financeiro-resumo.view' }
)

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    // F1.3 — validacao Zod
    const parsed = UpdateServidorSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
    }
    const data = parsed.data

    const servidorExistente = await servidoresDbService.getById(id)
    if (!servidorExistente) {
      throw new NotFoundError('Servidor')
    }

    const servidorAtualizado = await servidoresDbService.update(id, {
      nome: data.nome,
      cpf: data.cpf,
      matricula: data.matricula,
      cargo: data.cargo,
      funcao: data.funcao,
      unidade: data.unidade,
      lotacao: data.lotacao,
      vinculo: data.vinculo,
      dataAdmissao: data.dataAdmissao,
      dataDesligamento: data.dataDesligamento,
      salarioBruto: data.salarioBruto,
      situacao: data.situacao,
      observacoes: data.observacoes,
    })

    return createSuccessResponse(serializeServidor(servidorAtualizado), 'Servidor atualizado com sucesso')
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
