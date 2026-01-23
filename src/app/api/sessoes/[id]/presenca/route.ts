import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError
} from '@/lib/error-handler'
import { assertSessaoPermitePresenca, obterSessaoParaControle, resolverSessaoId } from '@/lib/services/sessao-controle'

export const dynamic = 'force-dynamic'

const PresencaSchema = z.object({
  parlamentarId: z.string(),
  presente: z.boolean(),
  justificativa: z.string().nullable().optional()
})

// GET - Listar presenças da sessão
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const sessaoId = await resolverSessaoId(params.id)

  await obterSessaoParaControle(sessaoId)

  const presencas = await prisma.presencaSessao.findMany({
    where: { sessaoId },
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

  // Ordenar manualmente para evitar problemas com orderBy em relacionamentos no mock
  presencas.sort((a, b) => {
    const nomeA = a.parlamentar?.nome || ''
    const nomeB = b.parlamentar?.nome || ''
    return nomeA.localeCompare(nomeB, 'pt-BR')
  })

  return createSuccessResponse(presencas, 'Presenças listadas com sucesso')
})

// POST - Registrar/Atualizar presença
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const sessaoId = await resolverSessaoId(params.id)
  const body = await request.json()

  const validatedData = PresencaSchema.parse(body)

  // Verificar se sessão existe
  const sessao = await obterSessaoParaControle(sessaoId)
  assertSessaoPermitePresenca(sessao)

  // Verificar se parlamentar existe
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: validatedData.parlamentarId }
  })

  if (!parlamentar) {
    throw new NotFoundError('Parlamentar')
  }

  // Criar ou atualizar presença
  const presenca = await prisma.presencaSessao.upsert({
    where: {
      sessaoId_parlamentarId: {
        sessaoId,
        parlamentarId: validatedData.parlamentarId
      }
    },
    update: {
      presente: validatedData.presente,
      justificativa: validatedData.justificativa || null
    },
    create: {
      sessaoId,
      parlamentarId: validatedData.parlamentarId,
      presente: validatedData.presente,
      justificativa: validatedData.justificativa || null
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

  return createSuccessResponse(presenca, 'Presença registrada com sucesso')
})

