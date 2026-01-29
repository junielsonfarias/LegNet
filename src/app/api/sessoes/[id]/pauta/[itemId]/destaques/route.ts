import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { obterSessaoParaControle, resolverSessaoId } from '@/lib/services/sessao-controle'

export const dynamic = 'force-dynamic'

const DestaqueSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tipoVotacao: z.enum(['NOMINAL', 'SECRETA', 'SIMBOLICA', 'LEITURA']).default('NOMINAL'),
  parlamentarId: z.string().optional() // Quem solicitou o destaque
})

const VotarDestaqueSchema = z.object({
  votosSim: z.number().int().min(0),
  votosNao: z.number().int().min(0),
  votosAbstencao: z.number().int().min(0),
  resultado: z.enum(['APROVADO', 'REJEITADO'])
})

// GET - Listar destaques de um item
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) => {
  const sessaoId = await resolverSessaoId(params.id)
  const itemId = params.itemId

  const item = await prisma.pautaItem.findFirst({
    where: {
      id: itemId,
      pauta: {
        sessaoId
      }
    },
    include: {
      destaques: {
        orderBy: { solicitadoEm: 'asc' }
      }
    }
  })

  if (!item) {
    throw new NotFoundError('Item da pauta')
  }

  return createSuccessResponse(item.destaques, 'Destaques listados com sucesso')
})

// POST - Criar destaque
export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) => {
  const sessaoId = await resolverSessaoId(params.id)
  const itemId = params.itemId

  const body = await request.json()
  const data = DestaqueSchema.parse(body)

  // Verificar sessão
  const sessao = await obterSessaoParaControle(sessaoId)
  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para criar destaques')
  }

  // Verificar item
  const item = await prisma.pautaItem.findFirst({
    where: {
      id: itemId,
      pauta: {
        sessaoId
      }
    }
  })

  if (!item) {
    throw new NotFoundError('Item da pauta')
  }

  if (!['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status)) {
    throw new ValidationError('Só é possível criar destaque de item em discussão ou votação')
  }

  const destaque = await prisma.destaquePautaItem.create({
    data: {
      pautaItemId: itemId,
      titulo: data.titulo,
      descricao: data.descricao,
      tipoVotacao: data.tipoVotacao,
      solicitadoPor: data.parlamentarId
    }
  })

  return createSuccessResponse(destaque, 'Destaque criado com sucesso')
}), { permissions: 'sessao.manage' })

// PATCH - Votar/atualizar destaque
export const PATCH = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) => {
  const sessaoId = await resolverSessaoId(params.id)
  const itemId = params.itemId

  const url = new URL(request.url)
  const destaqueId = url.searchParams.get('destaqueId')

  if (!destaqueId) {
    throw new ValidationError('ID do destaque é obrigatório')
  }

  const body = await request.json()
  const data = VotarDestaqueSchema.parse(body)

  // Verificar sessão
  const sessao = await obterSessaoParaControle(sessaoId)
  if (sessao.status !== 'EM_ANDAMENTO') {
    throw new ValidationError('A sessão deve estar em andamento para votar destaques')
  }

  // Verificar destaque
  const destaque = await prisma.destaquePautaItem.findFirst({
    where: {
      id: destaqueId,
      pautaItemId: itemId
    }
  })

  if (!destaque) {
    throw new NotFoundError('Destaque')
  }

  if (destaque.status !== 'PENDENTE' && destaque.status !== 'EM_VOTACAO') {
    throw new ValidationError('Este destaque já foi votado')
  }

  const destaqueAtualizado = await prisma.destaquePautaItem.update({
    where: { id: destaqueId },
    data: {
      votosSim: data.votosSim,
      votosNao: data.votosNao,
      votosAbstencao: data.votosAbstencao,
      resultado: data.resultado,
      status: data.resultado === 'APROVADO' ? 'APROVADO' : 'REJEITADO',
      votadoEm: new Date()
    }
  })

  return createSuccessResponse(destaqueAtualizado, 'Destaque votado com sucesso')
}), { permissions: 'sessao.manage' })

// DELETE - Remover destaque
export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) => {
  const sessaoId = await resolverSessaoId(params.id)
  const itemId = params.itemId

  const url = new URL(request.url)
  const destaqueId = url.searchParams.get('destaqueId')

  if (!destaqueId) {
    throw new ValidationError('ID do destaque é obrigatório')
  }

  // Verificar destaque
  const destaque = await prisma.destaquePautaItem.findFirst({
    where: {
      id: destaqueId,
      pautaItemId: itemId,
      pautaItem: {
        pauta: {
          sessaoId
        }
      }
    }
  })

  if (!destaque) {
    throw new NotFoundError('Destaque')
  }

  if (destaque.status !== 'PENDENTE') {
    throw new ValidationError('Não é possível excluir destaque já votado')
  }

  await prisma.destaquePautaItem.delete({
    where: { id: destaqueId }
  })

  return createSuccessResponse(null, 'Destaque excluído com sucesso')
}), { permissions: 'sessao.manage' })
