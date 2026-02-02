import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const UpdateNoticiaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').optional(),
  resumo: z.string().optional(),
  conteudo: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres').optional(),
  imagem: z.string().optional(),
  categoria: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publicada: z.boolean().optional(),
  dataPublicacao: z.string().optional()
})

// GET - Buscar notícia por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Notícia')
  
  const noticia = await prisma.noticia.findUnique({
    where: { id }
  })
  
  if (!noticia) {
    throw new NotFoundError('Notícia')
  }
  
  return createSuccessResponse(noticia, 'Notícia encontrada com sucesso')
})

// PUT - Atualizar notícia
// SEGURANÇA: Requer autenticação e permissão de publicação
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Notícia')
  const body = await request.json()
  
  // Validar dados
  const validatedData = UpdateNoticiaSchema.parse(body)
  
  // Verificar se notícia existe
  const existingNoticia = await prisma.noticia.findUnique({
    where: { id }
  })
  
  if (!existingNoticia) {
    throw new NotFoundError('Notícia')
  }
  
  // Preparar dados para atualização
  const updateData: any = {}
  
  if (validatedData.titulo !== undefined) updateData.titulo = validatedData.titulo
  if (validatedData.resumo !== undefined) updateData.resumo = validatedData.resumo || null
  if (validatedData.conteudo !== undefined) updateData.conteudo = validatedData.conteudo
  if (validatedData.imagem !== undefined) updateData.imagem = validatedData.imagem || null
  if (validatedData.categoria !== undefined) updateData.categoria = validatedData.categoria || null
  if (validatedData.tags !== undefined) updateData.tags = validatedData.tags || []
  if (validatedData.publicada !== undefined) updateData.publicada = validatedData.publicada
  if (validatedData.dataPublicacao !== undefined) {
    updateData.dataPublicacao = validatedData.dataPublicacao 
      ? new Date(validatedData.dataPublicacao)
      : null
  }
  
  const updatedNoticia = await prisma.noticia.update({
    where: { id },
    data: updateData
  })
  
  return createSuccessResponse(
    updatedNoticia,
    'Notícia atualizada com sucesso'
  )
}, { permissions: 'publicacao.manage' })

// DELETE - Excluir notícia
// SEGURANÇA: Requer autenticação e permissão de publicação
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Notícia')
  
  // Verificar se notícia existe
  const existingNoticia = await prisma.noticia.findUnique({
    where: { id }
  })
  
  if (!existingNoticia) {
    throw new NotFoundError('Notícia')
  }
  
  // Hard delete - remover do banco
  await prisma.noticia.delete({
    where: { id }
  })
  
  return createSuccessResponse(
    null,
    'Notícia excluída com sucesso'
  )
}, { permissions: 'publicacao.manage' })

