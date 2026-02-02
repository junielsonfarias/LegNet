/**
 * API: Reuniões de Comissão
 * GET - Lista reuniões
 * POST - Cria nova reunião
 * SEGURANÇA: POST requer permissão comissao.manage
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

export const dynamic = 'force-dynamic'

// Schema de validação
const CriarReuniaoSchema = z.object({
  comissaoId: z.string().min(1, 'Comissão é obrigatória'),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'ESPECIAL']).optional(),
  data: z.string().datetime('Data inválida'),
  horaInicio: z.string().datetime().optional(),
  local: z.string().optional(),
  motivoConvocacao: z.string().optional(),
  quorumMinimo: z.number().int().min(1).optional(),
  observacoes: z.string().optional()
})

/**
 * GET - Listar reuniões de comissão
 * Requer autenticação básica
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const { searchParams } = new URL(request.url)
  const comissaoId = searchParams.get('comissaoId') || undefined
  const status = searchParams.get('status') as any || undefined
  const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
  const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : undefined
  const take = searchParams.get('take') ? parseInt(searchParams.get('take')!) : 20

  const resultado = await ReuniaoComissaoService.listarReunioes({
    comissaoId,
    status,
    ano,
    skip,
    take
  })

  return createSuccessResponse({
    reunioes: resultado.reunioes,
    total: resultado.total
  }, 'Reuniões listadas')
})

/**
 * POST - Criar nova reunião
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const POST = withAuth(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  const body = await request.json()

  const validation = CriarReuniaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const dados = validation.data

  const reuniao = await ReuniaoComissaoService.criarReuniao({
    comissaoId: dados.comissaoId,
    tipo: dados.tipo,
    data: new Date(dados.data),
    horaInicio: dados.horaInicio ? new Date(dados.horaInicio) : undefined,
    local: dados.local,
    motivoConvocacao: dados.motivoConvocacao,
    quorumMinimo: dados.quorumMinimo,
    observacoes: dados.observacoes,
    criadoPorId: session?.user?.id
  })

  return createSuccessResponse(reuniao, 'Reunião criada com sucesso', undefined, 201)
}, { permissions: 'comissao.manage' })
