import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { noticiasDbService } from '@/lib/services/noticias-db-service'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para notícia
const NoticiaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  resumo: z.string().optional(),
  conteudo: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  imagem: z.string().optional(),
  categoria: z.string().optional(),
  tags: z.array(z.string()).default([]),
  publicada: z.boolean().default(false),
  dataPublicacao: z.string().optional()
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria') || undefined
  const publicada = searchParams.get('publicada')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

  const result = await noticiasDbService.paginate(
    {
      categoria,
      publicada: publicada !== null ? publicada === 'true' : undefined
    },
    { page, limit }
  )

  return createSuccessResponse(
    result.data,
    'Notícias listadas com sucesso',
    result.pagination.total,
    200,
    result.pagination
  )
})

// SEGURANÇA: Requer autenticação e permissão de publicação
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Validar dados
  const validatedData = NoticiaSchema.parse(body)

  const novaNoticia = await noticiasDbService.create(validatedData)

  return createSuccessResponse(
    novaNoticia,
    'Notícia criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'publicacao.manage' })
