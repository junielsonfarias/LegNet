import { NextRequest, NextResponse } from 'next/server'
import { licitacoesService } from '@/lib/licitacoes-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modalidade = searchParams.get('modalidade')
    const status = searchParams.get('status')
    const ano = searchParams.get('ano')
    const objeto = searchParams.get('objeto')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const valorMinimo = searchParams.get('valorMinimo')
    const valorMaximo = searchParams.get('valorMaximo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let licitacoes = licitacoesService.getAll()

    // Aplicar filtros
    if (modalidade) {
      licitacoes = licitacoes.filter(l => 
        l.modalidade.toLowerCase().includes(modalidade.toLowerCase())
      )
    }

    if (status) {
      licitacoes = licitacoes.filter(l => 
        l.status.toLowerCase() === status.toLowerCase()
      )
    }

    if (ano) {
      licitacoes = licitacoes.filter(l => 
        new Date(l.dataAbertura).getFullYear().toString() === ano
      )
    }

    if (objeto) {
      licitacoes = licitacoes.filter(l => 
        l.objeto.toLowerCase().includes(objeto.toLowerCase())
      )
    }

    if (dataInicio) {
      const inicio = new Date(dataInicio)
      licitacoes = licitacoes.filter(l => new Date(l.dataAbertura) >= inicio)
    }

    if (dataFim) {
      const fim = new Date(dataFim)
      licitacoes = licitacoes.filter(l => new Date(l.dataAbertura) <= fim)
    }

    if (valorMinimo) {
      const valorMin = parseFloat(valorMinimo)
      licitacoes = licitacoes.filter(l => l.valorEstimado >= valorMin)
    }

    if (valorMaximo) {
      const valorMax = parseFloat(valorMaximo)
      licitacoes = licitacoes.filter(l => l.valorEstimado <= valorMax)
    }

    // Ordenar por data de abertura (mais recentes primeiro)
    licitacoes.sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())

    // Paginação
    const total = licitacoes.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedLicitacoes = licitacoes.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: paginatedLicitacoes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'X-Total-Count': total.toString()
      }
    })

  } catch (error) {
    console.error('Erro ao buscar licitações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação básica
    if (!body.numero || !body.objeto || !body.modalidade || !body.valorEstimado) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    const novaLicitacao = licitacoesService.create({
      numero: body.numero,
      objeto: body.objeto,
      modalidade: body.modalidade,
      valorEstimado: parseFloat(body.valorEstimado),
      dataAbertura: body.dataAbertura || new Date().toISOString().split('T')[0],
      dataEncerramento: body.dataEncerramento || new Date().toISOString().split('T')[0],
      status: (body.status || 'ABERTA') as 'ABERTA' | 'ENCERRADA' | 'CANCELADA' | 'SUSPENSA',
      orgao: body.orgao || 'Câmara Municipal',
      edital: body.edital || undefined
    })

    return NextResponse.json({
      success: true,
      data: novaLicitacao,
      message: 'Licitação criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar licitação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
