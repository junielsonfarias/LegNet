import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { tiposTramitacaoDbService } from '@/lib/services/tipos-tramitacao-db-service'

export const dynamic = 'force-dynamic'

const CreateTipoTramitacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  prazoRegimental: z.number().int().min(0).default(15),
  prazoLegal: z.number().int().min(0).optional(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0).optional(),
  unidadeResponsavelId: z.string().nullish().transform(v => v ?? undefined)
})

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')
  const search = searchParams.get('search') || undefined

  const tipos = await tiposTramitacaoDbService.list({
    ativo: ativo !== null ? ativo === 'true' : undefined,
    search
  })

  return createSuccessResponse(tipos)
}, { permissions: 'config.view' })

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  const validation = CreateTipoTramitacaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError('Dados inválidos', validation.error.errors)
  }

  const data = validation.data

  const existente = await tiposTramitacaoDbService.checkDuplicateName(data.nome)
  if (existente) {
    throw new ValidationError('Já existe um tipo de tramitação com este nome')
  }

  if (data.ordem === undefined) {
    data.ordem = await tiposTramitacaoDbService.getNextOrder()
  }

  const tipo = await tiposTramitacaoDbService.create(data)

  return createSuccessResponse(tipo, 'Tipo de tramitação criado com sucesso', undefined, 201)
}, { permissions: 'config.manage' })
