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
import { syncComissaoHistorico } from '@/lib/participation-history'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const UpdateComissaoSchema = z.object({
  nome: z.string().min(3, 'Nome da comissão deve ter pelo menos 3 caracteres').optional(),
  descricao: z.string().optional(),
  tipo: z.enum(['PERMANENTE', 'TEMPORARIA', 'ESPECIAL', 'INQUERITO']).optional(),
  ativa: z.boolean().optional()
})

// GET - Buscar comissão por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Comissão')
  
  const comissao = await prisma.comissao.findUnique({
    where: { id },
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
  
  if (!comissao) {
    throw new NotFoundError('Comissão')
  }
  
  return createSuccessResponse(comissao, 'Comissão encontrada com sucesso')
})

// PUT - Atualizar comissão
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Comissão')
  const body = await request.json()
  
  // Validar dados
  const validatedData = UpdateComissaoSchema.parse(body)
  
  // Verificar se comissão existe
  const existingComissao = await prisma.comissao.findUnique({
    where: { id }
  })
  
  if (!existingComissao) {
    throw new NotFoundError('Comissão')
  }
  
  // Verificar duplicatas (se nome foi alterado)
  if (validatedData.nome && validatedData.nome !== existingComissao.nome) {
    const duplicateCheck = await prisma.comissao.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            nome: {
              equals: validatedData.nome,
              mode: 'insensitive'
            }
          }
        ]
      }
    })
    
    if (duplicateCheck) {
      throw new ConflictError('Já existe uma comissão com este nome')
    }
  }
  
  const updatedComissao = await prisma.comissao.update({
    where: { id },
    data: {
      ...(validatedData.nome && { nome: validatedData.nome }),
      ...(validatedData.descricao !== undefined && { descricao: validatedData.descricao || null }),
      ...(validatedData.tipo && { tipo: validatedData.tipo }),
      ...(validatedData.ativa !== undefined && { ativa: validatedData.ativa })
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

  await syncComissaoHistorico(id)
  
  return createSuccessResponse(
    updatedComissao,
    'Comissão atualizada com sucesso'
  )
})

// DELETE - Excluir comissão
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Comissão')
  
  // Verificar se comissão existe
  const existingComissao = await prisma.comissao.findUnique({
    where: { id }
  })
  
  if (!existingComissao) {
    throw new NotFoundError('Comissão')
  }
  
  // Hard delete - remover do banco
  await prisma.comissao.delete({
    where: { id }
  })

  await prisma.historicoParticipacao.updateMany({
    where: {
      tipo: 'COMISSAO',
      referenciaId: id,
      ativo: true
    },
    data: {
      ativo: false,
      dataFim: new Date()
    }
  })
  
  return createSuccessResponse(
    null,
    'Comissão excluída com sucesso'
  )
})

