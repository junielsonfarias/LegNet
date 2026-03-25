import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, createSuccessResponse, ConflictError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { legislaturaDbService } from '@/lib/services/legislatura-db-service'
import { logAudit } from '@/lib/audit'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para legislatura
const LegislaturaSchema = z.object({
  numero: z.number()
    .int('Número da legislatura deve ser um inteiro')
    .positive('Número da legislatura deve ser positivo'),
  anoInicio: z.number()
    .int('Ano de início deve ser um inteiro')
    .min(1900, 'Ano de início inválido')
    .max(2100, 'Ano de início inválido'),
  anoFim: z.number()
    .int('Ano de fim deve ser um inteiro')
    .min(1900, 'Ano de fim inválido')
    .max(2100, 'Ano de fim inválido'),
  dataInicio: z.string().optional().nullable(),
  dataFim: z.string().optional().nullable(),
  ativa: z.boolean().default(false),
  descricao: z.string().optional()
})

// GET - Listar legislaturas (PUBLICO - usado em paginas de transparencia)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativa = searchParams.get('ativa')
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const result = await legislaturaDbService.paginate(
    {
      ativa: ativa !== null ? ativa === 'true' : undefined,
      search
    },
    { page, limit }
  )

  return createSuccessResponse(
    result.data,
    'Legislaturas listadas com sucesso',
    result.pagination.total,
    200,
    result.pagination
  )
})

// POST - Criar legislatura
export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()

  // Validar dados
  const validatedData = LegislaturaSchema.parse(body)

  // Verificar se já existe legislatura ativa
  if (validatedData.ativa) {
    const existingAtiva = await legislaturaDbService.checkAtivaExiste()
    if (existingAtiva) {
      throw new ConflictError('Já existe uma legislatura ativa. Desative a atual antes de criar uma nova.')
    }
  }

  // Verificar se já existe legislatura com mesmo número
  const existingNumero = await legislaturaDbService.checkDuplicateNumero(validatedData.numero)
  if (existingNumero) {
    throw new ConflictError('Já existe uma legislatura com este número')
  }

  const legislatura = await legislaturaDbService.create(validatedData)

  await logAudit({
    request,
    session,
    action: 'LEGISLATURA_CREATE',
    entity: 'Legislatura',
    entityId: legislatura.id,
    metadata: {
      numero: legislatura.numero,
      anoInicio: legislatura.anoInicio,
      anoFim: legislatura.anoFim,
      ativa: legislatura.ativa
    }
  })

  return createSuccessResponse(
    legislatura,
    'Legislatura criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'legislatura.manage' })
