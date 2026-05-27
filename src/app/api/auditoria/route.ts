import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auditoriaService } from '@/lib/auditoria-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import {
  TipoOperacaoEnum,
  auditoriaPostSchemas,
  AtualizarRelatorioSchema,
} from '@/lib/validation/auditoria-schema'

// Schema para validação de query params
const AuditoriaQuerySchema = z.object({
  tipo: z.enum(['eventos', 'recentes', 'erros', 'usuario', 'suspeitos', 'estatisticas', 'relatorios', 'export']).nullish().transform(v => v ?? undefined),
  limite: z.coerce.number().int().min(1).max(500).default(50),
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
// F1.3 — todo payload agora valida via Zod schema por tipo
export const POST = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipoRaw = searchParams.get('tipo')
  const tipoParsed = TipoOperacaoEnum.safeParse(tipoRaw)
  if (!tipoParsed.success) {
    throw new ValidationError(`tipo invalido: ${tipoRaw}. Aceitos: ${TipoOperacaoEnum.options.join(', ')}`)
  }
  const tipo = tipoParsed.data

  const rawBody = await request.json()
  const schema = auditoriaPostSchemas[tipo]
  const parsed = schema.safeParse(rawBody)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
  }
  const data = parsed.data

  switch (tipo) {
    case 'evento':
      return createSuccessResponse(auditoriaService.registrarEvento(data as any), 'Evento registrado', undefined, 201)
    case 'login': {
      const d = data as z.infer<typeof auditoriaPostSchemas.login>
      return createSuccessResponse(
        auditoriaService.registrarLogin(d.usuarioId, d.usuarioNome, d.sucesso, d.ip, d.userAgent, d.erro),
        undefined,
        undefined,
        201,
      )
    }
    case 'logout': {
      const d = data as z.infer<typeof auditoriaPostSchemas.logout>
      return createSuccessResponse(
        auditoriaService.registrarLogout(d.usuarioId, d.usuarioNome, d.ip, d.userAgent),
        undefined,
        undefined,
        201,
      )
    }
    case 'criacao': {
      const d = data as z.infer<typeof auditoriaPostSchemas.criacao>
      return createSuccessResponse(
        auditoriaService.registrarCriacao(d.usuarioId, d.usuarioNome, d.entidade, d.entidadeId, d.dados, d.ip, d.userAgent),
        undefined,
        undefined,
        201,
      )
    }
    case 'atualizacao': {
      const d = data as z.infer<typeof auditoriaPostSchemas.atualizacao>
      return createSuccessResponse(
        auditoriaService.registrarAtualizacao(
          d.usuarioId,
          d.usuarioNome,
          d.entidade,
          d.entidadeId,
          d.dadosAnteriores,
          d.dadosNovos,
          d.ip,
          d.userAgent,
        ),
        undefined,
        undefined,
        201,
      )
    }
    case 'exclusao': {
      const d = data as z.infer<typeof auditoriaPostSchemas.exclusao>
      return createSuccessResponse(
        auditoriaService.registrarExclusao(d.usuarioId, d.usuarioNome, d.entidade, d.entidadeId, d.dadosAnteriores, d.ip, d.userAgent),
        undefined,
        undefined,
        201,
      )
    }
    case 'erro': {
      const d = data as z.infer<typeof auditoriaPostSchemas.erro>
      return createSuccessResponse(
        auditoriaService.registrarErro(d.usuarioId, d.usuarioNome, d.acao, d.entidade, d.entidadeId, d.erro, d.ip, d.userAgent),
        undefined,
        undefined,
        201,
      )
    }
    case 'relatorio': {
      const d = data as z.infer<typeof auditoriaPostSchemas.relatorio>
      return createSuccessResponse(
        auditoriaService.criarRelatorio(d.nome, d.descricao ?? '', d.filtros ?? {}, d.geradoPor),
        undefined,
        undefined,
        201,
      )
    }
  }
}, { roles: ['ADMIN', 'SECRETARIA'], permissions: 'audit.manage' })

// PUT - Atualizar relatório
export const PUT = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('ID é obrigatório')
  }

  const rawBody = await request.json()
  const parsed = AtualizarRelatorioSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
  }
  const data = parsed.data

  const relatorio = auditoriaService.atualizarStatusRelatorio(id, data.status, data.arquivo)

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
