import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { receitasDbService } from '@/lib/services/receitas-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// Schema de validação para query params de receitas
// Enums devem corresponder ao schema Prisma
const ReceitaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  categoria: z.enum(['RECEITA_CORRENTE', 'RECEITA_CAPITAL', 'RECEITA_INTRAORCAMENTARIA']).optional(),
  origem: z.enum(['TRIBUTARIA', 'CONTRIBUICOES', 'PATRIMONIAL', 'SERVICOS', 'TRANSFERENCIAS', 'OUTRAS']).optional(),
  situacao: z.enum(['PREVISTA', 'ARRECADADA', 'PARCIALMENTE_ARRECADADA', 'CANCELADA']).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  contribuinte: z.string().optional(),
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
    const validation = safeParseQueryParams(searchParams, ReceitaQuerySchema)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      page, limit, categoria, origem, situacao,
      ano, mes, contribuinte, valorMinimo, valorMaximo
    } = validation.data

    const result = await receitasDbService.paginate(
      {
        categoria,
        origem,
        situacao,
        ano,
        mes,
        contribuinte,
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
    console.error('Erro ao buscar receitas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  if (!body.categoria || !body.origem || !body.valorArrecadado) {
    return NextResponse.json(
      { success: false, error: 'Campos obrigatorios nao fornecidos (categoria, origem, valorArrecadado)' },
      { status: 400 }
    )
  }

  const dataReceita = body.data ? new Date(body.data) : new Date()

  const novaReceita = await receitasDbService.create({
    numero: body.numero,
    ano: body.ano || dataReceita.getFullYear(),
    mes: body.mes || dataReceita.getMonth() + 1,
    data: dataReceita,
    contribuinte: body.contribuinte,
    cnpjCpf: body.cnpjCpf,
    unidade: body.unidade,
    categoria: body.categoria,
    origem: body.origem,
    especie: body.especie,
    rubrica: body.rubrica,
    valorPrevisto: body.valorPrevisto ? parseFloat(body.valorPrevisto) : null,
    valorArrecadado: parseFloat(body.valorArrecadado),
    situacao: body.situacao,
    fonteRecurso: body.fonteRecurso,
    observacoes: body.observacoes
  })

  return NextResponse.json({
    success: true,
    data: novaReceita,
    message: 'Receita criada com sucesso'
  }, { status: 201 })
}, { permissions: 'financeiro.manage' })
