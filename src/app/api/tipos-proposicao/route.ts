import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { tiposProposicaoDbService } from '@/lib/services/tipos-proposicao-db-service'

export const dynamic = 'force-dynamic'

const APLICACOES_QUORUM = [
  'VOTACAO_SIMPLES',
  'VOTACAO_ABSOLUTA',
  'VOTACAO_QUALIFICADA',
  'VOTACAO_URGENCIA'
] as const

const TipoProposicaoSchema = z.object({
  codigo: z.string()
    .min(3, 'Codigo deve ter no minimo 3 caracteres')
    .max(50, 'Codigo deve ter no maximo 50 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'Codigo deve conter apenas letras maiusculas, numeros e underscore'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  sigla: z.string().min(1, 'Sigla é obrigatória').max(10, 'Sigla deve ter no máximo 10 caracteres'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  prazoLimite: z.number().int().min(0).optional().nullable(),
  requerVotacao: z.boolean().default(true),
  requerSancao: z.boolean().default(false),
  numeracaoAnual: z.boolean().default(true),
  prefixoNumeracao: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().default(true),
  ordem: z.number().int().default(0),
  corBadge: z.string().nullish().transform(v => v ?? undefined),
  icone: z.string().nullish().transform(v => v ?? undefined),
  quorumAplicacao: z.enum(APLICACOES_QUORUM).nullish().transform(v => v ?? undefined),
  quorumAplicacao2Turno: z.enum(APLICACOES_QUORUM).nullish().transform(v => v ?? undefined),
  totalTurnos: z.number().int().min(1).max(2).default(1),
  intersticioDias: z.number().int().min(0).max(30).default(0)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apenasAtivos = searchParams.get('ativo') === 'true'

    const tipos = await tiposProposicaoDbService.list({
      ativo: apenasAtivos ? true : undefined
    })

    return NextResponse.json({ success: true, data: tipos })
  } catch (error) {
    console.error('Erro ao buscar tipos de proposição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar tipos de proposição' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validatedData = TipoProposicaoSchema.parse(body)

    const existente = await tiposProposicaoDbService.getByCodigo(validatedData.codigo)
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma configuração para este tipo de proposição' },
        { status: 400 }
      )
    }

    const tipo = await tiposProposicaoDbService.create(validatedData)

    return NextResponse.json({
      success: true,
      data: tipo,
      message: 'Tipo de proposição criado com sucesso'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao criar tipo de proposição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar tipo de proposição' },
      { status: 500 }
    )
  }
}, { permissions: 'config.manage' })
