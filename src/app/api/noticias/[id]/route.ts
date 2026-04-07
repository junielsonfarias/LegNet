import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { noticiasDbService } from '@/lib/services/noticias-db-service'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const UpdateNoticiaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').nullish().transform(v => v ?? undefined),
  resumo: z.string().nullish().transform(v => v ?? undefined),
  conteudo: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres').nullish().transform(v => v ?? undefined),
  imagem: z.string().nullish().transform(v => v ?? undefined),
  categoria: z.string().nullish().transform(v => v ?? undefined),
  tags: z.array(z.string()).nullish().transform(v => v ?? undefined),
  publicada: z.boolean().nullish().transform(v => v ?? undefined),
  dataPublicacao: z.string().nullish().transform(v => v ?? undefined)
})

// GET - Buscar notícia por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Notícia')

  const noticia = await noticiasDbService.getById(id)
  if (!noticia) {
    throw new NotFoundError('Notícia')
  }

  return createSuccessResponse(noticia, 'Notícia encontrada com sucesso')
})

// PUT - Atualizar notícia
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Notícia')
  const body = await request.json()

  const validatedData = UpdateNoticiaSchema.parse(body)

  const existing = await noticiasDbService.getById(id)
  if (!existing) {
    throw new NotFoundError('Notícia')
  }

  const updatedNoticia = await noticiasDbService.update(id, validatedData)

  return createSuccessResponse(updatedNoticia, 'Notícia atualizada com sucesso')
}, { permissions: 'publicacao.manage' })

// DELETE - Excluir notícia
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Notícia')

  const existing = await noticiasDbService.getById(id)
  if (!existing) {
    throw new NotFoundError('Notícia')
  }

  await noticiasDbService.remove(id)

  return createSuccessResponse(null, 'Notícia excluída com sucesso')
}, { permissions: 'publicacao.manage' })
