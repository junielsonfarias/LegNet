import { NextRequest, NextResponse } from 'next/server'
import { servidoresDbService } from '@/lib/services/servidores-db-service'
import { withAuth } from '@/lib/auth/permissions'
import type { SituacaoServidor, VinculoServidor } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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
    console.error('Erro ao buscar servidores:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()

    if (!body.nome || !body.vinculo) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatorios nao fornecidos (nome, vinculo)' },
        { status: 400 }
      )
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

    return NextResponse.json({
      success: true,
      data: novoServidor,
      message: 'Servidor criado com sucesso'
    }, { status: 201 })
  },
  { permissions: 'financeiro.manage' }
)
