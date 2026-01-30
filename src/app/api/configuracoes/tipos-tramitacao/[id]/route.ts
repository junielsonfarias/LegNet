import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const UpdateTipoTramitacaoSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  prazoRegimental: z.number().int().min(0).optional(),
  prazoLegal: z.number().int().min(0).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().min(0).optional(),
  unidadeResponsavelId: z.string().nullable().optional()
})

// GET - Obter tipo de tramitação por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params

  const tipo = await prisma.tramitacaoTipo.findUnique({
    where: { id },
    include: {
      unidadeResponsavel: {
        select: {
          id: true,
          nome: true,
          sigla: true
        }
      },
      _count: {
        select: {
          tramitacoes: true
        }
      }
    }
  })

  if (!tipo) {
    throw new NotFoundError('Tipo de tramitação não encontrado')
  }

  return createSuccessResponse(tipo)
}, { permissions: 'config.view' })

// PUT - Atualizar tipo de tramitação
export const PUT = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params
  const body = await request.json()

  const validation = UpdateTipoTramitacaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError('Dados inválidos', validation.error.errors)
  }

  const data = validation.data

  // Verificar se existe
  const existente = await prisma.tramitacaoTipo.findUnique({
    where: { id }
  })

  if (!existente) {
    throw new NotFoundError('Tipo de tramitação não encontrado')
  }

  // Verificar nome duplicado (se estiver alterando)
  if (data.nome && data.nome !== existente.nome) {
    const duplicado = await prisma.tramitacaoTipo.findFirst({
      where: {
        nome: data.nome,
        id: { not: id }
      }
    })

    if (duplicado) {
      throw new ValidationError('Já existe um tipo de tramitação com este nome')
    }
  }

  const tipo = await prisma.tramitacaoTipo.update({
    where: { id },
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

  return createSuccessResponse(tipo)
}, { permissions: 'config.manage' })

// DELETE - Excluir tipo de tramitação
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params

  // Verificar se existe
  const existente = await prisma.tramitacaoTipo.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          tramitacoes: true
        }
      }
    }
  })

  if (!existente) {
    throw new NotFoundError('Tipo de tramitação não encontrado')
  }

  // Verificar se está em uso
  if (existente._count.tramitacoes > 0) {
    throw new ValidationError(
      `Este tipo de tramitação está em uso em ${existente._count.tramitacoes} tramitação(ões). ` +
      'Desative-o em vez de excluir.'
    )
  }

  await prisma.tramitacaoTipo.delete({
    where: { id }
  })

  return createSuccessResponse({ message: 'Tipo de tramitação excluído com sucesso' })
}, { permissions: 'config.manage' })
