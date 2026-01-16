import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { 
  withErrorHandler, 
  createSuccessResponse, 
  createErrorResponse,
  ValidationError
} from '@/lib/error-handler'

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
  const categoria = searchParams.get('categoria')
  const publicada = searchParams.get('publicada')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

  // Construir filtros
  const where: any = {}
  
  if (categoria) {
    where.categoria = { contains: categoria, mode: 'insensitive' }
  }
  
  if (publicada !== null) {
    where.publicada = publicada === 'true'
  }

  const [noticias, total] = await Promise.all([
    prisma.noticia.findMany({
      where,
      orderBy: [
        { dataPublicacao: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.noticia.count({ where })
  ])

  return createSuccessResponse(
    noticias,
    'Notícias listadas com sucesso',
    total,
    200,
    {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  )
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  // Validar dados
  const validatedData = NoticiaSchema.parse(body)
  
  const novaNoticia = await prisma.noticia.create({
    data: {
      titulo: validatedData.titulo,
      conteudo: validatedData.conteudo,
      resumo: validatedData.resumo || null,
      categoria: validatedData.categoria || null,
      tags: validatedData.tags || [],
      imagem: validatedData.imagem || null,
      publicada: validatedData.publicada || false,
      dataPublicacao: validatedData.dataPublicacao 
        ? new Date(validatedData.dataPublicacao)
        : validatedData.publicada 
          ? new Date()
          : null
    }
  })

  return createSuccessResponse(
    novaNoticia,
    'Notícia criada com sucesso',
    undefined,
    201
  )
})
