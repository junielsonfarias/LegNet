import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { tiposProposicaoDbService } from '@/lib/services/tipos-proposicao-db-service'
import { withErrorHandler, createSuccessResponse, ConflictError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const APLICACOES_QUORUM = [
  'VOTACAO_SIMPLES',
  'VOTACAO_ABSOLUTA',
  'VOTACAO_QUALIFICADA',
  'VOTACAO_URGENCIA'
] as const

const TipoProposicaoSchema = z.object({
  codigo: z.string()
    .min(3, 'Codigo deve ter no minimo 3 caracteres')
    .max(50, 'Codigo deve ter no maximo 50 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'Codigo deve conter apenas letras maiusculas, numeros e underscore'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  sigla: z.string().min(1, 'Sigla é obrigatória').max(10, 'Sigla deve ter no máximo 10 caracteres'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  prazoLimite: z.number().int().min(0).optional().nullable(),
  requerVotacao: z.boolean().default(true),
  requerSancao: z.boolean().default(false),
  numeracaoAnual: z.boolean().default(true),
  prefixoNumeracao: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().default(true),
  ordem: z.number().int().default(0),
  corBadge: z.string().nullish().transform(v => v ?? undefined),
  icone: z.string().nullish().transform(v => v ?? undefined),
  quorumAplicacao: z.enum(APLICACOES_QUORUM).nullish().transform(v => v ?? undefined),
  quorumAplicacao2Turno: z.enum(APLICACOES_QUORUM).nullish().transform(v => v ?? undefined),
  totalTurnos: z.number().int().min(1).max(2).default(1),
  intersticioDias: z.number().int().min(0).max(30).default(0)
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const apenasAtivos = searchParams.get('ativo') === 'true'

  const tipos = await tiposProposicaoDbService.list({
    ativo: apenasAtivos ? true : undefined
  })

  return createSuccessResponse(tipos)
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = TipoProposicaoSchema.parse(body)

  const existente = await tiposProposicaoDbService.getByCodigo(validatedData.codigo)
  if (existente) {
    throw new ConflictError('Já existe uma configuração para este tipo de proposição')
  }

  const tipo = await tiposProposicaoDbService.create(validatedData)

  return createSuccessResponse(tipo, 'Tipo de proposição criado com sucesso', undefined, 201)
}, { permissions: 'config.manage' })
