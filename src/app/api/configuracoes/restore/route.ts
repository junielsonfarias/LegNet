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
  sigla: z.string().optional(),
  cnpj: z.string().optional(),
  enderecoLogradouro: z.string().optional(),
  enderecoNumero: z.string().optional(),
  enderecoBairro: z.string().optional(),
  enderecoCidade: z.string().optional(),
  enderecoEstado: z.string().optional(),
  enderecoCep: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  site: z.string().optional(),
  logoUrl: z.string().optional(),
  tema: z.enum(['claro', 'escuro', 'auto']).optional(),
  timezone: z.string().optional(),
  descricao: z.string().optional()
})

const SistemaConfiguracaoSchema = z.object({
  chave: z.string().min(3),
  valor: z.any(),
  tipo: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  editavel: z.boolean().optional()
})

const RestoreSchema = z.object({
  institucional: ConfiguracaoInstitucionalSchema.optional(),
  sistema: z.array(SistemaConfiguracaoSchema).optional()
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

  const resultados = await configuracaoDbService.restoreFromBackup(institucional, sistema as RestoreSistemaConfig[] | undefined, coerceTipo)

  await ensureSystemConfigDefaults(prisma)

  await logAudit({
    request,
    session,
    action: 'CONFIGURACAO_RESTORE_IMPORT',
    entity: 'Configuracao',
    metadata: {
      institucional: Boolean(institucional),
      totalSistema: sistema?.length ?? 0
    }
  })

  return createSuccessResponse(resultados, 'Configurações restauradas com sucesso')
}, { permissions: 'config.manage' })
