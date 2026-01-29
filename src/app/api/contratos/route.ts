import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { contratosDbService } from '@/lib/services/contratos-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// Schema de validação para query params de contratos
// Enums devem corresponder ao schema Prisma
const ContratoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  modalidade: z.enum(['CONTRATO_ORIGINAL', 'ADITIVO', 'APOSTILAMENTO', 'RESCISAO']).optional(),
  situacao: z.enum(['VIGENTE', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO']).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  contratado: z.string().optional(),
  objeto: z.string().optional(),
  licitacaoId: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
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
    const validation = safeParseQueryParams(searchParams, ContratoQuerySchema)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      page, limit, modalidade, situacao, ano, contratado,
      objeto, licitacaoId, dataInicio, dataFim, valorMinimo, valorMaximo
    } = validation.data

    const result = await contratosDbService.paginate(
      {
        modalidade,
        situacao,
        ano,
        contratado,
        objeto,
        licitacaoId,
        dataInicio,
        dataFim,
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
    console.error('Erro ao buscar contratos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  if (!body.numero || !body.objeto || !body.contratado || !body.valorTotal || !body.dataAssinatura) {
    return NextResponse.json(
      { success: false, error: 'Campos obrigatorios nao fornecidos' },
      { status: 400 }
    )
  }

  const novoContrato = await contratosDbService.create({
    numero: body.numero,
    ano: body.ano || new Date(body.dataAssinatura).getFullYear(),
    modalidade: body.modalidade || 'OUTROS',
    objeto: body.objeto,
    contratado: body.contratado,
    cnpjCpf: body.cnpjCpf,
    valorTotal: parseFloat(body.valorTotal),
    dataAssinatura: body.dataAssinatura,
    vigenciaInicio: body.vigenciaInicio || body.dataAssinatura,
    vigenciaFim: body.vigenciaFim,
    fiscalContrato: body.fiscalContrato,
    situacao: body.situacao,
    licitacaoId: body.licitacaoId,
    arquivo: body.arquivo,
    observacoes: body.observacoes
  })

  return NextResponse.json({
    success: true,
    data: novoContrato,
    message: 'Contrato criado com sucesso'
  }, { status: 201 })
}, { permissions: 'financeiro.manage' })
