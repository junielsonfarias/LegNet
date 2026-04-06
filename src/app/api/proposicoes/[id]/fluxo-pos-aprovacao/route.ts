import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const AcaoSchema = z.object({
  acao: z.enum(['sancionar', 'vetar', 'derrubar-veto', 'arquivar', 'promulgar']),
  motivo: z.string().optional(),
  dataAcao: z.string().optional(),
  tipoVeto: z.enum(['TOTAL', 'PARCIAL']).optional(),
})

// POST - Execute post-approval actions
export const POST = withAuth(async (request, context, session) => {
  const { id } = await (context as any).params
  const body = await request.json()
  const data = AcaoSchema.parse(body)

  const proposicao = await prisma.proposicao.findUnique({
    where: { id },
    select: { id: true, status: true, numero: true, ano: true, tipo: true, titulo: true }
  })

  if (!proposicao) throw new NotFoundError('Proposição')

  const statusAtual = proposicao.status
  let novoStatus: string
  let descricaoAcao: string

  switch (data.acao) {
    case 'sancionar':
      if (statusAtual !== 'APROVADA') throw new ValidationError('Apenas proposições APROVADAS podem ser sancionadas')
      novoStatus = 'SANCIONADA'
      descricaoAcao = 'Proposição sancionada pelo Executivo'
      break

    case 'vetar':
      if (statusAtual !== 'APROVADA') throw new ValidationError('Apenas proposições APROVADAS podem ser vetadas')
      novoStatus = 'VETADA'
      descricaoAcao = `Proposição vetada pelo Executivo (${data.tipoVeto || 'TOTAL'}): ${data.motivo || 'Sem justificativa'}`
      break

    case 'derrubar-veto':
      if (statusAtual !== 'VETADA') throw new ValidationError('Apenas proposições VETADAS podem ter veto derrubado')
      novoStatus = 'SANCIONADA'
      descricaoAcao = 'Veto derrubado pela Câmara por maioria absoluta'
      break

    case 'arquivar':
      if (!['REJEITADA', 'VETADA', 'RETIRADA'].includes(statusAtual)) {
        throw new ValidationError('Apenas proposições REJEITADAS, VETADAS ou RETIRADAS podem ser arquivadas')
      }
      novoStatus = 'ARQUIVADA'
      descricaoAcao = `Proposição arquivada: ${data.motivo || 'Encerramento do processo legislativo'}`
      break

    case 'promulgar':
      if (statusAtual !== 'SANCIONADA') throw new ValidationError('Apenas proposições SANCIONADAS podem ser promulgadas')
      novoStatus = 'PROMULGADA'
      descricaoAcao = 'Proposição promulgada e publicada'
      break

    default:
      throw new ValidationError('Ação inválida')
  }

  const updated = await prisma.proposicao.update({
    where: { id },
    data: { status: novoStatus as any }
  })

  await logAudit({
    request,
    session,
    action: `PROPOSICAO_${data.acao.toUpperCase()}`,
    entity: 'Proposicao',
    entityId: id,
    metadata: {
      statusAnterior: statusAtual,
      novoStatus,
      motivo: data.motivo,
      descricao: descricaoAcao
    }
  })

  return createSuccessResponse(updated, descricaoAcao)
}, { permissions: 'tramitacao.manage' })
