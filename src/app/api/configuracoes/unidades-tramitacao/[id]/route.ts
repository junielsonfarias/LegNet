import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'

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

const UpdateUnidadeTramitacaoSchema = z.object({
  nome: z.string().min(1).optional(),
  sigla: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tipo: TipoUnidadeEnum.optional(),
  ativo: z.boolean().optional()
})

// GET - Obter unidade de tramitação por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params

  const unidade = await prisma.tramitacaoUnidade.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          tramitacoes: true,
          tiposResponsaveis: true
        }
      }
    }
  })

  if (!unidade) {
    throw new NotFoundError('Unidade de tramitação não encontrada')
  }

  return createSuccessResponse(unidade)
}, { permissions: 'config.view' })

// PUT - Atualizar unidade de tramitação
export const PUT = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params
  const body = await request.json()

  const validation = UpdateUnidadeTramitacaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError('Dados inválidos', validation.error.errors)
  }

  const data = validation.data

  // Verificar se existe
  const existente = await prisma.tramitacaoUnidade.findUnique({
    where: { id }
  })

  if (!existente) {
    throw new NotFoundError('Unidade de tramitação não encontrada')
  }

  // Verificar nome duplicado (se estiver alterando)
  if (data.nome && data.nome !== existente.nome) {
    const duplicado = await prisma.tramitacaoUnidade.findFirst({
      where: {
        nome: data.nome,
        id: { not: id }
      }
    })

    if (duplicado) {
      throw new ValidationError('Já existe uma unidade de tramitação com este nome')
    }
  }

  // Verificar sigla duplicada (se estiver alterando)
  if (data.sigla && data.sigla !== existente.sigla) {
    const siglaDuplicada = await prisma.tramitacaoUnidade.findFirst({
      where: {
        sigla: data.sigla,
        id: { not: id }
      }
    })

    if (siglaDuplicada) {
      throw new ValidationError('Já existe uma unidade de tramitação com esta sigla')
    }
  }

  const unidade = await prisma.tramitacaoUnidade.update({
    where: { id },
    data: {
      nome: data.nome,
      sigla: data.sigla,
      descricao: data.descricao,
      tipo: data.tipo,
      ativo: data.ativo
    }
  })

  return createSuccessResponse(unidade)
}, { permissions: 'config.manage' })

// DELETE - Excluir unidade de tramitação
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params

  // Verificar se existe
  const existente = await prisma.tramitacaoUnidade.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          tramitacoes: true,
          tiposResponsaveis: true
        }
      }
    }
  })

  if (!existente) {
    throw new NotFoundError('Unidade de tramitação não encontrada')
  }

  // Verificar se está em uso
  if (existente._count.tramitacoes > 0 || existente._count.tiposResponsaveis > 0) {
    throw new ValidationError(
      `Esta unidade de tramitação está em uso em ${existente._count.tramitacoes} tramitação(ões) ` +
      `e ${existente._count.tiposResponsaveis} tipo(s) de tramitação. Desative-a em vez de excluir.`
    )
  }

  await prisma.tramitacaoUnidade.delete({
    where: { id }
  })

  return createSuccessResponse({ message: 'Unidade de tramitação excluída com sucesso' })
}, { permissions: 'config.manage' })
