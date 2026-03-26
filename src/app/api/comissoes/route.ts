import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { comissaoDbService } from '@/lib/services/comissao-db-service'
import { syncComissaoHistorico } from '@/lib/participation-history'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para comissão
const ComissaoSchema = z.object({
  nome: z.string().min(3, 'Nome da comissão deve ter pelo menos 3 caracteres'),
  sigla: z.string().optional().nullable(),
  descricao: z.string().optional(),
  tipo: z.enum(['PERMANENTE', 'TEMPORARIA', 'ESPECIAL', 'INQUERITO']),
  ativa: z.boolean().default(true)
})

// GET - Listar comissões
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') || undefined
  const ativa = searchParams.get('ativa')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const result = await comissaoDbService.paginate(
    {
      tipo,
      ativa: ativa !== null ? ativa === 'true' : undefined
    },
    { page, limit }
  )

  return createSuccessResponse(
    result.data,
    'Comissões listadas com sucesso',
    result.pagination.total,
    200,
    result.pagination
  )
})

// POST - Criar comissão
// SEGURANÇA: Requer autenticação e permissão de gestão de comissões
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Validar dados
  const validatedData = ComissaoSchema.parse(body)

  // Verificar se já existe comissão com mesmo nome
  const existing = await comissaoDbService.checkDuplicateName(validatedData.nome)
  if (existing) {
    throw new ConflictError('Já existe uma comissão com este nome')
  }

  const comissao = await comissaoDbService.create(validatedData)

  await syncComissaoHistorico(comissao.id)

  return createSuccessResponse(
    comissao,
    'Comissão criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'comissao.manage' })
