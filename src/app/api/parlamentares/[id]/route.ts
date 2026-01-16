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

// Schema de validação para mandato
const MandatoSchema = z.object({
  legislaturaId: z.string().min(1, 'Legislatura é obrigatória'),
  numeroVotos: z.number().min(0, 'Número de votos deve ser positivo').default(0),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional()
})

// Schema de validação para filiação
const FiliacaoSchema = z.object({
  partido: z.string().min(2, 'Partido deve ter pelo menos 2 caracteres'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional()
})

// Schema de validação para atualização
const UpdateParlamentarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  apelido: z.string().min(2, 'Apelido deve ter pelo menos 2 caracteres').optional(),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']).optional(),
  partido: z.string().min(2, 'Partido deve ter pelo menos 2 caracteres').optional(),
  legislatura: z.string().min(4, 'Legislatura deve ter pelo menos 4 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres').optional(),
  biografia: z.string().optional(),
  ativo: z.boolean().optional(),
  mandatos: z.array(MandatoSchema).optional(),
  filiacoes: z.array(FiliacaoSchema).optional()
})

// GET - Buscar parlamentar por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Parlamentar')
  
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id },
    include: {
      mandatos: {
        include: {
          legislatura: true
        },
        orderBy: {
          dataInicio: 'desc'
        }
      },
      filiacoes: {
        orderBy: {
          dataInicio: 'desc'
        }
      }
    }
  })
  
  if (!parlamentar) {
    throw new NotFoundError('Parlamentar')
  }
  
  return createSuccessResponse(parlamentar, 'Parlamentar encontrado com sucesso')
})

// PUT - Atualizar parlamentar
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Parlamentar')
  const body = await request.json()
  
  // Validar dados
  const validatedData = UpdateParlamentarSchema.parse(body)
  
  // Verificar se parlamentar existe
  const existingParlamentar = await prisma.parlamentar.findUnique({
    where: { id }
  })
  
  if (!existingParlamentar) {
    throw new NotFoundError('Parlamentar')
  }
  
  // Verificar duplicatas (se nome ou apelido foram alterados)
  if (validatedData.nome || validatedData.apelido) {
    const duplicateCheck = await prisma.parlamentar.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { nome: validatedData.nome || existingParlamentar.nome },
              { apelido: validatedData.apelido || existingParlamentar.apelido }
            ]
          }
        ]
      }
    })
    
    if (duplicateCheck) {
      throw new ConflictError('Já existe um parlamentar com este nome ou apelido')
    }
  }
  
  // Preparar dados para atualização
  const updateData: any = {
    ...(validatedData.nome && { nome: validatedData.nome }),
    ...(validatedData.apelido && { apelido: validatedData.apelido }),
    ...(validatedData.cargo && { cargo: validatedData.cargo }),
    ...(validatedData.partido !== undefined && { partido: validatedData.partido || null }),
    ...(validatedData.legislatura && { legislatura: validatedData.legislatura }),
    ...(validatedData.email !== undefined && { email: validatedData.email || null }),
    ...(validatedData.telefone !== undefined && { telefone: validatedData.telefone || null }),
    ...(validatedData.biografia !== undefined && { biografia: validatedData.biografia || null }),
    ...(validatedData.ativo !== undefined && { ativo: validatedData.ativo })
  }

  // Atualizar mandatos se fornecidos
  if (validatedData.mandatos) {
    // Deletar mandatos existentes e criar novos
    await prisma.mandato.deleteMany({
      where: { parlamentarId: id }
    })
    updateData.mandatos = {
      create: validatedData.mandatos.map(m => ({
        legislaturaId: m.legislaturaId,
        numeroVotos: m.numeroVotos,
        cargo: m.cargo,
        dataInicio: new Date(m.dataInicio),
        dataFim: m.dataFim ? new Date(m.dataFim) : null,
        ativo: true
      }))
    }
  }

  // Atualizar filiações se fornecidas
  if (validatedData.filiacoes) {
    // Deletar filiações existentes e criar novas
    await prisma.filiacao.deleteMany({
      where: { parlamentarId: id }
    })
    updateData.filiacoes = {
      create: validatedData.filiacoes.map(f => ({
        partido: f.partido,
        dataInicio: new Date(f.dataInicio),
        dataFim: f.dataFim ? new Date(f.dataFim) : null,
        ativa: true
      }))
    }
  }

  const updatedParlamentar = await prisma.parlamentar.update({
    where: { id },
    data: updateData,
    include: {
      mandatos: {
        include: {
          legislatura: true
        }
      },
      filiacoes: true
    }
  })
  
  return createSuccessResponse(
    updatedParlamentar,
    'Parlamentar atualizado com sucesso'
  )
})

// DELETE - Excluir parlamentar
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Parlamentar')
  
  // Verificar se parlamentar existe
  const existingParlamentar = await prisma.parlamentar.findUnique({
    where: { id }
  })
  
  if (!existingParlamentar) {
    throw new NotFoundError('Parlamentar')
  }
  
  // Soft delete - marcar como inativo
  await prisma.parlamentar.update({
    where: { id },
    data: { ativo: false }
  })
  
  return createSuccessResponse(
    null,
    'Parlamentar excluído com sucesso'
  )
})
