import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { unidadesTramitacaoDbService } from '@/lib/services/unidades-tramitacao-db-service'

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
  nome: z.string().min(1).nullish().transform(v => v ?? undefined),
  sigla: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tipo: TipoUnidadeEnum.optional(),
  ativo: z.boolean().nullish().transform(v => v ?? undefined)
})

// GET - Obter unidade de tramitação por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params

  const unidade = await unidadesTramitacaoDbService.getByIdWithFullCount(id)

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
  const existente = await unidadesTramitacaoDbService.getById(id)

  if (!existente) {
    throw new NotFoundError('Unidade de tramitação não encontrada')
  }

  // Verificar nome duplicado (se estiver alterando)
  if (data.nome && data.nome !== (existente as any).nome) {
    const duplicado = await unidadesTramitacaoDbService.checkDuplicateName(data.nome, id)

    if (duplicado) {
      throw new ValidationError('Já existe uma unidade de tramitação com este nome')
    }
  }

  // Verificar sigla duplicada (se estiver alterando)
  if (data.sigla && data.sigla !== (existente as any).sigla) {
    const siglaDuplicada = await unidadesTramitacaoDbService.checkDuplicateSigla(data.sigla, id)

    if (siglaDuplicada) {
      throw new ValidationError('Já existe uma unidade de tramitação com esta sigla')
    }
  }

  const unidade = await unidadesTramitacaoDbService.update(id, data)

  return createSuccessResponse(unidade)
}, { permissions: 'config.manage' })

// DELETE - Excluir unidade de tramitação
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }
) => {
  const { id } = await params

  // Verificar se existe
  const existente = await unidadesTramitacaoDbService.getByIdWithFullCount(id)

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

  await unidadesTramitacaoDbService.remove(id)

  return createSuccessResponse({ message: 'Unidade de tramitação excluída com sucesso' })
}, { permissions: 'config.manage' })
