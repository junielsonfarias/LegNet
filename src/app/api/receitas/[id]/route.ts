import { NextRequest } from 'next/server'
import { receitasDbService } from '@/lib/services/receitas-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/financeiro/receitas-detalhe')

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const receita = await receitasDbService.getById(id)

  if (!receita) {
    throw new NotFoundError('Receita')
  }

  return createSuccessResponse(receita)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const receitaExistente = await receitasDbService.getById(id)
  if (!receitaExistente) {
    throw new NotFoundError('Receita')
  }

  const receitaAtualizada = await receitasDbService.update(id, {
    numero: body.numero,
    ano: body.ano,
    mes: body.mes,
    data: body.data,
    contribuinte: body.contribuinte,
    cnpjCpf: body.cnpjCpf,
    unidade: body.unidade,
    categoria: body.categoria,
    origem: body.origem,
    especie: body.especie,
    rubrica: body.rubrica,
    valorPrevisto: body.valorPrevisto !== undefined ? parseFloat(body.valorPrevisto) : undefined,
    valorArrecadado: body.valorArrecadado !== undefined ? parseFloat(body.valorArrecadado) : undefined,
    situacao: body.situacao,
    fonteRecurso: body.fonteRecurso,
    observacoes: body.observacoes
  })

  log.info('Receita atualizada', {
    action: 'receita_update',
    id,
    situacao: receitaAtualizada.situacao
  })

  return createSuccessResponse(receitaAtualizada, 'Receita atualizada com sucesso')
}, { permissions: 'financeiro.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const receitaExistente = await receitasDbService.getById(id)
  if (!receitaExistente) {
    throw new NotFoundError('Receita')
  }

  await receitasDbService.remove(id)

  log.info('Receita excluída', {
    action: 'receita_delete',
    id,
    numero: receitaExistente.numero
  })

  return createSuccessResponse(null, 'Receita excluida com sucesso')
}, { permissions: 'financeiro.manage' })
