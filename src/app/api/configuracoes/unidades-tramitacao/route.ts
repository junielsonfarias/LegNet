import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { unidadesTramitacaoDbService } from '@/lib/services/unidades-tramitacao-db-service'

export const dynamic = 'force-dynamic'

const TipoUnidadeEnum = z.enum([
  'COMISSAO', 'MESA_DIRETORA', 'PLENARIO', 'PREFEITURA',
  'SECRETARIA', 'GABINETE', 'ARQUIVO', 'PROTOCOLO', 'ASSESSORIA', 'OUTROS'
])

const CreateUnidadeTramitacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sigla: z.string().nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  tipo: TipoUnidadeEnum,
  ativo: z.boolean().default(true)
})

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')
  const tipo = searchParams.get('tipo')?.toUpperCase()
  const search = searchParams.get('search') || undefined

  const unidades = await unidadesTramitacaoDbService.list({
    ativo: ativo !== null ? ativo === 'true' : undefined,
    tipo: tipo && TipoUnidadeEnum.options.includes(tipo as any) ? tipo : undefined,
    search
  })

  return createSuccessResponse(unidades)
}, { permissions: 'config.view' })

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  const validation = CreateUnidadeTramitacaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError('Dados inválidos', validation.error.errors)
  }

  const data = validation.data

  const existente = await unidadesTramitacaoDbService.checkDuplicateName(data.nome)
  if (existente) {
    throw new ValidationError('Já existe uma unidade de tramitação com este nome')
  }

  if (data.sigla) {
    const siglaDuplicada = await unidadesTramitacaoDbService.checkDuplicateSigla(data.sigla)
    if (siglaDuplicada) {
      throw new ValidationError('Já existe uma unidade de tramitação com esta sigla')
    }
  }

  const unidade = await unidadesTramitacaoDbService.create(data)

  return createSuccessResponse(unidade, 'Unidade de tramitação criada com sucesso', undefined, 201)
}, { permissions: 'config.manage' })
