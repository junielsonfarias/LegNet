import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { configuracaoDbService, type RestoreSistemaConfig } from '@/lib/services/configuracao-db-service'
import {
  ensureSystemConfigDefaults,
  SystemConfigType
} from '@/lib/configuracoes/defaults'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ConfiguracaoInstitucionalSchema = z.object({
  nomeCasa: z.string().min(3),
  sigla: z.string().nullish().transform(v => v ?? undefined),
  cnpj: z.string().nullish().transform(v => v ?? undefined),
  enderecoLogradouro: z.string().nullish().transform(v => v ?? undefined),
  enderecoNumero: z.string().nullish().transform(v => v ?? undefined),
  enderecoBairro: z.string().nullish().transform(v => v ?? undefined),
  enderecoCidade: z.string().nullish().transform(v => v ?? undefined),
  enderecoEstado: z.string().nullish().transform(v => v ?? undefined),
  enderecoCep: z.string().nullish().transform(v => v ?? undefined),
  telefone: z.string().nullish().transform(v => v ?? undefined),
  email: z.string().nullish().transform(v => v ?? undefined),
  site: z.string().nullish().transform(v => v ?? undefined),
  logoUrl: z.string().nullish().transform(v => v ?? undefined),
  tema: z.enum(['claro', 'escuro', 'auto']).nullish().transform(v => v ?? undefined),
  timezone: z.string().nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined)
})

const SistemaConfiguracaoSchema = z.object({
  chave: z.string().min(3),
  valor: z.any(),
  tipo: z.enum(['string', 'number', 'boolean', 'json']).nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  categoria: z.string().nullish().transform(v => v ?? undefined),
  editavel: z.boolean().nullish().transform(v => v ?? undefined)
})

const RestoreSchema = z.object({
  institucional: ConfiguracaoInstitucionalSchema.optional(),
  sistema: z.array(SistemaConfiguracaoSchema).nullish().transform(v => v ?? undefined)
})

const coerceTipo = (value: unknown, tipo?: SystemConfigType): SystemConfigType => {
  if (tipo) return tipo
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number' && !Number.isNaN(value)) return 'number'
  if (typeof value === 'object') return 'json'
  return 'string'
}

export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const { institucional, sistema } = RestoreSchema.parse(body)

  // Fase 5 / M5: captura snapshot do estado ATUAL antes de aplicar restore.
  // Permite rollback automatico via /api/configuracoes/snapshots.
  const estadoAtual = await configuracaoDbService.getAllForBackup()
  const snapshot = await prisma.configuracaoSnapshot.create({
    data: {
      snapshot: estadoAtual as never,
      motivo: 'Snapshot automatico antes de restore',
      userId: session?.user?.id ?? null,
      userEmail: session?.user?.email ?? null
    },
    select: { id: true, createdAt: true }
  })

  const resultados = await configuracaoDbService.restoreFromBackup(institucional, sistema as RestoreSistemaConfig[] | undefined, coerceTipo)

  await ensureSystemConfigDefaults(prisma)

  await logAudit({
    request,
    session,
    action: 'CONFIGURACAO_RESTORE_IMPORT',
    entity: 'Configuracao',
    metadata: {
      institucional: Boolean(institucional),
      totalSistema: sistema?.length ?? 0,
      snapshotId: snapshot.id
    }
  })

  return createSuccessResponse(
    {
      ...resultados,
      snapshotAnterior: snapshot
    },
    `Configurações restauradas. Snapshot do estado anterior: ${snapshot.id} (${snapshot.createdAt.toISOString()})`
  )
}, { permissions: 'config.manage' })
