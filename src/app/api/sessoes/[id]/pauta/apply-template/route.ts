import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { sessaoDbService } from '@/lib/services/sessao-db-service'
import { pautasDbService } from '@/lib/services/pautas-db-service'

const PAUTA_SECOES = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const

const sortPautaItens = <T extends { secao: string; ordem: number }>(itens: T[]): T[] => {
  return [...itens].sort((a, b) => {
    const secaoDiff = PAUTA_SECOES.indexOf(a.secao as typeof PAUTA_SECOES[number]) -
      PAUTA_SECOES.indexOf(b.secao as typeof PAUTA_SECOES[number])
    if (secaoDiff !== 0) {
      return secaoDiff
    }
    return a.ordem - b.ordem
  })
}

const TemplateApplySchema = z.object({
  templateId: z.string().min(1, 'Template é obrigatório'),
  mode: z.enum(['REPLACE', 'APPEND']).default('REPLACE')
})

export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: sessaoId } = await context.params
  const { templateId, mode } = TemplateApplySchema.parse(await request.json())

  await sessaoDbService.assertExists(sessaoId)

  const result = await pautasDbService.applyTemplate(sessaoId, templateId, mode)

  if (!result.pauta) {
    throw new ValidationError('Não foi possível carregar a pauta após aplicar o template')
  }

  await logAudit({
    request,
    session,
    action: 'PAUTA_APPLY_TEMPLATE',
    entity: 'Sessao',
    entityId: sessaoId,
    metadata: {
      templateId,
      modo: mode,
      itensAdicionados: result.itensAdicionados
    }
  })

  return createSuccessResponse({
    ...result.pauta,
    itens: sortPautaItens(result.pauta.itens)
  }, 'Template aplicado à pauta com sucesso')
}, { permissions: 'pauta.manage' })
