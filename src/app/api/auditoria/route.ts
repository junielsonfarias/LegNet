import { NextResponse } from 'next/server'
import { auditoriaService } from '@/lib/auditoria-service'

// GET - Buscar eventos de auditoria
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const usuarioId = searchParams.get('usuarioId')
    const acao = searchParams.get('acao')
    const entidade = searchParams.get('entidade')
    const entidadeId = searchParams.get('entidadeId')
    const sucesso = searchParams.get('sucesso')
    const ip = searchParams.get('ip')

    const filtros: any = {}

    if (dataInicio) filtros.dataInicio = new Date(dataInicio)
    if (dataFim) filtros.dataFim = new Date(dataFim)
    if (usuarioId) filtros.usuarioId = usuarioId
    if (acao) filtros.acao = acao
    if (entidade) filtros.entidade = entidade
    if (entidadeId) filtros.entidadeId = entidadeId
    if (sucesso !== null) filtros.sucesso = sucesso === 'true'
    if (ip) filtros.ip = ip

    if (tipo === 'eventos') {
      const eventos = auditoriaService.getEventos(filtros)
      return NextResponse.json(eventos)
    }

    if (tipo === 'recentes') {
      const limite = parseInt(searchParams.get('limite') || '50')
      const eventos = auditoriaService.getEventosRecentes(limite)
      return NextResponse.json(eventos)
    }

    if (tipo === 'erros') {
      const limite = parseInt(searchParams.get('limite') || '20')
      const eventos = auditoriaService.getEventosComErro(limite)
      return NextResponse.json(eventos)
    }

    if (tipo === 'usuario') {
      const limite = parseInt(searchParams.get('limite') || '20')
      const eventos = auditoriaService.getAtividadeUsuario(filtros.usuarioId!, limite)
      return NextResponse.json(eventos)
    }

    if (tipo === 'suspeitos') {
      const eventos = auditoriaService.detectarAtividadeSuspeita()
      return NextResponse.json(eventos)
    }

    if (tipo === 'estatisticas') {
      const estatisticas = auditoriaService.gerarEstatisticas(filtros)
      return NextResponse.json(estatisticas)
    }

    if (tipo === 'relatorios') {
      const relatorios = auditoriaService.getAllRelatorios()
      return NextResponse.json(relatorios)
    }

    if (tipo === 'export') {
      const formato = searchParams.get('formato') as 'json' | 'csv' || 'json'
      const dados = auditoriaService.exportarEventos(filtros, formato)
      
      const headers = new Headers()
      headers.set('Content-Type', formato === 'csv' ? 'text/csv' : 'application/json')
      headers.set('Content-Disposition', `attachment; filename=auditoria_${new Date().toISOString().split('T')[0]}.${formato}`)
      
      return new Response(dados, { headers })
    }

    // Retorna todos os eventos se não especificado
    const eventos = auditoriaService.getAllEventos()
    return NextResponse.json(eventos)
  } catch (error) {
    console.error('Erro ao buscar dados de auditoria:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Registrar novo evento ou criar relatório
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const data = await request.json()

    if (tipo === 'evento') {
      const evento = auditoriaService.registrarEvento(data)
      return NextResponse.json(evento, { status: 201 })
    }

    if (tipo === 'login') {
      const evento = auditoriaService.registrarLogin(
        data.usuarioId,
        data.usuarioNome,
        data.sucesso,
        data.ip,
        data.userAgent,
        data.erro
      )
      return NextResponse.json(evento, { status: 201 })
    }

    if (tipo === 'logout') {
      const evento = auditoriaService.registrarLogout(
        data.usuarioId,
        data.usuarioNome,
        data.ip,
        data.userAgent
      )
      return NextResponse.json(evento, { status: 201 })
    }

    if (tipo === 'criacao') {
      const evento = auditoriaService.registrarCriacao(
        data.usuarioId,
        data.usuarioNome,
        data.entidade,
        data.entidadeId,
        data.dados,
        data.ip,
        data.userAgent
      )
      return NextResponse.json(evento, { status: 201 })
    }

    if (tipo === 'atualizacao') {
      const evento = auditoriaService.registrarAtualizacao(
        data.usuarioId,
        data.usuarioNome,
        data.entidade,
        data.entidadeId,
        data.dadosAnteriores,
        data.dadosNovos,
        data.ip,
        data.userAgent
      )
      return NextResponse.json(evento, { status: 201 })
    }

    if (tipo === 'exclusao') {
      const evento = auditoriaService.registrarExclusao(
        data.usuarioId,
        data.usuarioNome,
        data.entidade,
        data.entidadeId,
        data.dadosAnteriores,
        data.ip,
        data.userAgent
      )
      return NextResponse.json(evento, { status: 201 })
    }

    if (tipo === 'erro') {
      const evento = auditoriaService.registrarErro(
        data.usuarioId,
        data.usuarioNome,
        data.acao,
        data.entidade,
        data.entidadeId,
        data.erro,
        data.ip,
        data.userAgent
      )
      return NextResponse.json(evento, { status: 201 })
    }

    if (tipo === 'relatorio') {
      const relatorio = auditoriaService.criarRelatorio(
        data.nome,
        data.descricao,
        data.filtros,
        data.geradoPor
      )
      return NextResponse.json(relatorio, { status: 201 })
    }

    return NextResponse.json(
      { message: 'Tipo não especificado' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro ao processar evento de auditoria:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar relatório
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const data = await request.json()

    if (!id) {
      return NextResponse.json(
        { message: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const relatorio = auditoriaService.atualizarStatusRelatorio(
      id,
      data.status,
      data.arquivo
    )

    if (!relatorio) {
      return NextResponse.json(
        { message: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(relatorio)
  } catch (error) {
    console.error('Erro ao atualizar relatório:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Limpar eventos antigos
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dias = parseInt(searchParams.get('dias') || '90')

    const eventosRemovidos = auditoriaService.limparEventosAntigos(dias)
    
    return NextResponse.json({
      message: `${eventosRemovidos} eventos antigos removidos`,
      eventosRemovidos
    })
  } catch (error) {
    console.error('Erro ao limpar eventos antigos:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
