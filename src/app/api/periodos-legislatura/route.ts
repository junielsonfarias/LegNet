import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, ValidationError, ConflictError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação
const PeriodoLegislaturaSchema = z.object({
  legislaturaId: z.string().min(1, 'Legislatura é obrigatória'),
  numero: z.number().min(1, 'Número do período deve ser maior que 0'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  descricao: z.string().optional()
})

// GET - Listar períodos
export const GET = withAuth(async (request: NextRequest, _ctx, _session) => {
  const { searchParams } = new URL(request.url)
  const legislaturaId = searchParams.get('legislaturaId')
  
  const where: any = {}
  if (legislaturaId) {
    where.legislaturaId = legislaturaId
  }
  
  const periodos = await prisma.periodoLegislatura.findMany({
    where,
    include: {
      legislatura: true,
      cargos: {
        orderBy: {
          ordem: 'asc'
        }
      }
    },
    orderBy: [
      { numero: 'asc' }
    ]
  })
  
  return createSuccessResponse(periodos, 'Períodos listados com sucesso')
}, { permissions: 'periodo.view' })

// POST - Criar período
export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  
  // Validar dados
  const validatedData = PeriodoLegislaturaSchema.parse(body)
  const dataInicio = new Date(validatedData.dataInicio)
  const dataFim = validatedData.dataFim ? new Date(validatedData.dataFim) : null
  
  if (Number.isNaN(dataInicio.getTime())) {
    throw new ValidationError('Data de início inválida')
  }
  
  if (dataFim && Number.isNaN(dataFim.getTime())) {
    throw new ValidationError('Data de fim inválida')
  }
  
  if (dataFim && dataFim < dataInicio) {
    throw new ValidationError('A data de fim não pode ser anterior à data de início')
  }
  
  // Verificar se legislatura existe
  const legislatura = await prisma.legislatura.findUnique({
    where: { id: validatedData.legislaturaId }
  })
  
  if (!legislatura) {
    throw new ValidationError('Legislatura não encontrada')
  }
  
  const legislaturaInicio = new Date(legislatura.anoInicio, 0, 1)
  const legislaturaFim = new Date(legislatura.anoFim, 11, 31)

  if (dataInicio < legislaturaInicio || dataInicio > legislaturaFim) {
    throw new ValidationError('A data de início deve estar dentro do intervalo da legislatura')
  }

  if (dataFim && (dataFim < legislaturaInicio || dataFim > legislaturaFim)) {
    throw new ValidationError('A data de fim deve estar dentro do intervalo da legislatura')
  }

  // Verificar se já existe período com mesmo número na legislatura
  const periodoExistente = await prisma.periodoLegislatura.findUnique({
    where: {
      legislaturaId_numero: {
        legislaturaId: validatedData.legislaturaId,
        numero: validatedData.numero
      }
    }
  })
  
  if (periodoExistente) {
    throw new ConflictError('Já existe um período com este número nesta legislatura')
  }
  
  // Verificar sobreposição de datas
  const periodoSobreposto = await prisma.periodoLegislatura.findFirst({
    where: {
      legislaturaId: validatedData.legislaturaId,
      AND: [
        {
          dataInicio: {
            lte: dataFim ?? dataInicio
          }
        },
        {
          OR: [
            { dataFim: null },
            { dataFim: { gte: dataInicio } }
          ]
        }
      ]
    }
  })

  if (periodoSobreposto) {
    throw new ConflictError('As datas informadas se sobrepõem a outro período desta legislatura')
  }
  
  const periodo = await prisma.periodoLegislatura.create({
    data: {
      legislaturaId: validatedData.legislaturaId,
      numero: validatedData.numero,
      dataInicio,
      dataFim,
      descricao: validatedData.descricao || null
    },
    include: {
      legislatura: true,
      cargos: true
    }
  })
  
  await logAudit({
    request,
    session,
    action: 'PERIODO_CREATE',
    entity: 'PeriodoLegislatura',
    entityId: periodo.id,
    metadata: {
      legislaturaId: validatedData.legislaturaId,
      numero: validatedData.numero,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim ? dataFim.toISOString() : null
    }
  })
  
  return createSuccessResponse(periodo, 'Período criado com sucesso', undefined, 201)
}, { permissions: 'periodo.manage' })

