import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const TipoUnidadeEnum = z.enum([
  'COMISSAO',
  'MESA_DIRETORA',
  'PLENARIO',
  'PREFEITURA',
  'SECRETARIA',
  'GABINETE',
  'ARQUIVO',
  'PROTOCOLO',
  'ASSESSORIA',
  'OUTROS'
])

const CreateUnidadeTramitacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sigla: z.string().optional(),
  descricao: z.string().optional(),
  tipo: TipoUnidadeEnum,
  ativo: z.boolean().default(true)
})

// GET - Listar unidades de tramitação
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const ativo = searchParams.get('ativo')
  const tipo = searchParams.get('tipo')?.toUpperCase()
  const search = searchParams.get('search')

  const where: any = {}

  if (ativo !== null) {
    where.ativo = ativo === 'true'
  }

  if (tipo && TipoUnidadeEnum.options.includes(tipo as any)) {
    where.tipo = tipo
  }

  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { sigla: { contains: search, mode: 'insensitive' } },
      { descricao: { contains: search, mode: 'insensitive' } }
    ]
  }

  const unidades = await prisma.tramitacaoUnidade.findMany({
    where,
    include: {
      _count: {
        select: {
          tramitacoes: true
        }
      }
    },
    orderBy: [
      { tipo: 'asc' },
      { nome: 'asc' }
    ]
  })

  return createSuccessResponse(unidades)
}, { permissions: 'config.view' })

// POST - Criar unidade de tramitação
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  const validation = CreateUnidadeTramitacaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError('Dados inválidos', validation.error.errors)
  }

  const data = validation.data

  // Verificar nome duplicado
  const existente = await prisma.tramitacaoUnidade.findFirst({
    where: { nome: data.nome }
  })

  if (existente) {
    throw new ValidationError('Já existe uma unidade de tramitação com este nome')
  }

  // Verificar sigla duplicada (se informada)
  if (data.sigla) {
    const siglaDuplicada = await prisma.tramitacaoUnidade.findFirst({
      where: { sigla: data.sigla }
    })

    if (siglaDuplicada) {
      throw new ValidationError('Já existe uma unidade de tramitação com esta sigla')
    }
  }

  const unidade = await prisma.tramitacaoUnidade.create({
    data: {
      nome: data.nome,
      sigla: data.sigla,
      descricao: data.descricao,
      tipo: data.tipo,
      ativo: data.ativo
    }
  })

  return createSuccessResponse(unidade, 'Unidade de tramitação criada com sucesso', undefined, 201)
}, { permissions: 'config.manage' })
