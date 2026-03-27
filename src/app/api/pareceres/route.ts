import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { pareceresDbService } from '@/lib/services/pareceres-db-service'

export const dynamic = 'force-dynamic'

const CreateParecerSchema = z.object({
  proposicaoId: z.string().min(1, 'Proposição é obrigatória'),
  comissaoId: z.string().min(1, 'Comissão é obrigatória'),
  relatorId: z.string().min(1, 'Relator é obrigatório'),
  tipo: z.enum([
    'FAVORAVEL',
    'FAVORAVEL_COM_EMENDAS',
    'CONTRARIO',
    'PELA_INCONSTITUCIONALIDADE',
    'PELA_ILEGALIDADE',
    'PELA_PREJUDICIALIDADE',
    'PELA_RETIRADA'
  ]),
  fundamentacao: z.string().min(10, 'Fundamentação deve ter pelo menos 10 caracteres'),
  conclusao: z.string().optional(),
  ementa: z.string().optional(),
  emendasPropostas: z.string().optional(),
  prazoEmissao: z.string().optional(),
  observacoes: z.string().optional(),
  arquivoUrl: z.string().url().optional().nullable(),
  arquivoNome: z.string().optional().nullable(),
  arquivoTamanho: z.number().int().optional().nullable(),
  driveUrl: z.string().url().optional().nullable()
})

// GET - Listar pareceres com filtros
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const pareceres = await pareceresDbService.list({
    comissaoId: searchParams.get('comissaoId') || undefined,
    proposicaoId: searchParams.get('proposicaoId') || undefined,
    relatorId: searchParams.get('relatorId') || undefined,
    status: searchParams.get('status') || undefined,
    tipo: searchParams.get('tipo') || undefined,
    ano: searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
  })

  return createSuccessResponse(pareceres, 'Pareceres listados com sucesso')
})

// POST - Criar novo parecer
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateParecerSchema.parse(body)

  try {
    const parecer = await pareceresDbService.createWithValidation(validatedData)
    return createSuccessResponse(parecer, 'Parecer criado com sucesso')
  } catch (error: any) {
    throw new ValidationError(error.message)
  }
}, { permissions: 'comissao.manage' })
