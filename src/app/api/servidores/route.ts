import { NextRequest } from 'next/server'
import { servidoresDbService, serializeServidor, serializeServidores } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import type { SituacaoServidor, VinculoServidor } from '@prisma/client'

export const dynamic = 'force-dynamic'

// SEGURANCA: GET protegido pois retorna dados sensiveis (CPF, salario)
export const GET = withAuth(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const situacao = searchParams.get('situacao') as SituacaoServidor | null
    const vinculo = searchParams.get('vinculo') as VinculoServidor | null
    const cargo = searchParams.get('cargo')
    const unidade = searchParams.get('unidade')
    const nome = searchParams.get('nome')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await servidoresDbService.paginate(
      {
        situacao: situacao || undefined,
        vinculo: vinculo || undefined,
        cargo: cargo || undefined,
        unidade: unidade || undefined,
        nome: nome || undefined
      },
      { page, limit }
    )

    return createSuccessResponse(serializeServidores(result.data), undefined, undefined, 200, {
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

    if (!body.nome || !body.vinculo) {
      throw new ValidationError('Campos obrigatorios nao fornecidos (nome, vinculo)')
    }

    const novoServidor = await servidoresDbService.create({
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
      salarioBruto: body.salarioBruto ? parseFloat(body.salarioBruto) : null,
      situacao: body.situacao,
      observacoes: body.observacoes
    })

    return createSuccessResponse(serializeServidor(novoServidor), 'Servidor criado com sucesso', undefined, 201)
  },
  { permissions: 'financeiro.manage' }
)
