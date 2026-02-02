import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { syncComissaoHistorico } from '@/lib/participation-history'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para comissão
const ComissaoSchema = z.object({
  nome: z.string().min(3, 'Nome da comissão deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  tipo: z.enum(['PERMANENTE', 'TEMPORARIA', 'ESPECIAL', 'INQUERITO']),
  ativa: z.boolean().default(true)
})

// GET - Listar comissões
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const ativa = searchParams.get('ativa')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // Construir filtros
  const where: any = {}
  
  if (tipo) {
    where.tipo = tipo
  }
  
  if (ativa !== null) {
    where.ativa = ativa === 'true'
  }

  const [comissoes, total] = await Promise.all([
    prisma.comissao.findMany({
      where,
      orderBy: [
        { nome: 'asc' }
      ],
      include: {
        membros: {
          include: {
            parlamentar: {
              select: {
                id: true,
                nome: true,
                apelido: true,
                partido: true
              }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.comissao.count({ where })
  ])

  return createSuccessResponse(
    comissoes,
    'Comissões listadas com sucesso',
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

// POST - Criar comissão
// SEGURANÇA: Requer autenticação e permissão de gestão de comissões
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Validar dados
  const validatedData = ComissaoSchema.parse(body)

  // Verificar se já existe comissão com mesmo nome
  const existingComissao = await prisma.comissao.findFirst({
    where: {
      nome: {
        equals: validatedData.nome,
        mode: 'insensitive'
      }
    }
  })

  if (existingComissao) {
    throw new ConflictError('Já existe uma comissão com este nome')
  }

  const comissao = await prisma.comissao.create({
    data: {
      nome: validatedData.nome,
      descricao: validatedData.descricao || null,
      tipo: validatedData.tipo,
      ativa: validatedData.ativa ?? true
    },
    include: {
      membros: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              partido: true
            }
          }
        }
      }
    }
  })

  await syncComissaoHistorico(comissao.id)

  return createSuccessResponse(
    comissao,
    'Comissão criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'comissao.manage' })
