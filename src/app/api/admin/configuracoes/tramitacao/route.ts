import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { configuracaoDbService } from '@/lib/services/configuracao-db-service'

export const dynamic = 'force-dynamic'

/**
 * Configurações de tramitação armazenadas como pares chave/valor na tabela
 * `configuracoes` (ex.: prazos de regime de urgência). Usado por
 * /admin/configuracoes/prazos-urgencia. Ver ERR-063.
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria') || undefined
    const configs = await configuracaoDbService.getConfiguracoesDoSistema({ categoria })
    return createSuccessResponse(configs)
  },
  { permissions: 'config.view' },
)

const UpsertSchema = z.object({
  chave: z.string().min(1, 'chave é obrigatória'),
  valor: z.string(),
  tipo: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  descricao: z.string().nullish().transform((v) => v ?? undefined),
  categoria: z.string().nullish().transform((v) => v ?? 'Geral'),
})

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()
    const data = UpsertSchema.parse(body)
    const config = await configuracaoDbService.upsertConfiguracaoSistema(data)
    return createSuccessResponse(config, 'Configuração salva')
  },
  { permissions: 'config.manage' },
)
