import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { configuracaoDbService } from '@/lib/services/configuracao-db-service'

export const dynamic = 'force-dynamic'

const ConfiguracaoSchema = z.object({
  nomeCasa: z.string().min(3, 'Nome da casa legislativa é obrigatório'),
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
