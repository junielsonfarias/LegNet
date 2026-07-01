/**
 * Central de Revisão — entrada MANUAL de voto nominal.
 *
 * POST { proposicaoId, sessaoId?, votos: [{ parlamentarId, voto }] }
 * Cria/atualiza os `Votacao` individuais e o `VotacaoAgrupada`, e ajusta o
 * `Proposicao.resultado` conforme a apuração. Para os documentos de votação
 * nominal com marca manuscrita que o OCR não leu.
 */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const schema = z.object({
  proposicaoId: z.string().min(1),
  sessaoId: z.string().nullish(),
  votos: z.array(z.object({ parlamentarId: z.string().min(1), voto: z.enum(['SIM', 'NAO', 'ABSTENCAO', 'AUSENTE']) })).min(1),
})

export const POST = withAuth(async (request: NextRequest) => {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) throw new ValidationError('Dados inválidos', parsed.error.flatten())
  const { proposicaoId, votos } = parsed.data

  const prop = await prisma.proposicao.findUnique({ where: { id: proposicaoId }, select: { id: true, sessaoVotacaoId: true } })
  if (!prop) throw new NotFoundError('Proposição')
  const sessaoId = parsed.data.sessaoId || prop.sessaoVotacaoId || null

  for (const v of votos) {
    await prisma.votacao.upsert({
      where: { proposicaoId_parlamentarId_turno: { proposicaoId, parlamentarId: v.parlamentarId, turno: 1 } },
      update: { voto: v.voto },
      create: { proposicaoId, parlamentarId: v.parlamentarId, voto: v.voto, turno: 1, sessaoId },
    })
  }

  const sim = votos.filter((v) => v.voto === 'SIM').length
  const nao = votos.filter((v) => v.voto === 'NAO').length
  const abst = votos.filter((v) => v.voto === 'ABSTENCAO').length
  const presentes = votos.filter((v) => v.voto !== 'AUSENTE').length
  const resultado = sim > nao ? 'APROVADA' : nao > sim ? 'REJEITADA' : 'EMPATE'

  if (sessaoId) {
    const existente = await prisma.votacaoAgrupada.findFirst({ where: { proposicaoId, sessaoId, turno: 1 }, select: { id: true } })
    const dados = { votosSim: sim, votosNao: nao, votosAbstencao: abst, totalPresentes: presentes, totalMembros: votos.length, resultado: resultado as never, tipoVotacao: 'NOMINAL' as never }
    if (existente) await prisma.votacaoAgrupada.update({ where: { id: existente.id }, data: dados })
    else await prisma.votacaoAgrupada.create({ data: { proposicaoId, sessaoId, turno: 1, ...dados } })
  }
  await prisma.proposicao.update({ where: { id: proposicaoId }, data: { resultado: resultado as never, revisadoEm: new Date(), ...(sessaoId ? { sessaoVotacaoId: sessaoId } : {}) } })

  return createSuccessResponse({ proposicaoId, sim, nao, abst, resultado }, 'Votação nominal registrada')
}, { permissions: 'tramitacao.manage' })
