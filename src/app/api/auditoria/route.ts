import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auditoriaService } from '@/lib/auditoria-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'

// Schema para validação de query params
const AuditoriaQuerySchema = z.object({
  tipo: z.enum(['eventos', 'recentes', 'erros', 'usuario', 'suspeitos', 'estatisticas', 'relatorios', 'export']).nullish().transform(v => v ?? undefined),
  limite: z.coerce.number().int().min(1).max(1000).default(50),
  formato: z.enum(['json', 'csv']).default('json'),
  dataInicio: z.string().datetime().nullish().transform(v => v ?? undefined),
  dataFim: z.string().datetime().nullish().transform(v => v ?? undefined),
  usuarioId: z.string().nullish().transform(v => v ?? undefined),
  acao: z.string().nullish().transform(v => v ?? undefined),
  entidade: z.string().nullish().transform(v => v ?? undefined),
  entidadeId: z.string().nullish().transform(v => v ?? undefined),
  sucesso: z.coerce.boolean().optional(),
  ip: z.string().nullish().transform(v => v ?? undefined)
})

// GET - Buscar eventos de auditoria (REQUER AUTENTICAÇÃO - dados sensíveis)
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // Validar parâmetros com Zod
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const validation = AuditoriaQuerySchema.safeParse(params)
  if (!validation.success) {
    throw new ValidationError('Parâmetros inválidos', validation.error.errors)
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
    return createSuccessResponse(eventos)
  }

  if (tipo === 'recentes') {
    const eventos = auditoriaService.getEventosRecentes(limite)
    return createSuccessResponse(eventos)
  }

  if (tipo === 'erros') {
    const eventos = auditoriaService.getEventosComErro(limite)
    return createSuccessResponse(eventos)
  }

  if (tipo === 'usuario') {
    if (!filtros.usuarioId) {
      throw new ValidationError('usuarioId é obrigatório para tipo=usuario')
    }
    const eventos = auditoriaService.getAtividadeUsuario(filtros.usuarioId, limite)
    return createSuccessResponse(eventos)
  }

  if (tipo === 'suspeitos') {
    const eventos = auditoriaService.detectarAtividadeSuspeita()
    return createSuccessResponse(eventos)
  }

  if (tipo === 'estatisticas') {
    const estatisticas = auditoriaService.gerarEstatisticas(filtros)
    return createSuccessResponse(estatisticas)
  }

  if (tipo === 'relatorios') {
    const relatorios = auditoriaService.getAllRelatorios()
    return createSuccessResponse(relatorios)
  }

  if (tipo === 'export') {
    const dados = auditoriaService.exportarEventos(filtros, formato)

    const headers = new Headers()
    headers.set('Content-Type', formato === 'csv' ? 'text/csv' : 'application/json')
    headers.set('Content-Disposition', `attachment; filename=auditoria_${new Date().toISOString().split('T')[0]}.${formato}`)

    return new NextResponse(dados, { headers })
  }

  // Retorna eventos recentes com paginação por padrão (nunca retorna TODOS)
  const eventos = auditoriaService.getEventosRecentes(limite)
  return createSuccessResponse(eventos)
}, { roles: ['ADMIN', 'SECRETARIA'], permissions: 'audit.view' })

// POST - Registrar novo evento ou criar relatório
export const POST = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const data = await request.json()

  if (tipo === 'evento') {
    const evento = auditoriaService.registrarEvento(data)
    return createSuccessResponse(evento, 'Evento registrado', undefined, 201)
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
    return createSuccessResponse(evento, undefined, undefined, 201)
  }

  if (tipo === 'logout') {
    const evento = auditoriaService.registrarLogout(
      data.usuarioId,
      data.usuarioNome,
      data.ip,
      data.userAgent
    )
    return createSuccessResponse(evento, undefined, undefined, 201)
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
    return createSuccessResponse(evento, undefined, undefined, 201)
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
    return createSuccessResponse(evento, undefined, undefined, 201)
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
    return createSuccessResponse(evento, undefined, undefined, 201)
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
    return createSuccessResponse(evento, undefined, undefined, 201)
  }

  if (tipo === 'relatorio') {
    const relatorio = auditoriaService.criarRelatorio(
      data.nome,
      data.descricao,
      data.filtros,
      data.geradoPor
    )
    return createSuccessResponse(relatorio, undefined, undefined, 201)
  }

  throw new ValidationError('Tipo não especificado')
}, { roles: ['ADMIN', 'SECRETARIA'], permissions: 'audit.manage' })

// PUT - Atualizar relatório
export const PUT = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const data = await request.json()

  if (!id) {
    throw new ValidationError('ID é obrigatório')
  }

  const relatorio = auditoriaService.atualizarStatusRelatorio(
    id,
    data.status,
    data.arquivo
  )

  if (!relatorio) {
    throw new (await import('@/lib/error-handler')).NotFoundError('Relatório')
  }

  return createSuccessResponse(relatorio)
}, { permissions: 'audit.manage' })

// DELETE - Limpar eventos antigos
export const DELETE = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const diasParam = searchParams.get('dias')

  // Validar parâmetro dias
  const dias = diasParam ? parseInt(diasParam, 10) : 90
  if (isNaN(dias) || dias < 1 || dias > 365) {
    throw new ValidationError('dias deve ser um número entre 1 e 365')
  }

  const eventosRemovidos = auditoriaService.limparEventosAntigos(dias)

  return createSuccessResponse(
    { eventosRemovidos },
    `${eventosRemovidos} eventos antigos removidos`
  )
}, { permissions: 'audit.manage' })
