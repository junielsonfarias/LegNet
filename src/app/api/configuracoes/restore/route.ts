import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import {
  ensureSystemConfigDefaults,
  serializeSystemConfigValue,
  SystemConfigType
} from '@/lib/configuracoes/defaults'

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

  const resultados: { institucional?: any; sistema?: number } = {}

  await prisma.$transaction(async (tx: any) => {
    if (institucional) {
      resultados.institucional = await tx.configuracaoInstitucional.upsert({
        where: { slug: 'principal' },
        update: institucional,
        create: {
          slug: 'principal',
          ...institucional
        }
      })
    }

    if (sistema) {
      await tx.configuracao.deleteMany()

      let count = 0
      for (const config of sistema) {
        const tipo = coerceTipo(config.valor, config.tipo)
        await tx.configuracao.create({
          data: {
            chave: config.chave,
            valor: serializeSystemConfigValue(config.valor, tipo),
            descricao: config.descricao,
            categoria: config.categoria ?? 'Geral',
            tipo,
            editavel: config.editavel ?? true
          }
        })
        count += 1
      }
      resultados.sistema = count
    }
  })

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

