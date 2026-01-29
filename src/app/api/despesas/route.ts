import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { despesasDbService } from '@/lib/services/despesas-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// Schema de validação para query params de despesas
// Enums devem corresponder ao schema Prisma
const DespesaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  situacao: z.enum(['EMPENHADA', 'LIQUIDADA', 'PAGA', 'ANULADA', 'PARCIALMENTE_PAGA']).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  credor: z.string().optional(),
  elemento: z.string().optional(),
  funcao: z.string().optional(),
  programa: z.string().optional(),
  licitacaoId: z.string().optional(),
  contratoId: z.string().optional(),
  convenioId: z.string().optional(),
  valorMinimo: z.coerce.number().min(0).optional(),
  valorMaximo: z.coerce.number().min(0).optional()
}).refine(
  data => !data.valorMinimo || !data.valorMaximo || data.valorMinimo <= data.valorMaximo,
  { message: 'valorMinimo deve ser menor ou igual a valorMaximo' }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Validar query params com Zod
    const validation = safeParseQueryParams(searchParams, DespesaQuerySchema)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      page, limit, situacao, ano, mes, credor, elemento,
      funcao, programa, licitacaoId, contratoId, convenioId,
      valorMinimo, valorMaximo
    } = validation.data

    const result = await despesasDbService.paginate(
      {
        situacao,
        ano,
        mes,
        credor,
        elemento,
        funcao,
        programa,
        licitacaoId,
        contratoId,
        convenioId,
        valorMinimo,
        valorMaximo
      },
      { page, limit }
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'X-Total-Count': result.pagination.total.toString()
      }
    })
  } catch (error) {
    console.error('Erro ao buscar despesas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()

    if (!body.numeroEmpenho || !body.credor || !body.valorEmpenhado) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatorios nao fornecidos (numeroEmpenho, credor, valorEmpenhado)' },
        { status: 400 }
      )
    }

    const dataDespesa = body.data ? new Date(body.data) : new Date()

    const novaDespesa = await despesasDbService.create({
      numeroEmpenho: body.numeroEmpenho,
      ano: body.ano || dataDespesa.getFullYear(),
      mes: body.mes || dataDespesa.getMonth() + 1,
      data: dataDespesa,
      credor: body.credor,
      cnpjCpf: body.cnpjCpf,
      unidade: body.unidade,
      elemento: body.elemento,
      funcao: body.funcao,
      subfuncao: body.subfuncao,
      programa: body.programa,
      acao: body.acao,
      valorEmpenhado: parseFloat(body.valorEmpenhado),
      valorLiquidado: body.valorLiquidado ? parseFloat(body.valorLiquidado) : null,
      valorPago: body.valorPago ? parseFloat(body.valorPago) : null,
      situacao: body.situacao,
      fonteRecurso: body.fonteRecurso,
      modalidade: body.modalidade,
      licitacaoId: body.licitacaoId,
      contratoId: body.contratoId,
      convenioId: body.convenioId,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: novaDespesa,
      message: 'Despesa criada com sucesso'
    }, { status: 201 })
  },
  { permissions: 'financeiro.manage' }
)
