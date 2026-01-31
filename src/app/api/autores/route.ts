import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  ConflictError,
  UnauthorizedError
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// Schema de validação
const AutorSchema = z.object({
  tipoAutorId: z.string().min(1, 'Tipo de autor é obrigatório'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional().nullable(),
  parlamentarId: z.string().optional().nullable(),
  comissaoId: z.string().optional().nullable(),
  cargo: z.string().optional().nullable(),
  email: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email('Email inválido').optional().nullable()
  ),
  telefone: z.string().optional().nullable(),
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
  const tipoAutorId = searchParams.get('tipoAutorId')
  const search = searchParams.get('search')

  const where: any = {}

  if (ativo === 'true') {
    where.ativo = true
  } else if (ativo === 'false') {
    where.ativo = false
  }

  if (tipoAutorId) {
    where.tipoAutorId = tipoAutorId
  }

  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { cargo: { contains: search, mode: 'insensitive' } }
    ]
  }

  const autores = await prisma.autor.findMany({
    where,
    orderBy: [
      { nome: 'asc' }
    ],
    include: {
      tipoAutor: true,
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          foto: true,
          partido: true,
          ativo: true
        }
      },
      comissao: {
        select: {
          id: true,
          nome: true,
          sigla: true,
          tipo: true,
          ativa: true
        }
      },
      _count: {
        select: { proposicoes: true }
      }
    }
  })

  return createSuccessResponse(autores, 'Autores listados com sucesso')
})

// POST - Criar autor
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError('Autenticação necessária')
  }

  const body = await request.json()
  const validatedData = AutorSchema.parse(body)

  // Verificar se o tipo de autor existe
  const tipoAutor = await prisma.tipoAutor.findUnique({
    where: { id: validatedData.tipoAutorId }
  })

  if (!tipoAutor) {
    throw new ValidationError('Tipo de autor não encontrado')
  }

  // Se vinculado a parlamentar, verificar duplicidade
  if (validatedData.parlamentarId) {
    const existingParlamentar = await prisma.autor.findUnique({
      where: { parlamentarId: validatedData.parlamentarId }
    })
    if (existingParlamentar) {
      throw new ConflictError('Este parlamentar já está vinculado a um autor')
    }

    // Verificar se o parlamentar existe
    const parlamentar = await prisma.parlamentar.findUnique({
      where: { id: validatedData.parlamentarId }
    })
    if (!parlamentar) {
      throw new ValidationError('Parlamentar não encontrado')
    }
  }

  // Se vinculado a comissão, verificar se existe
  if (validatedData.comissaoId) {
    const comissao = await prisma.comissao.findUnique({
      where: { id: validatedData.comissaoId }
    })
    if (!comissao) {
      throw new ValidationError('Comissão não encontrada')
    }
  }

  const autor = await prisma.autor.create({
    data: validatedData,
    include: {
      tipoAutor: true,
      parlamentar: {
        select: { id: true, nome: true, foto: true }
      },
      comissao: {
        select: { id: true, nome: true, sigla: true }
      }
    }
  })

  return createSuccessResponse(autor, 'Autor criado com sucesso', undefined, 201)
})
