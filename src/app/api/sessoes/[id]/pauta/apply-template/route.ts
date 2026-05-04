import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { sessaoDbService } from '@/lib/services/sessao-db-service'
import { pautasDbService } from '@/lib/services/pautas-db-service'

const sortPautaItens = <T extends { secao: string; ordem: number }>(itens: T[]): T[] => {
  return [...itens].sort((a, b) => {
    if (a.secao !== b.secao) return a.secao.localeCompare(b.secao)
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

  // RN-053 / Fase 3 A5: aplicar template em pauta APROVADA substituiria/adicionaria
  // itens, descumprindo a publicacao oficial.
  await pautasDbService.assertPautaEditavel(sessaoId)

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
