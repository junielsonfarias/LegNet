import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ConflictError,
  validateId
} from '@/lib/error-handler'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização de proposição
const UpdateProposicaoSchema = z.object({
  numero: z.string().min(1).optional(),
  ano: z.number().min(2020).optional(),
  tipo: z.enum(['PROJETO_LEI', 'PROJETO_RESOLUCAO', 'PROJETO_DECRETO', 'INDICACAO', 'REQUERIMENTO', 'MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO']).optional(),
  titulo: z.string().min(5).optional(),
  ementa: z.string().min(10).optional(),
  texto: z.string().optional(),
  status: z.enum(['APRESENTADA', 'EM_TRAMITACAO', 'APROVADA', 'REJEITADA', 'ARQUIVADA', 'VETADA']).optional(),
  dataApresentacao: z.string().optional(),
  dataVotacao: z.string().optional(),
  resultado: z.enum(['APROVADA', 'REJEITADA', 'EMPATE']).optional(),
  sessaoId: z.string().optional(),
  autorId: z.string().optional()
})

// GET - Buscar proposição por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Proposição')

  const proposicao = await prisma.proposicao.findUnique({
    where: { id },
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
    }
  })

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  return createSuccessResponse(proposicao, 'Proposição encontrada com sucesso')
})

// PUT - Atualizar proposição
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Proposição')
  const body = await request.json()

  // Validar dados
  const validatedData = UpdateProposicaoSchema.parse(body)

  // Verificar se proposição existe
  const existingProposicao = await prisma.proposicao.findUnique({
    where: { id }
  })

  if (!existingProposicao) {
    throw new NotFoundError('Proposição')
  }

  // Verificar duplicatas (se número/ano foram alterados)
  if ((validatedData.numero || validatedData.ano) && 
      (validatedData.numero !== existingProposicao.numero || validatedData.ano !== existingProposicao.ano)) {
    const duplicateCheck = await prisma.proposicao.findUnique({
      where: {
        numero_ano: {
          numero: validatedData.numero || existingProposicao.numero,
          ano: validatedData.ano || existingProposicao.ano
        }
      }
    })

    if (duplicateCheck && duplicateCheck.id !== id) {
      throw new ConflictError('Já existe uma proposição com este número e ano')
    }
  }

  // Verificar se autor existe (se foi alterado)
  if (validatedData.autorId && validatedData.autorId !== existingProposicao.autorId) {
    const autor = await prisma.parlamentar.findUnique({
      where: { id: validatedData.autorId }
    })

    if (!autor) {
      throw new NotFoundError('Autor')
    }
  }

  const updatedProposicao = await prisma.proposicao.update({
    where: { id },
    data: {
      numero: validatedData.numero,
      ano: validatedData.ano,
      tipo: validatedData.tipo,
      titulo: validatedData.titulo,
      ementa: validatedData.ementa,
      texto: validatedData.texto,
      status: validatedData.status,
      dataApresentacao: validatedData.dataApresentacao ? new Date(validatedData.dataApresentacao) : undefined,
      dataVotacao: validatedData.dataVotacao ? new Date(validatedData.dataVotacao) : validatedData.dataVotacao === null ? null : undefined,
      resultado: validatedData.resultado,
      sessaoId: validatedData.sessaoId,
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
    updatedProposicao,
    'Proposição atualizada com sucesso'
  )
})

// DELETE - Excluir proposição
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Proposição')

  // Verificar se proposição existe
  const existingProposicao = await prisma.proposicao.findUnique({
    where: { id }
  })

  if (!existingProposicao) {
    throw new NotFoundError('Proposição')
  }

  await prisma.proposicao.delete({
    where: { id }
  })

  return createSuccessResponse(
    null,
    'Proposição excluída com sucesso'
  )
})

