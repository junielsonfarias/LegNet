import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, ConflictError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { periodosLegislaturaDbService } from '@/lib/services/periodos-legislatura-db-service'

export const dynamic = 'force-dynamic'

const PeriodoLegislaturaSchema = z.object({
  legislaturaId: z.string().min(1, 'Legislatura é obrigatória'),
  numero: z.coerce.number().min(1, 'Número do período deve ser maior que 0'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().nullish().transform(v => v || undefined),
  descricao: z.string().nullish().transform(v => v || undefined)
})

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const legislaturaId = searchParams.get('legislaturaId') || undefined

  const periodos = await periodosLegislaturaDbService.list({ legislaturaId })
  return createSuccessResponse(periodos, 'Períodos listados com sucesso')
}, { permissions: 'periodo.view' })

export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const validatedData = PeriodoLegislaturaSchema.parse(body)
  const dataInicio = new Date(validatedData.dataInicio)
  const dataFim = validatedData.dataFim ? new Date(validatedData.dataFim) : null

  if (Number.isNaN(dataInicio.getTime())) throw new ValidationError('Data de início inválida')
  if (dataFim && Number.isNaN(dataFim.getTime())) throw new ValidationError('Data de fim inválida')
  if (dataFim && dataFim < dataInicio) throw new ValidationError('A data de fim não pode ser anterior à data de início')

  const legislatura = await periodosLegislaturaDbService.legislaturaExists(validatedData.legislaturaId)
  if (!legislatura) throw new ValidationError('Legislatura não encontrada')

  // Validação flexível: permite 1 ano de margem para períodos de transição
  const legislaturaInicio = new Date(legislatura.anoInicio - 1, 0, 1)
  const legislaturaFim = new Date(legislatura.anoFim + 1, 11, 31)
  if (dataInicio < legislaturaInicio || dataInicio > legislaturaFim) {
    throw new ValidationError(`A data de início (${validatedData.dataInicio}) deve estar dentro do intervalo da legislatura (${legislatura.anoInicio}-${legislatura.anoFim})`)
  }
  if (dataFim && (dataFim < legislaturaInicio || dataFim > legislaturaFim)) {
    throw new ValidationError(`A data de fim (${validatedData.dataFim}) deve estar dentro do intervalo da legislatura (${legislatura.anoInicio}-${legislatura.anoFim})`)
  }

  const duplicateNumero = await periodosLegislaturaDbService.checkDuplicateNumero(validatedData.legislaturaId, validatedData.numero)
  if (duplicateNumero) throw new ConflictError('Já existe um período com este número nesta legislatura')

  const overlap = await periodosLegislaturaDbService.checkOverlap(validatedData.legislaturaId, dataInicio, dataFim)
  if (overlap) throw new ConflictError('As datas informadas se sobrepõem a outro período desta legislatura')

  const periodo = await periodosLegislaturaDbService.create({
    legislaturaId: validatedData.legislaturaId,
    numero: validatedData.numero,
    dataInicio,
    dataFim,
    descricao: validatedData.descricao
  })

  await logAudit({
    request, session,
    action: 'PERIODO_CREATE',
    entity: 'PeriodoLegislatura',
    entityId: periodo.id,
    metadata: { legislaturaId: validatedData.legislaturaId, numero: validatedData.numero, dataInicio: dataInicio.toISOString(), dataFim: dataFim?.toISOString() ?? null }
  })

  return createSuccessResponse(periodo, 'Período criado com sucesso', undefined, 201)
}, { permissions: 'periodo.manage' })
