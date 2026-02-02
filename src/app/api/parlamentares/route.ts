import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  ConflictError,
  validateEmail,
  validatePhone
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

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

// Schema de validação para parlamentar
const ParlamentarSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .refine(val => val.trim().length > 0, 'Nome não pode ser vazio'),
  apelido: z.string()
    .min(2, 'Apelido deve ter pelo menos 2 caracteres')
    .max(50, 'Apelido deve ter no máximo 50 caracteres')
    .refine(val => val.trim().length > 0, 'Apelido não pode ser vazio'),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']),
  partido: z.string()
    .min(2, 'Partido deve ter pelo menos 2 caracteres')
    .max(50, 'Partido deve ter no máximo 50 caracteres')
    .optional(),
  legislatura: z.string()
    .min(4, 'Legislatura deve ter pelo menos 4 caracteres')
    .max(20, 'Legislatura deve ter no máximo 20 caracteres'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .refine(val => !val || validateEmail(val), 'Email deve ter formato válido'),
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 caracteres')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .refine(val => !val || validatePhone(val), 'Telefone deve ter formato válido'),
  biografia: z.string().optional(),
  ativo: z.boolean().default(true),
  mandatos: z.array(MandatoSchema).optional(),
  filiacoes: z.array(FiliacaoSchema).optional()
})

// GET - Listar parlamentares
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')
  const cargo = searchParams.get('cargo')
  const partido = searchParams.get('partido')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Máximo 100 por página

  // Construir filtros
  const where: any = {}
  
  if (ativo !== null) {
    where.ativo = ativo === 'true'
  }
  
  if (cargo) {
    where.cargo = cargo
  }
  
  if (partido) {
    where.partido = { contains: partido, mode: 'insensitive' }
  }
  
  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { apelido: { contains: search, mode: 'insensitive' } },
      { partido: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Buscar legislatura atual para ordenação
  const legislaturaAtual = await prisma.legislatura.findFirst({
    where: { ativa: true },
    orderBy: { anoInicio: 'desc' }
  })

  const [parlamentares, total] = await Promise.all([
    prisma.parlamentar.findMany({
      where,
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
          where: { ativa: true },
          orderBy: {
            dataInicio: 'desc'
          },
          take: 1
        }
      } as any,
      orderBy: [
        { cargo: 'asc' },
        { nome: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.parlamentar.count({ where })
  ])

  // Ordenar no JavaScript: parlamentares da legislatura atual primeiro
  if (legislaturaAtual) {
    parlamentares.sort((a: any, b: any) => {
      const aTemMandatoAtual = a.mandatos?.some((m: any) => m.legislaturaId === legislaturaAtual.id && m.ativo) || false
      const bTemMandatoAtual = b.mandatos?.some((m: any) => m.legislaturaId === legislaturaAtual.id && m.ativo) || false
      
      if (aTemMandatoAtual && !bTemMandatoAtual) return -1
      if (!aTemMandatoAtual && bTemMandatoAtual) return 1
      
      // Se ambos têm ou não têm, manter ordem original (cargo, nome)
      return 0
    })
  }

  return createSuccessResponse(
    parlamentares,
    'Parlamentares listados com sucesso',
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

// POST - Criar parlamentar
// SEGURANÇA: Requer autenticação e permissão de gestão de parlamentares
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  
  // Validar dados
  const validatedData = ParlamentarSchema.parse(body)
  
  // Verificar se já existe parlamentar com mesmo nome/apelido
  const existingParlamentar = await prisma.parlamentar.findFirst({
    where: {
      OR: [
        { nome: validatedData.nome },
        { apelido: validatedData.apelido }
      ]
    }
  })
  
  if (existingParlamentar) {
    throw new ConflictError('Já existe um parlamentar com este nome ou apelido')
  }
  
  // Criar parlamentar com mandatos e filiações
  const parlamentar = await prisma.parlamentar.create({
    data: {
      nome: validatedData.nome,
      apelido: validatedData.apelido,
      cargo: validatedData.cargo,
      partido: validatedData.partido || null,
      legislatura: validatedData.legislatura,
      email: validatedData.email || null,
      telefone: validatedData.telefone || null,
      biografia: validatedData.biografia || null,
      ativo: validatedData.ativo ?? true,
      mandatos: validatedData.mandatos ? {
        create: validatedData.mandatos.map(m => ({
          legislaturaId: m.legislaturaId,
          numeroVotos: m.numeroVotos,
          cargo: m.cargo,
          dataInicio: new Date(m.dataInicio),
          dataFim: m.dataFim ? new Date(m.dataFim) : null,
          ativo: true
        }))
      } : undefined,
      filiacoes: validatedData.filiacoes ? {
        create: validatedData.filiacoes.map(f => ({
          partido: f.partido,
          dataInicio: new Date(f.dataInicio),
          dataFim: f.dataFim ? new Date(f.dataFim) : null,
          ativa: true
        }))
      } : undefined
    },
    include: {
      mandatos: {
        include: {
          legislatura: true
        }
      },
      filiacoes: true
    } as any
  })
  
  return createSuccessResponse(
    parlamentar,
    'Parlamentar criado com sucesso',
    undefined,
    201
  )
}, { permissions: 'parlamentar.manage' })
