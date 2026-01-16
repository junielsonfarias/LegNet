import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import {
  ensureSystemConfigDefaults,
  parseSystemConfigValue,
  serializeSystemConfigValue,
  SYSTEM_CONFIG_DEFAULTS,
  SystemConfigType
} from '@/lib/configuracoes/defaults'

export const dynamic = 'force-dynamic'

const SystemConfigUpdateSchema = z.object({
  configuracoes: z.array(z.object({
    chave: z.string().min(3),
    valor: z.any(),
    tipo: z.enum(['string', 'number', 'boolean', 'json']).optional(),
    descricao: z.string().optional(),
    categoria: z.string().optional(),
    editavel: z.boolean().optional()
  })).min(1)
})

const inferTipoFromValor = (valor: unknown): SystemConfigType => {
  if (typeof valor === 'boolean') return 'boolean'
  if (typeof valor === 'number' && !Number.isNaN(valor)) return 'number'
  if (typeof valor === 'object') return 'json'
  return 'string'
}

const mapToResponse = (config: any) => ({
  ...config,
  valor: parseSystemConfigValue(config),
  updatedAt: config.updatedAt,
  createdAt: config.createdAt
})

export const GET = withAuth(async (request: NextRequest) => {
  await ensureSystemConfigDefaults(prisma)

  const categoria = request.nextUrl.searchParams.get('categoria') ?? undefined
  const prefix = request.nextUrl.searchParams.get('prefix') ?? undefined

  const configuracoes = await prisma.configuracao.findMany({
    where: {
      ...(categoria ? { categoria } : {}),
      ...(prefix ? { chave: { startsWith: prefix } } : {})
    },
    orderBy: { chave: 'asc' }
  })

  return createSuccessResponse(configuracoes.map(mapToResponse), 'Configurações carregadas com sucesso', configuracoes.length)
}, { permissions: 'config.view' })

export const PUT = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const { configuracoes } = SystemConfigUpdateSchema.parse(body)

  await ensureSystemConfigDefaults(prisma)

  const existentes = await prisma.configuracao.findMany()
  const existentesMap = new Map(existentes.map(config => [config.chave, config]))

  const atualizadas = [] as any[]

  for (const config of configuracoes) {
    const atual = existentesMap.get(config.chave)
    const tipo = (config.tipo ?? atual?.tipo ?? inferTipoFromValor(config.valor)) as SystemConfigType

    if (atual && atual.editavel === false) {
      continue
    }

    const serialized = serializeSystemConfigValue(config.valor, tipo)

    const upserted = await prisma.configuracao.upsert({
      where: { chave: config.chave },
      update: {
        valor: serialized,
        tipo,
        descricao: config.descricao ?? atual?.descricao ?? SYSTEM_CONFIG_DEFAULTS.find(d => d.chave === config.chave)?.descricao,
        categoria: config.categoria ?? atual?.categoria ?? SYSTEM_CONFIG_DEFAULTS.find(d => d.chave === config.chave)?.categoria ?? 'Geral',
        editavel: config.editavel ?? atual?.editavel ?? true
      },
      create: {
        chave: config.chave,
        valor: serialized,
        tipo,
        descricao: config.descricao ?? SYSTEM_CONFIG_DEFAULTS.find(d => d.chave === config.chave)?.descricao,
        categoria: config.categoria ?? SYSTEM_CONFIG_DEFAULTS.find(d => d.chave === config.chave)?.categoria ?? 'Geral',
        editavel: config.editavel ?? true
      }
    })

    atualizadas.push(mapToResponse(upserted))
  }

  if (atualizadas.length > 0) {
    await logAudit({
      request,
      session,
      action: 'CONFIGURACAO_SISTEMA_UPDATE',
      entity: 'Configuracao',
      entityId: atualizadas.map(cfg => cfg.id).join(','),
      metadata: {
        chaves: atualizadas.map(cfg => cfg.chave)
      }
    })
  }

  return createSuccessResponse(atualizadas, 'Configurações atualizadas com sucesso', atualizadas.length)
}, { permissions: 'config.manage' })

