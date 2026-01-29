import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { auditoriaService } from '@/lib/auditoria-service'
import { withAuth } from '@/lib/auth/permissions'
import { authOptions } from '@/lib/auth'

// Schema para validação de query params
const AuditoriaQuerySchema = z.object({
  tipo: z.enum(['eventos', 'recentes', 'erros', 'usuario', 'suspeitos', 'estatisticas', 'relatorios', 'export']).optional(),
  limite: z.coerce.number().int().min(1).max(1000).default(50),
  formato: z.enum(['json', 'csv']).default('json'),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  usuarioId: z.string().optional(),
  acao: z.string().optional(),
  entidade: z.string().optional(),
  entidadeId: z.string().optional(),
  sucesso: z.coerce.boolean().optional(),
  ip: z.string().optional()
})

// GET - Buscar eventos de auditoria (REQUER AUTENTICAÇÃO - dados sensíveis)
export async function GET(request: Request) {
  try {
    // Verificar autenticação - auditoria contém dados sensíveis
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Autenticação necessária para acessar auditoria' },
        { status: 401 }
      )
    }

    // Verificar se é ADMIN ou SECRETARIA (únicos que podem ver auditoria)
    const role = session.user?.role
    if (role !== 'ADMIN' && role !== 'SECRETARIA') {
      return NextResponse.json(
        { success: false, error: 'Permissão negada para acessar auditoria' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Validar parâmetros com Zod
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const validation = AuditoriaQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { tipo, limite, formato, dataInicio, dataFim, usuarioId, acao, entidade, entidadeId, sucesso, ip } = validation.data

    const filtros: {
      dataInicio?: Date
      dataFim?: Date
      usuarioId?: string
      acao?: string
      entidade?: string
      entidadeId?: string
      sucesso?: boolean
      ip?: string
    } = {}

    if (dataInicio) filtros.dataInicio = new Date(dataInicio)
    if (dataFim) filtros.dataFim = new Date(dataFim)
    if (usuarioId) filtros.usuarioId = usuarioId
    if (acao) filtros.acao = acao
    if (entidade) filtros.entidade = entidade
    if (entidadeId) filtros.entidadeId = entidadeId
    if (sucesso !== undefined) filtros.sucesso = sucesso
    if (ip) filtros.ip = ip

    if (tipo === 'eventos') {
      const eventos = auditoriaService.getEventos(filtros)
      return NextResponse.json({ success: true, data: eventos })
    }

    if (tipo === 'recentes') {
      const eventos = auditoriaService.getEventosRecentes(limite)
      return NextResponse.json({ success: true, data: eventos })
    }

    if (tipo === 'erros') {
      const eventos = auditoriaService.getEventosComErro(limite)
      return NextResponse.json({ success: true, data: eventos })
    }

    if (tipo === 'usuario') {
      if (!filtros.usuarioId) {
        return NextResponse.json(
          { success: false, error: 'usuarioId é obrigatório para tipo=usuario' },
          { status: 400 }
        )
      }
      const eventos = auditoriaService.getAtividadeUsuario(filtros.usuarioId, limite)
      return NextResponse.json({ success: true, data: eventos })
    }

    if (tipo === 'suspeitos') {
      const eventos = auditoriaService.detectarAtividadeSuspeita()
      return NextResponse.json({ success: true, data: eventos })
    }

    if (tipo === 'estatisticas') {
      const estatisticas = auditoriaService.gerarEstatisticas(filtros)
      return NextResponse.json({ success: true, data: estatisticas })
    }

    if (tipo === 'relatorios') {
      const relatorios = auditoriaService.getAllRelatorios()
      return NextResponse.json({ success: true, data: relatorios })
    }

    if (tipo === 'export') {
      const dados = auditoriaService.exportarEventos(filtros, formato)

      const headers = new Headers()
      headers.set('Content-Type', formato === 'csv' ? 'text/csv' : 'application/json')
      headers.set('Content-Disposition', `attachment; filename=auditoria_${new Date().toISOString().split('T')[0]}.${formato}`)

      return new Response(dados, { headers })
    }

    // Retorna eventos recentes com paginação por padrão (nunca retorna TODOS)
    const eventos = auditoriaService.getEventosRecentes(limite)
    return NextResponse.json({ success: true, data: eventos })
  } catch (error) {
    console.error('Erro ao buscar dados de auditoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Registrar novo evento ou criar relatório
export const POST = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const data = await request.json()

  if (tipo === 'evento') {
    const evento = auditoriaService.registrarEvento(data)
    return NextResponse.json({ success: true, data: evento }, { status: 201 })
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
    return NextResponse.json({ success: true, data: evento }, { status: 201 })
  }

  if (tipo === 'logout') {
    const evento = auditoriaService.registrarLogout(
      data.usuarioId,
      data.usuarioNome,
      data.ip,
      data.userAgent
    )
    return NextResponse.json({ success: true, data: evento }, { status: 201 })
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
    return NextResponse.json({ success: true, data: evento }, { status: 201 })
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
    return NextResponse.json({ success: true, data: evento }, { status: 201 })
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
    return NextResponse.json({ success: true, data: evento }, { status: 201 })
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
    return NextResponse.json({ success: true, data: evento }, { status: 201 })
  }

  if (tipo === 'relatorio') {
    const relatorio = auditoriaService.criarRelatorio(
      data.nome,
      data.descricao,
      data.filtros,
      data.geradoPor
    )
    return NextResponse.json({ success: true, data: relatorio }, { status: 201 })
  }

  return NextResponse.json(
    { success: false, error: 'Tipo não especificado' },
    { status: 400 }
  )
}, { permissions: 'audit.manage' })

// PUT - Atualizar relatório
export const PUT = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const data = await request.json()

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID é obrigatório' },
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
      { success: false, error: 'Relatório não encontrado' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: relatorio })
}, { permissions: 'audit.manage' })

// DELETE - Limpar eventos antigos
export const DELETE = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const diasParam = searchParams.get('dias')

  // Validar parâmetro dias
  const dias = diasParam ? parseInt(diasParam, 10) : 90
  if (isNaN(dias) || dias < 1 || dias > 365) {
    return NextResponse.json(
      { success: false, error: 'dias deve ser um número entre 1 e 365' },
      { status: 400 }
    )
  }

  const eventosRemovidos = auditoriaService.limparEventosAntigos(dias)

  return NextResponse.json({
    success: true,
    message: `${eventosRemovidos} eventos antigos removidos`,
    eventosRemovidos
  })
}, { permissions: 'audit.manage' })
