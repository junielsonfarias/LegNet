import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { bensPatrimoniaisDbService } from '@/lib/services/bens-patrimoniais-db-service'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const bem = await bensPatrimoniaisDbService.getById(id)

  if (!bem) {
    throw new NotFoundError('Bem patrimonial')
  }

  return createSuccessResponse(bem)
})

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params
    const body = await request.json()

    const bemExistente = await bensPatrimoniaisDbService.getById(id)
    if (!bemExistente) {
      throw new NotFoundError('Bem patrimonial')
    }

    const bemAtualizado = await bensPatrimoniaisDbService.update(id, {
      tipo: body.tipo,
      tombamento: body.tombamento,
      descricao: body.descricao,
      especificacao: body.especificacao,
      dataAquisicao: body.dataAquisicao,
      valorAquisicao: body.valorAquisicao !== undefined ? parseFloat(body.valorAquisicao) : undefined,
      valorAtual: body.valorAtual !== undefined ? parseFloat(body.valorAtual) : undefined,
      localizacao: body.localizacao,
      responsavel: body.responsavel,
      situacao: body.situacao,
      matriculaImovel: body.matriculaImovel,
      enderecoImovel: body.enderecoImovel,
      areaImovel: body.areaImovel !== undefined ? parseFloat(body.areaImovel) : undefined,
      observacoes: body.observacoes
    })

    return createSuccessResponse(bemAtualizado, 'Bem patrimonial atualizado com sucesso')
  },
  { permissions: 'financeiro.manage' }
)

export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params

    const bemExistente = await bensPatrimoniaisDbService.getById(id)
    if (!bemExistente) {
      throw new NotFoundError('Bem patrimonial')
    }

    await bensPatrimoniaisDbService.remove(id)

    return createSuccessResponse(null, 'Bem patrimonial excluido com sucesso')
  },
  { permissions: 'financeiro.manage' }
)
