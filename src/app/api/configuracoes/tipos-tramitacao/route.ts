import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const CreateTipoTramitacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  prazoRegimental: z.number().int().min(0).default(15),
  prazoLegal: z.number().int().min(0).optional(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0).optional(),
  unidadeResponsavelId: z.string().optional()
})

// GET - Listar tipos de tramitação
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const ativo = searchParams.get('ativo')
  const search = searchParams.get('search')

  const where: any = {}

  if (ativo !== null) {
    where.ativo = ativo === 'true'
  }

  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { descricao: { contains: search, mode: 'insensitive' } }
    ]
  }

  const tipos = await prisma.tramitacaoTipo.findMany({
    where,
    include: {
      unidadeResponsavel: {
        select: {
          id: true,
          nome: true,
          sigla: true
        }
      }
    },
    orderBy: [
      { ordem: 'asc' },
      { nome: 'asc' }
    ]
  })

  return createSuccessResponse(tipos)
}, { permissions: 'config.view' })

// POST - Criar tipo de tramitação
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  const validation = CreateTipoTramitacaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError('Dados inválidos', validation.error.errors)
  }

  const data = validation.data

  // Verificar nome duplicado
  const existente = await prisma.tramitacaoTipo.findFirst({
    where: { nome: data.nome }
  })

  if (existente) {
    throw new ValidationError('Já existe um tipo de tramitação com este nome')
  }

  // Calcular próxima ordem se não informada
  if (data.ordem === undefined) {
    const ultimoTipo = await prisma.tramitacaoTipo.findFirst({
      orderBy: { ordem: 'desc' }
    })
    data.ordem = (ultimoTipo?.ordem ?? 0) + 1
  }

  const tipo = await prisma.tramitacaoTipo.create({
    data: {
      nome: data.nome,
      descricao: data.descricao,
      prazoRegimental: data.prazoRegimental,
      prazoLegal: data.prazoLegal,
      ativo: data.ativo,
      ordem: data.ordem,
      unidadeResponsavelId: data.unidadeResponsavelId
    },
    include: {
      unidadeResponsavel: {
        select: {
          id: true,
          nome: true,
          sigla: true
        }
      }
    }
  })

  return createSuccessResponse(tipo, 'Tipo de tramitação criado com sucesso', undefined, 201)
}, { permissions: 'config.manage' })
