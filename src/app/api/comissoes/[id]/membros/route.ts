import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import {
  createSuccessResponse,
  NotFoundError,
  ConflictError,
  ValidationError,
  validateId,
  withErrorHandler
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { syncComissaoHistorico } from '@/lib/participation-history'

export const dynamic = 'force-dynamic'

const MembroComissaoSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'RELATOR', 'MEMBRO']),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional()
})

export const GET = withAuth(withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const comissaoId = validateId(params.id, 'Comissão')

  const comissao = await prisma.comissao.findUnique({ where: { id: comissaoId } })
  if (!comissao) {
    throw new NotFoundError('Comissão')
  }

  const membros = await prisma.membroComissao.findMany({
    where: { comissaoId },
    orderBy: { dataInicio: 'desc' },
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
  })

  return createSuccessResponse(membros, 'Membros da comissão carregados com sucesso', membros.length)
}), { permissions: 'comissao.view' })

export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const comissaoId = validateId(params.id, 'Comissão')
  const body = await request.json()
  const data = MembroComissaoSchema.parse(body)

  const comissao = await prisma.comissao.findUnique({ where: { id: comissaoId } })
  if (!comissao) {
    throw new NotFoundError('Comissão')
  }

  const membrosExistentes = await prisma.membroComissao.findMany({
    where: {
      comissaoId,
      parlamentarId: data.parlamentarId
    }
  })

  if (membrosExistentes.length > 0) {
    throw new ConflictError('Este parlamentar já está vinculado à comissão')
  }

  const inicio = new Date(data.dataInicio)
  if (Number.isNaN(inicio.getTime())) {
    throw new ValidationError('Data de início inválida')
  }
  const fim = data.dataFim ? new Date(data.dataFim) : null
  if (fim && Number.isNaN(fim.getTime())) {
    throw new ValidationError('Data de fim inválida')
  }
  if (fim && fim < inicio) {
    throw new ValidationError('A data de fim não pode ser anterior à data de início')
  }

  const membro = await prisma.membroComissao.create({
    data: {
      comissaoId,
      parlamentarId: data.parlamentarId,
      cargo: data.cargo,
      dataInicio: inicio,
      dataFim: fim,
      ativo: data.ativo,
      observacoes: data.observacoes || null
    },
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
  })

  await syncComissaoHistorico(comissaoId)

  return createSuccessResponse(membro, 'Membro adicionado com sucesso')
}), { permissions: 'comissao.manage' })

