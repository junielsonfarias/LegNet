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
  NotFoundError,
  UnauthorizedError
} from '@/lib/error-handler'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para proposição
const ProposicaoSchema = z.object({
  numero: z.string().min(1, 'Número da proposição é obrigatório'),
  ano: z.number().min(2020, 'Ano deve ser válido'),
  tipo: z.enum(['PROJETO_LEI', 'PROJETO_RESOLUCAO', 'PROJETO_DECRETO', 'INDICACAO', 'REQUERIMENTO', 'MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO']),
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  ementa: z.string().min(10, 'Ementa deve ter pelo menos 10 caracteres'),
  texto: z.string().optional(),
  status: z.enum(['APRESENTADA', 'EM_TRAMITACAO', 'APROVADA', 'REJEITADA', 'ARQUIVADA', 'VETADA']).default('APRESENTADA'),
  dataApresentacao: z.string().min(1, 'Data de apresentação é obrigatória'),
  dataVotacao: z.string().optional(),
  resultado: z.enum(['APROVADA', 'REJEITADA', 'EMPATE']).optional(),
  sessaoId: z.string().optional(),
  autorId: z.string().min(1, 'ID do autor é obrigatório')
})

// GET - Listar proposições
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')
  const autorId = searchParams.get('autorId')
  const ano = searchParams.get('ano')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // Construir filtros
  const where: any = {}
  
  if (status) {
    where.status = status
  }
  
  if (tipo) {
    where.tipo = tipo
  }
  
  if (autorId) {
    where.autorId = autorId
  }
  
  if (ano) {
    where.ano = parseInt(ano)
  }

  const [proposicoes, total] = await Promise.all([
    prisma.proposicao.findMany({
      where,
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            apelido: true,
            partido: true
          }
        },
        sessao: {
          select: {
            id: true,
            numero: true,
            data: true
          }
        }
      },
      orderBy: [
        { ano: 'desc' },
        { numero: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.proposicao.count({ where })
  ])

  return createSuccessResponse(
    proposicoes,
    'Proposições listadas com sucesso',
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

// POST - Criar proposição (requer autenticação)
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verificar autenticação
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError('Autenticação necessária para criar proposição')
  }

  const body = await request.json()

  // Validar dados
  const validatedData = ProposicaoSchema.parse(body)
  
  // Verificar se já existe proposição com mesmo número/ano
  const existingProposicao = await prisma.proposicao.findUnique({
    where: {
      numero_ano: {
        numero: validatedData.numero,
        ano: validatedData.ano
      }
    }
  })
  
  if (existingProposicao) {
    throw new ConflictError('Já existe uma proposição com este número e ano')
  }
  
  // Verificar se o autor existe
  const autor = await prisma.parlamentar.findUnique({
    where: { id: validatedData.autorId }
  })
  
  if (!autor) {
    throw new NotFoundError('Autor')
  }
  
  const proposicao = await prisma.proposicao.create({
    data: {
      numero: validatedData.numero,
      ano: validatedData.ano,
      tipo: validatedData.tipo,
      titulo: validatedData.titulo,
      ementa: validatedData.ementa,
      texto: validatedData.texto || null,
      status: validatedData.status || 'APRESENTADA',
      dataApresentacao: new Date(validatedData.dataApresentacao),
      dataVotacao: validatedData.dataVotacao ? new Date(validatedData.dataVotacao) : null,
      resultado: validatedData.resultado || null,
      sessaoId: validatedData.sessaoId || null,
      autorId: validatedData.autorId
    },
    include: {
      autor: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    }
  })
  
  return createSuccessResponse(
    proposicao,
    'Proposição criada com sucesso',
    undefined,
    201
  )
})
