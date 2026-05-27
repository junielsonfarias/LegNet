import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { configuracaoDbService } from '@/lib/services/configuracao-db-service'
import { cacheHelpers } from '@/lib/cache/memory-cache'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/admin/configuracoes')

export const dynamic = 'force-dynamic'

const ConfiguracaoSchema = z.object({
  nomeCasa: z.string().min(3, 'Nome da casa legislativa é obrigatório'),
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
  descricao: z.string().nullish().transform(v => v ?? undefined),
  facebookUrl: z.string().url().nullish().or(z.literal('')).transform(v => v || null),
  instagramUrl: z.string().url().nullish().or(z.literal('')).transform(v => v || null),
  youtubeUrl: z.string().url().nullish().or(z.literal('')).transform(v => v || null)
})

export const GET = withAuth(async (_request: NextRequest) => {
  // F3.2 — configuracoes mudam raramente (1x/mes); cache 1h em memoria.
  const configuracao = await cacheHelpers.getConfiguracoes(() =>
    configuracaoDbService.ensureConfiguracaoInstitucional(),
  )
  return createSuccessResponse(configuracao, 'Configurações carregadas com sucesso')
}, { permissions: 'config.view' })

export const PUT = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const validatedData = ConfiguracaoSchema.parse(body)

  const configuracao = await configuracaoDbService.upsertConfiguracaoInstitucional(validatedData)
  cacheHelpers.invalidateConfiguracoes()

  await logAudit({
    request,
    session,
    action: 'CONFIGURACAO_INSTITUCIONAL_UPDATE',
    entity: 'ConfiguracaoInstitucional',
    entityId: configuracao.id,
    metadata: validatedData
  })

  log.info('Configurações institucionais atualizadas', {
    action: 'configuracao_update',
    id: configuracao.id,
    userId: session?.user?.id
  })

  return createSuccessResponse(configuracao, 'Configurações atualizadas com sucesso')
}, { permissions: 'config.manage' })
