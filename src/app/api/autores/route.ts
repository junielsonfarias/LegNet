import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { autorDbService } from '@/lib/services/autor-db-service'

export const dynamic = 'force-dynamic'

// Schema de validação
const AutorSchema = z.object({
  tipoAutorId: z.string().min(1, 'Tipo de autor é obrigatório'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  parlamentarId: z.string().nullish().transform(v => v ?? undefined),
  comissaoId: z.string().nullish().transform(v => v ?? undefined),
  cargo: z.string().nullish().transform(v => v ?? undefined),
  email: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email('Email inválido').nullish().transform(v => v ?? undefined)
  ),
  telefone: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().default(true)
}).transform(data => ({
  tipoAutorId: data.tipoAutorId,
  nome: data.nome,
  descricao: data.descricao || null,
  parlamentarId: data.parlamentarId || null,
  comissaoId: data.comissaoId || null,
  cargo: data.cargo || null,
  email: data.email || null,
  telefone: data.telefone || null,
  ativo: data.ativo ?? true
}))

// GET - Listar autores
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')
  const tipoAutorId = searchParams.get('tipoAutorId') || undefined
  const search = searchParams.get('search') || undefined

  const autores = await autorDbService.list({
    ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
    tipoAutorId,
    search
  })

  return createSuccessResponse(autores, 'Autores listados com sucesso')
})

// POST - Criar autor
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = AutorSchema.parse(body)

  // Verificar se o tipo de autor existe
  const tipoAutor = await autorDbService.tipoAutorExists(validatedData.tipoAutorId)
  if (!tipoAutor) {
    throw new ValidationError('Tipo de autor não encontrado')
  }

  // Se vinculado a parlamentar, verificar duplicidade
  if (validatedData.parlamentarId) {
    const existing = await autorDbService.checkParlamentarVinculado(validatedData.parlamentarId)
    if (existing) {
      throw new ConflictError('Este parlamentar já está vinculado a um autor')
    }

    const parlamentar = await autorDbService.parlamentarExists(validatedData.parlamentarId)
    if (!parlamentar) {
      throw new ValidationError('Parlamentar não encontrado')
    }
  }

  // Se vinculado a comissão, verificar se existe
  if (validatedData.comissaoId) {
    const comissao = await autorDbService.comissaoExists(validatedData.comissaoId)
    if (!comissao) {
      throw new ValidationError('Comissão não encontrada')
    }
  }

  const autor = await autorDbService.create(validatedData)

  return createSuccessResponse(autor, 'Autor criado com sucesso', undefined, 201)
}, { permissions: 'proposicao.manage' })
