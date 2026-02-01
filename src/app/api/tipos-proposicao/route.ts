/**
 * API de Tipos de Proposição
 * CRUD para configurações de tipos de proposição
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema de validação para criar/atualizar tipo de proposição
const TipoProposicaoSchema = z.object({
  codigo: z.string()
    .min(3, 'Codigo deve ter no minimo 3 caracteres')
    .max(50, 'Codigo deve ter no maximo 50 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'Codigo deve conter apenas letras maiusculas, numeros e underscore'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  sigla: z.string().min(1, 'Sigla é obrigatória').max(10, 'Sigla deve ter no máximo 10 caracteres'),
  descricao: z.string().optional().nullable(),
  prazoLimite: z.number().int().min(0).optional().nullable(),
  requerVotacao: z.boolean().default(true),
  requerSancao: z.boolean().default(false),
  numeracaoAnual: z.boolean().default(true),
  prefixoNumeracao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().default(0),
  corBadge: z.string().optional().nullable(),
  icone: z.string().optional().nullable()
})

// GET - Listar tipos de proposição
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apenasAtivos = searchParams.get('ativo') === 'true'

    const tipos = await prisma.tipoProposicaoConfig.findMany({
      where: apenasAtivos ? { ativo: true } : undefined,
      orderBy: { ordem: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: tipos
    })
  } catch (error) {
    console.error('Erro ao buscar tipos de proposição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar tipos de proposição' },
      { status: 500 }
    )
  }
}

// POST - Criar novo tipo de proposição
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validatedData = TipoProposicaoSchema.parse(body)

    // Verificar se já existe um tipo com o mesmo código
    const existente = await prisma.tipoProposicaoConfig.findUnique({
      where: { codigo: validatedData.codigo }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma configuração para este tipo de proposição' },
        { status: 400 }
      )
    }

    const tipo = await prisma.tipoProposicaoConfig.create({
      data: validatedData
    })

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
