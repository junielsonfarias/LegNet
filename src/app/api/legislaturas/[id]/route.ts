import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, ConflictError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { legislaturaDbService } from '@/lib/services/legislatura-db-service'

export const dynamic = 'force-dynamic'

const LegislaturaUpdateSchema = z.object({
  numero: z.number().int().positive().optional(),
  anoInicio: z.number().int().min(1900).max(2100).optional(),
  anoFim: z.number().int().min(1900).max(2100).optional(),
  dataInicio: z.string().optional().nullable(),
  dataFim: z.string().optional().nullable(),
  ativa: z.boolean().optional(),
  descricao: z.string().optional()
})

export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  _session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId)
  const legislatura = await legislaturaDbService.getById(id)
  if (!legislatura) throw new NotFoundError('Legislatura não encontrada')
  return createSuccessResponse(legislatura, 'Legislatura encontrada com sucesso')
}, { permissions: 'legislatura.view' })

export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId)
  const body = await request.json()
  const validatedData = LegislaturaUpdateSchema.parse(body)

  const existing = await legislaturaDbService.getById(id)
  if (!existing) throw new NotFoundError('Legislatura não encontrada')

  if (validatedData.ativa === true && !existing.ativa) {
    const outraAtiva = await legislaturaDbService.checkAtivaExiste(id)
    if (outraAtiva) throw new ConflictError('Já existe uma legislatura ativa. Desative a atual antes de ativar esta.')
  }

  if (validatedData.numero && validatedData.numero !== existing.numero) {
    const dup = await legislaturaDbService.checkDuplicateNumero(validatedData.numero, id)
    if (dup) throw new ConflictError('Já existe uma legislatura com este número')
  }

  const legislatura = await legislaturaDbService.update(id, validatedData)

  await logAudit({
    request, session,
    action: 'LEGISLATURA_UPDATE',
    entity: 'Legislatura',
    entityId: legislatura.id,
    metadata: { updates: validatedData }
  })

  return createSuccessResponse(legislatura, 'Legislatura atualizada com sucesso')
}, { permissions: 'legislatura.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId)
  const legislatura = await legislaturaDbService.getById(id)
  if (!legislatura) throw new NotFoundError('Legislatura não encontrada')
  if (legislatura.ativa) throw new ConflictError('Não é possível excluir uma legislatura ativa. Desative-a primeiro.')

  await legislaturaDbService.remove(id)

  await logAudit({
    request, session,
    action: 'LEGISLATURA_DELETE',
    entity: 'Legislatura',
    entityId: id,
    metadata: { numero: legislatura.numero }
  })

  return createSuccessResponse(null, 'Legislatura excluída com sucesso')
}, { permissions: 'legislatura.manage' })
