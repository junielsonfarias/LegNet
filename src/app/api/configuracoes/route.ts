import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { configuracaoDbService } from '@/lib/services/configuracao-db-service'

export const dynamic = 'force-dynamic'

const ConfiguracaoSchema = z.object({
  nomeCasa: z.string().min(3, 'Nome da casa legislativa é obrigatório'),
  sigla: z.string().nullish(),
  cnpj: z.string().nullish(),
  enderecoLogradouro: z.string().nullish(),
  enderecoNumero: z.string().nullish(),
  enderecoBairro: z.string().nullish(),
  enderecoCidade: z.string().nullish(),
  enderecoEstado: z.string().nullish(),
  enderecoCep: z.string().nullish(),
  telefone: z.string().nullish(),
  email: z.string().nullish(),
  site: z.string().nullish(),
  logoUrl: z.string().nullish(),
  tema: z.enum(['claro', 'escuro', 'auto']).nullish(),
  timezone: z.string().nullish(),
  descricao: z.string().nullish(),
  facebookUrl: z.string().url().nullish().or(z.literal('')).transform(v => v || null),
  instagramUrl: z.string().url().nullish().or(z.literal('')).transform(v => v || null),
  youtubeUrl: z.string().url().nullish().or(z.literal('')).transform(v => v || null)
})

export const GET = withAuth(async (_request: NextRequest) => {
  const configuracao = await configuracaoDbService.ensureConfiguracaoInstitucional()
  return createSuccessResponse(configuracao, 'Configurações carregadas com sucesso')
}, { permissions: 'config.view' })

export const PUT = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const validatedData = ConfiguracaoSchema.parse(body)

  const configuracao = await configuracaoDbService.upsertConfiguracaoInstitucional(validatedData)

  await logAudit({
    request,
    session,
    action: 'CONFIGURACAO_INSTITUCIONAL_UPDATE',
    entity: 'ConfiguracaoInstitucional',
    entityId: configuracao.id,
    metadata: validatedData
  })

  return createSuccessResponse(configuracao, 'Configurações atualizadas com sucesso')
}, { permissions: 'config.manage' })
