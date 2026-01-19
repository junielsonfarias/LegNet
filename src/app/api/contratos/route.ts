import { NextRequest, NextResponse } from 'next/server'
import { contratosDbService } from '@/lib/services/contratos-db-service'
import type { ModalidadeContrato, SituacaoContrato } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modalidade = searchParams.get('modalidade') as ModalidadeContrato | null
    const situacao = searchParams.get('situacao') as SituacaoContrato | null
    const ano = searchParams.get('ano')
    const contratado = searchParams.get('contratado')
    const objeto = searchParams.get('objeto')
    const licitacaoId = searchParams.get('licitacaoId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const valorMinimo = searchParams.get('valorMinimo')
    const valorMaximo = searchParams.get('valorMaximo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await contratosDbService.paginate(
      {
        modalidade: modalidade || undefined,
        situacao: situacao || undefined,
        ano: ano ? parseInt(ano) : undefined,
        contratado: contratado || undefined,
        objeto: objeto || undefined,
        licitacaoId: licitacaoId || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        valorMinimo: valorMinimo ? parseFloat(valorMinimo) : undefined,
        valorMaximo: valorMaximo ? parseFloat(valorMaximo) : undefined
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

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Erro ao criar contrato:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
