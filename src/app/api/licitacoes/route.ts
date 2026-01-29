import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { licitacoesDbService } from '@/lib/services/licitacoes-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { safeParseQueryParams } from '@/lib/validation/query-schemas'

export const dynamic = 'force-dynamic'

// Schema de validação para query params de licitações
// Enums devem corresponder ao schema Prisma
const LicitacaoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  modalidade: z.enum(['PREGAO_ELETRONICO', 'PREGAO_PRESENCIAL', 'CONCORRENCIA', 'TOMADA_DE_PRECOS', 'CONVITE', 'CONCURSO', 'LEILAO', 'DISPENSA', 'INEXIGIBILIDADE']).optional(),
  situacao: z.enum(['EM_ANDAMENTO', 'HOMOLOGADA', 'ADJUDICADA', 'REVOGADA', 'ANULADA', 'DESERTA', 'FRACASSADA', 'SUSPENSA']).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  objeto: z.string().optional(),
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
    const validation = safeParseQueryParams(searchParams, LicitacaoQuerySchema)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      page, limit, modalidade, situacao, ano,
      objeto, dataInicio, dataFim, valorMinimo, valorMaximo
    } = validation.data

    const result = await licitacoesDbService.paginate(
      {
        modalidade,
        situacao,
        ano,
        objeto,
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
    console.error('Erro ao buscar licitacoes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Validacao basica
  if (!body.numero || !body.objeto || !body.modalidade || !body.dataAbertura) {
    return NextResponse.json(
      { success: false, error: 'Campos obrigatorios nao fornecidos (numero, objeto, modalidade, dataAbertura)' },
      { status: 400 }
    )
  }

  const novaLicitacao = await licitacoesDbService.create({
    numero: body.numero,
    ano: body.ano || new Date(body.dataAbertura).getFullYear(),
    modalidade: body.modalidade,
    tipo: body.tipo,
    objeto: body.objeto,
    valorEstimado: body.valorEstimado ? parseFloat(body.valorEstimado) : null,
    dataPublicacao: body.dataPublicacao,
    dataAbertura: body.dataAbertura,
    horaAbertura: body.horaAbertura,
    dataEntregaPropostas: body.dataEntregaPropostas,
    situacao: body.situacao,
    unidadeGestora: body.unidadeGestora,
    linkEdital: body.linkEdital,
    observacoes: body.observacoes
  })

  return NextResponse.json({
    success: true,
    data: novaLicitacao,
    message: 'Licitacao criada com sucesso'
  }, { status: 201 })
}, { permissions: 'financeiro.manage' })
