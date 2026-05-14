import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ConflictError,
  validateEmail,
  validatePhone
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'
import { cacheHelpers } from '@/lib/cache/memory-cache'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para mandato
const MandatoSchema = z.object({
  legislaturaId: z.string().min(1, 'Legislatura é obrigatória'),
  numeroVotos: z.number().min(0, 'Número de votos deve ser positivo').default(0),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().nullish().transform(v => v ?? undefined)
})

// Schema de validação para filiação
const FiliacaoSchema = z.object({
  partido: z.string().min(2, 'Partido deve ter pelo menos 2 caracteres'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().nullish().transform(v => v ?? undefined)
})

// Schema de validação para parlamentar
const ParlamentarSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .refine(val => val.trim().length > 0, 'Nome não pode ser vazio'),
  apelido: z.string()
    .min(2, 'Apelido deve ter pelo menos 2 caracteres')
    .max(50, 'Apelido deve ter no máximo 50 caracteres')
    .refine(val => val.trim().length > 0, 'Apelido não pode ser vazio'),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']),
  partido: z.string()
    .min(2, 'Partido deve ter pelo menos 2 caracteres')
    .max(50, 'Partido deve ter no máximo 50 caracteres')
    .optional(),
  legislatura: z.string()
    .min(4, 'Legislatura deve ter pelo menos 4 caracteres')
    .max(20, 'Legislatura deve ter no máximo 20 caracteres'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .refine(val => !val || validateEmail(val), 'Email deve ter formato válido'),
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 caracteres')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .refine(val => !val || validatePhone(val), 'Telefone deve ter formato válido'),
  biografia: z.string().nullish().transform(v => v ?? undefined),
  foto: z.string().nullish().transform(v => v ?? undefined),
  gabinete: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().default(true),
  mandatos: z.array(MandatoSchema).nullish().transform(v => v ?? undefined),
  filiacoes: z.array(FiliacaoSchema).nullish().transform(v => v ?? undefined)
})

// GET - Listar parlamentares
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')
  const cargo = searchParams.get('cargo') || undefined
  const partido = searchParams.get('partido') || undefined
  const search = searchParams.get('search') || undefined
  const legislaturaId = searchParams.get('legislaturaId') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // F3.2 — cenario padrao (page=1, limit=50, ativo=true, sem filtros custom)
  // eh chamado em todo carregamento do portal. Cache 15min em memoria nesse
  // caso. Qualquer filtro extra/page/limit diferente bypassa.
  const isDefaultListing =
    page === 1 &&
    limit === 50 &&
    ativo === 'true' &&
    !cargo &&
    !partido &&
    !search &&
    !legislaturaId

  const result = isDefaultListing
    ? await cacheHelpers.getParlamentaresAtivos(() =>
        parlamentarDbService.paginate({ ativo: true }, { page: 1, limit: 50 }),
      )
    : await parlamentarDbService.paginate(
        {
          ativo: ativo !== null ? ativo === 'true' : undefined,
          cargo,
          partido,
          search,
          legislaturaId
        },
        { page, limit }
      )

  return createSuccessResponse(
    result.data,
    'Parlamentares listados com sucesso',
    result.pagination.total,
    200,
    result.pagination
  )
})

// POST - Criar parlamentar
// SEGURANÇA: Requer autenticação e permissão de gestão de parlamentares
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Validar dados
  const validatedData = ParlamentarSchema.parse(body)

  // Verificar se já existe parlamentar com mesmo nome/apelido
  const existing = await parlamentarDbService.checkDuplicate(validatedData.nome, validatedData.apelido)
  if (existing) {
    throw new ConflictError('Já existe um parlamentar com este nome ou apelido')
  }

  const parlamentar = await parlamentarDbService.create(validatedData)
  cacheHelpers.invalidateParlamentares()

  return createSuccessResponse(
    parlamentar,
    'Parlamentar criado com sucesso',
    undefined,
    201
  )
}, { permissions: 'parlamentar.manage' })
