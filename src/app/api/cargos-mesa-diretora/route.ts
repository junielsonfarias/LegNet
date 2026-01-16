import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { 
  withErrorHandler, 
  createSuccessResponse, 
  ValidationError,
  ConflictError
} from '@/lib/error-handler'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação
const CargoMesaDiretoraSchema = z.object({
  periodoId: z.string().min(1, 'Período é obrigatório'),
  nome: z.string().min(2, 'Nome do cargo deve ter pelo menos 2 caracteres'),
  ordem: z.number().min(1, 'Ordem deve ser maior que 0'),
  obrigatorio: z.boolean().default(true)
})

// GET - Listar cargos
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const periodoId = searchParams.get('periodoId')
  
  const where: any = {}
  if (periodoId) {
    where.periodoId = periodoId
  }
  
  const cargos = await prisma.cargoMesaDiretora.findMany({
    where,
    include: {
      periodo: {
        include: {
          legislatura: true
        }
      }
    },
    orderBy: {
      ordem: 'asc'
    }
  })
  
  return createSuccessResponse(cargos, 'Cargos listados com sucesso')
})

// POST - Criar cargo
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  // Validar dados
  const validatedData = CargoMesaDiretoraSchema.parse(body)
  
  // Verificar se período existe
  const periodo = await prisma.periodoLegislatura.findUnique({
    where: { id: validatedData.periodoId }
  })
  
  if (!periodo) {
    throw new ValidationError('Período não encontrado')
  }
  
  // Verificar se já existe cargo com mesmo nome no período
  const cargoExistente = await prisma.cargoMesaDiretora.findUnique({
    where: {
      periodoId_nome: {
        periodoId: validatedData.periodoId,
        nome: validatedData.nome
      }
    }
  })
  
  if (cargoExistente) {
    throw new ConflictError('Já existe um cargo com este nome neste período')
  }
  
  const cargo = await prisma.cargoMesaDiretora.create({
    data: {
      periodoId: validatedData.periodoId,
      nome: validatedData.nome,
      ordem: validatedData.ordem,
      obrigatorio: validatedData.obrigatorio ?? true
    },
    include: {
      periodo: {
        include: {
          legislatura: true
        }
      }
    }
  })
  
  return createSuccessResponse(cargo, 'Cargo criado com sucesso', undefined, 201)
})

