import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { converterProposicaoEmNorma } from '@/lib/services/norma-juridica-service'
import { TipoNormaJuridica } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ConverterNormaSchema = z.object({
  tipoNorma: z.nativeEnum(TipoNormaJuridica, {
    errorMap: () => ({ message: 'Tipo de norma inválido. Valores aceitos: LEI_ORDINARIA, LEI_COMPLEMENTAR, DECRETO_LEGISLATIVO, RESOLUCAO, EMENDA_LEI_ORGANICA, LEI_ORGANICA, REGIMENTO_INTERNO' })
  }),
  numero: z.string().min(1, 'Número é obrigatório'),
  dataPublicacao: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Data de publicação inválida' }
  )
})

// POST - Converter proposição aprovada em norma jurídica
// SEGURANCA: Requer autenticacao e permissao 'norma.manage'
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const body = await request.json()

  // Validar dados de entrada
  const validatedData = ConverterNormaSchema.parse(body)

  // Verificar se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id },
    select: { id: true, status: true, numero: true, ano: true, tipo: true }
  })

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  // Verificar se o status permite conversão
  const statusPermitidos = ['APROVADA', 'SANCIONADA']
  if (!statusPermitidos.includes(proposicao.status)) {
    throw new ValidationError(
      `Proposição não pode ser convertida em norma. Status atual: ${proposicao.status}. Status permitidos: ${statusPermitidos.join(', ')}`
    )
  }

  // Converter proposição em norma
  const norma = await converterProposicaoEmNorma(
    proposicao.id,
    validatedData.tipoNorma,
    validatedData.numero,
    new Date(validatedData.dataPublicacao)
  )

  return createSuccessResponse(
    norma,
    'Proposição convertida em norma jurídica com sucesso'
  )
}, { permissions: 'tramitacao.manage' })
