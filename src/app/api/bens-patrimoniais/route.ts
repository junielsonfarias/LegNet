import { NextRequest } from 'next/server'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { bensPatrimoniaisDbService } from '@/lib/services/bens-patrimoniais-db-service'
import type { TipoBem, SituacaoBem } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') as TipoBem | null
  const situacao = searchParams.get('situacao') as SituacaoBem | null
  const descricao = searchParams.get('descricao')
  const localizacao = searchParams.get('localizacao')
  const responsavel = searchParams.get('responsavel')
  const valorMinimo = searchParams.get('valorMinimo')
  const valorMaximo = searchParams.get('valorMaximo')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const result = await bensPatrimoniaisDbService.paginate(
    {
      tipo: tipo || undefined,
      situacao: situacao || undefined,
      descricao: descricao || undefined,
      localizacao: localizacao || undefined,
      responsavel: responsavel || undefined,
      valorMinimo: valorMinimo ? parseFloat(valorMinimo) : undefined,
      valorMaximo: valorMaximo ? parseFloat(valorMaximo) : undefined
    },
    { page, limit }
  )

  return createSuccessResponse(result.data, undefined, undefined, 200, {
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
    totalPages: result.pagination.totalPages
  })
})

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()

    if (!body.tipo || !body.descricao) {
      throw new ValidationError('Campos obrigatorios nao fornecidos (tipo, descricao)')
    }

    const novoBem = await bensPatrimoniaisDbService.create({
      tipo: body.tipo,
      tombamento: body.tombamento,
      descricao: body.descricao,
      especificacao: body.especificacao,
      dataAquisicao: body.dataAquisicao,
      valorAquisicao: body.valorAquisicao ? parseFloat(body.valorAquisicao) : null,
      valorAtual: body.valorAtual ? parseFloat(body.valorAtual) : null,
      localizacao: body.localizacao,
      responsavel: body.responsavel,
      situacao: body.situacao,
      matriculaImovel: body.matriculaImovel,
      enderecoImovel: body.enderecoImovel,
      areaImovel: body.areaImovel ? parseFloat(body.areaImovel) : null,
      observacoes: body.observacoes
    })

    return createSuccessResponse(novoBem, 'Bem patrimonial criado com sucesso', undefined, 201)
  },
  { permissions: 'financeiro.manage' }
)
