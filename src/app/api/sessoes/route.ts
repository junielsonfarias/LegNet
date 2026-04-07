import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { sessaoDbService } from '@/lib/services/sessao-db-service'
import { combineDateAndTimeUTC } from '@/lib/utils/date'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para sessão
const SessaoSchema = z.object({
  numero: z.number().min(1, 'Número da sessão é obrigatório').optional(),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']),
  data: z.string().min(1, 'Data é obrigatória'),
  horario: z.string().nullish().transform(v => v ?? undefined),
  local: z.string().nullish().transform(v => v ?? undefined),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'SUSPENSA', 'CONCLUIDA', 'CANCELADA']).default('AGENDADA'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  ata: z.string().nullish().transform(v => v ?? undefined),
  finalizada: z.boolean().default(false),
  legislaturaId: z.string().nullish().transform(v => v ?? undefined),
  periodoId: z.string().nullish().transform(v => v ?? undefined),
  tempoInicio: z.string().nullish().transform(v => v ?? undefined),
  urlAudio: z.string().nullish().transform(v => v ?? undefined),
  urlVideo: z.string().nullish().transform(v => v ?? undefined),
  urlTransmissao: z.string().nullish().transform(v => v ?? undefined),
  arquivoPauta: z.string().nullish().transform(v => v ?? undefined),
  arquivoAta: z.string().nullish().transform(v => v ?? undefined),
  temaSolene: z.string().nullish().transform(v => v ?? undefined)
})

// GET - Listar sessões (PUBLICO - dados de transparencia)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const tipo = searchParams.get('tipo') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const result = await sessaoDbService.list(
    { status, tipo },
    { page, limit }
  )

  return createSuccessResponse(
    result.data,
    'Sessões listadas com sucesso',
    result.pagination.total,
    200,
    result.pagination
  )
})

// POST - Criar sessão
export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  let body
  try {
    body = await request.json()
  } catch (error) {
    throw new ValidationError('Body inválido')
  }

  // Validar dados
  let validatedData
  try {
    // Converter numero para number se for string
    if (typeof body.numero === 'string') {
      body.numero = parseInt(body.numero, 10)
    }

    validatedData = SessaoSchema.parse(body)

    // Validação de data no backend
    const dataSessao = combineDateAndTimeUTC(validatedData.data, validatedData.horario)
    const agora = new Date()

    // Se não for finalizada, verificar se a data é válida
    // Permitimos sessões para hoje (independente do horário) ou futuras
    if (!validatedData.finalizada) {
      // Comparar apenas as datas (ignorando o horário)
      const dataHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
      const dataSessaoSemHora = new Date(dataSessao.getFullYear(), dataSessao.getMonth(), dataSessao.getDate())

      if (dataSessaoSemHora < dataHoje) {
        throw new ValidationError('A data da sessão não pode ser no passado para sessões não finalizadas')
      }
    }

    // Se for finalizada, permitir data passada mas validar formato
    if (validatedData.finalizada && isNaN(dataSessao.getTime())) {
      throw new ValidationError('Data inválida')
    }
  } catch (error: any) {
    throw new ValidationError(error.errors?.[0]?.message || error.message || 'Dados inválidos')
  }

  // Delegar criação ao serviço
  const result = await sessaoDbService.create(validatedData, session?.user?.id)

  await logAudit({
    request,
    session,
    action: 'SESSAO_CREATE',
    entity: 'Sessao',
    entityId: result.sessao!.id,
    metadata: {
      numero: result.sessao!.numero,
      tipo: result.sessao!.tipo,
      status: result.sessao!.status,
      legislaturaId: result.legislaturaId,
      periodoId: result.periodoId
    }
  })

  return createSuccessResponse(
    result.sessao,
    'Sessão criada com sucesso',
    undefined,
    201
  )
})
