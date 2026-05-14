import { NextRequest } from 'next/server'
import { servidoresDbService, serializeServidor, serializeServidores } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { CreateServidorSchema } from '@/lib/validation/servidor-schema'
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

    // F1.3 — validacao Zod (antes passava cru ao service)
    const parsed = CreateServidorSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
    }
    const data = parsed.data

    const novoServidor = await servidoresDbService.create({
      nome: data.nome,
      cpf: data.cpf ?? null,
      matricula: data.matricula ?? null,
      cargo: data.cargo ?? null,
      funcao: data.funcao ?? null,
      unidade: data.unidade ?? null,
      lotacao: data.lotacao ?? null,
      vinculo: data.vinculo,
      dataAdmissao: data.dataAdmissao ?? null,
      dataDesligamento: data.dataDesligamento ?? null,
      salarioBruto: data.salarioBruto ?? null,
      situacao: data.situacao,
      observacoes: data.observacoes ?? null,
    })

    return createSuccessResponse(serializeServidor(novoServidor), 'Servidor criado com sucesso', undefined, 201)
  },
  { permissions: 'financeiro.manage' }
)
