import { NextRequest, NextResponse } from 'next/server'
import { automacaoService } from '@/lib/automacao-service'
import { withAuth } from '@/lib/auth/permissions'

// GET - Buscar dados de automação
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')

    if (tipo === 'regras') {
      const regras = automacaoService.getAllRegras()
      return NextResponse.json(regras)
    }

    if (tipo === 'templates') {
      const templates = automacaoService.getAllTemplatesEmail()
      return NextResponse.json(templates)
    }

    if (tipo === 'agendamentos') {
      const agendamentos = automacaoService.getAllAgendamentosPauta()
      return NextResponse.json(agendamentos)
    }

    // Retorna todos os dados
    const regras = automacaoService.getAllRegras()
    const templates = automacaoService.getAllTemplatesEmail()
    const agendamentos = automacaoService.getAllAgendamentosPauta()
    
    return NextResponse.json({
      regras,
      templates,
      agendamentos
    })
  } catch (error) {
    console.error('Erro ao buscar dados de automação:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova regra, template ou agendamento
export const POST = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const data = await request.json()

  if (tipo === 'regra') {
    const regra = automacaoService.createRegra(data)
    return NextResponse.json(regra, { status: 201 })
  }

  if (tipo === 'template') {
    const template = automacaoService.createTemplateEmail(data)
    return NextResponse.json(template, { status: 201 })
  }

  if (tipo === 'agendamento') {
    const agendamento = automacaoService.createAgendamentoPauta(data)
    return NextResponse.json(agendamento, { status: 201 })
  }

  return NextResponse.json(
    { message: 'Tipo não especificado' },
    { status: 400 }
  )
}, { permissions: 'automacao.manage' })

// PUT - Atualizar regra, template ou agendamento
export const PUT = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const id = searchParams.get('id')
  const data = await request.json()

  if (!id) {
    return NextResponse.json(
      { message: 'ID é obrigatório' },
      { status: 400 }
    )
  }

  if (tipo === 'regra') {
    const regra = automacaoService.updateRegra(id, data)
    if (!regra) {
      return NextResponse.json(
        { message: 'Regra não encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(regra)
  }

  if (tipo === 'template') {
    const template = automacaoService.updateTemplateEmail(id, data)
    if (!template) {
      return NextResponse.json(
        { message: 'Template não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(template)
  }

  if (tipo === 'agendamento') {
    const agendamento = automacaoService.updateAgendamentoPauta(id, data)
    if (!agendamento) {
      return NextResponse.json(
        { message: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(agendamento)
  }

  return NextResponse.json(
    { message: 'Tipo não especificado' },
    { status: 400 }
  )
}, { permissions: 'automacao.manage' })

// DELETE - Deletar regra, template ou agendamento
export const DELETE = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { message: 'ID é obrigatório' },
      { status: 400 }
    )
  }

  if (tipo === 'regra') {
    const deleted = automacaoService.deleteRegra(id)
    if (!deleted) {
      return NextResponse.json(
        { message: 'Regra não encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json({ message: 'Regra deletada com sucesso' })
  }

  if (tipo === 'template') {
    const deleted = automacaoService.deleteTemplateEmail(id)
    if (!deleted) {
      return NextResponse.json(
        { message: 'Template não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json({ message: 'Template deletado com sucesso' })
  }

  if (tipo === 'agendamento') {
    const deleted = automacaoService.deleteAgendamentoPauta(id)
    if (!deleted) {
      return NextResponse.json(
        { message: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json({ message: 'Agendamento deletado com sucesso' })
  }

  return NextResponse.json(
    { message: 'Tipo não especificado' },
    { status: 400 }
  )
}, { permissions: 'automacao.manage' })
