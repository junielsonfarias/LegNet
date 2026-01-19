import { NextRequest, NextResponse } from 'next/server'
import { conveniosDbService } from '@/lib/services/convenios-db-service'
import type { SituacaoConvenio } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const situacao = searchParams.get('situacao') as SituacaoConvenio | null
    const ano = searchParams.get('ano')
    const convenente = searchParams.get('convenente')
    const orgaoConcedente = searchParams.get('orgaoConcedente')
    const objeto = searchParams.get('objeto')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const valorMinimo = searchParams.get('valorMinimo')
    const valorMaximo = searchParams.get('valorMaximo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await conveniosDbService.paginate(
      {
        situacao: situacao || undefined,
        ano: ano ? parseInt(ano) : undefined,
        convenente: convenente || undefined,
        orgaoConcedente: orgaoConcedente || undefined,
        objeto: objeto || undefined,
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
    console.error('Erro ao buscar convenios:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.numero || !body.convenente || !body.orgaoConcedente || !body.objeto || !body.valorTotal) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatorios nao fornecidos' },
        { status: 400 }
      )
    }

    const novoConvenio = await conveniosDbService.create({
      numero: body.numero,
      ano: body.ano || new Date().getFullYear(),
      convenente: body.convenente,
      cnpjConvenente: body.cnpjConvenente,
      orgaoConcedente: body.orgaoConcedente,
      objeto: body.objeto,
      programa: body.programa,
      acao: body.acao,
      valorTotal: parseFloat(body.valorTotal),
      valorRepasse: body.valorRepasse ? parseFloat(body.valorRepasse) : null,
      valorContrapartida: body.valorContrapartida ? parseFloat(body.valorContrapartida) : null,
      dataCelebracao: body.dataCelebracao || new Date().toISOString(),
      vigenciaInicio: body.vigenciaInicio || body.dataCelebracao,
      vigenciaFim: body.vigenciaFim,
      responsavelTecnico: body.responsavelTecnico,
      situacao: body.situacao,
      fonteRecurso: body.fonteRecurso,
      arquivo: body.arquivo,
      observacoes: body.observacoes
    })

    return NextResponse.json({
      success: true,
      data: novoConvenio,
      message: 'Convenio criado com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar convenio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
