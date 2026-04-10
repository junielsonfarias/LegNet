import { NextRequest } from 'next/server'
import { folhaPagamentoDbService } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// SEGURANCA: GET protegido pois dados financeiros devem ser acessados via /api/dados-abertos para transparencia
export const GET = withAuth(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const ano = searchParams.get('ano')
    const mes = searchParams.get('mes')
    const situacao = searchParams.get('situacao')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await folhaPagamentoDbService.paginate(
      {
        ano: ano ? parseInt(ano) : undefined,
        mes: mes ? parseInt(mes) : undefined,
        situacao: situacao || undefined
      },
      { page, limit }
    )

    return createSuccessResponse(result.data, undefined, undefined, 200, {
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages
    })
  },
  { permissions: 'financeiro.manage' }
)

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()

    if (!body.competencia || !body.mes || !body.ano) {
      throw new ValidationError('Campos obrigatorios nao fornecidos (competencia, mes, ano)')
    }

    const novaFolha = await folhaPagamentoDbService.create({
      competencia: body.competencia,
      mes: body.mes,
      ano: body.ano,
      totalServidores: body.totalServidores ? parseInt(body.totalServidores) : null,
      totalBruto: body.totalBruto ? parseFloat(body.totalBruto) : null,
      totalDeducoes: body.totalDeducoes ? parseFloat(body.totalDeducoes) : null,
      totalLiquido: body.totalLiquido ? parseFloat(body.totalLiquido) : null,
      dataProcessamento: body.dataProcessamento,
      situacao: body.situacao,
      observacoes: body.observacoes
    })

    return createSuccessResponse(novaFolha, 'Folha de pagamento criada com sucesso', undefined, 201)
  },
  { permissions: 'financeiro.manage' }
)
