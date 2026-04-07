import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { tiposAutorDbService } from '@/lib/services/tipos-autor-db-service'

export const dynamic = 'force-dynamic'

const TipoAutorSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().nullish().transform(v => v ?? true),
  ordem: z.number().nullish().transform(v => v ?? 0)
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')

  const tiposAutor = await tiposAutorDbService.list({
    ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined
  })

  return createSuccessResponse(tiposAutor, 'Tipos de autor listados com sucesso')
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = TipoAutorSchema.parse(body)

  const existing = await tiposAutorDbService.checkDuplicateName(validatedData.nome)
  if (existing) {
    throw new ConflictError('Já existe um tipo de autor com este nome')
  }

  const tipoAutor = await tiposAutorDbService.create(validatedData)

  return createSuccessResponse(tipoAutor, 'Tipo de autor criado com sucesso', undefined, 201)
}, { permissions: 'proposicao.manage' })
