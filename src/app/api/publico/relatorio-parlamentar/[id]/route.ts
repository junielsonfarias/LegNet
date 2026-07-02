import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'


export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : new Date().getFullYear()

  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id },
    include: {
      mandatos: { orderBy: { dataInicio: 'desc' }, take: 1 },
    },
  })

  if (!parlamentar) {
    throw new NotFoundError('Parlamentar')
  }

  // Presencas - using PresencaSessao model (has `presente` boolean, not `status`)
  const presencas = await prisma.presencaSessao.findMany({
    where: {
      parlamentarId: id,
      sessao: {
        data: {
          gte: new Date(`${ano}-01-01`),
          lt: new Date(`${ano + 1}-01-01`),
        },
      },
    },
  })

  const presentes = presencas.filter((p) => p.presente).length
  // Denominador = sessões CONCLUIDA no período de mandato ∩ ano (ERR-060), não
  // presencas.length (que daria 100% quando ausências não são registradas).
  const mandato = parlamentar.mandatos[0]
  const gteCand = [mandato?.dataInicio ?? null, new Date(`${ano}-01-01`)]
    .filter((d): d is Date => !!d)
  const lteCand = [mandato?.dataFim ?? null, new Date(`${ano}-12-31T23:59:59.999Z`)]
    .filter((d): d is Date => !!d)
  const gte = new Date(Math.max(...gteCand.map((d) => d.getTime())))
  const lte = new Date(Math.min(...lteCand.map((d) => d.getTime())))
  const totalSessoes = await prisma.sessao.count({
    where: { status: 'CONCLUIDA', data: { gte, lte } },
  })

  // Votos - Votacao model has voto field with TipoVoto enum
  const votos = await prisma.votacao.findMany({
    where: {
      parlamentarId: id,
      proposicao: {
        ano,
      },
    },
  })

  const votosSim = votos.filter((v) => v.voto === 'SIM').length
  const votosNao = votos.filter((v) => v.voto === 'NAO').length
  const votosAbstencao = votos.filter((v) => v.voto === 'ABSTENCAO').length

  // Proposicoes de autoria
  const proposicoes = await prisma.proposicao.findMany({
    where: { autorId: id, ano },
    select: { id: true, tipo: true, numero: true, ano: true, ementa: true, status: true },
    orderBy: { numero: 'desc' },
  })

  // Comissoes
  const comissoes = await prisma.membroComissao.findMany({
    where: { parlamentarId: id },
    include: { comissao: { select: { id: true, nome: true, sigla: true, tipo: true } } },
  })

  return withPublicCache(createSuccessResponse({
    parlamentar: {
      id: parlamentar.id,
      nome: parlamentar.nome,
      partido: parlamentar.partido,
      email: parlamentar.email,
      foto: parlamentar.foto,
      mandato: parlamentar.mandatos[0] || null,
    },
    ano,
    presenca: {
      totalSessoes,
      presentes,
      percentual: totalSessoes > 0 ? Math.round((presentes / totalSessoes) * 100) : 0,
    },
    votacoes: {
      total: votos.length,
      sim: votosSim,
      nao: votosNao,
      abstencao: votosAbstencao,
    },
    proposicoes: { total: proposicoes.length, lista: proposicoes },
    comissoes: comissoes.map((mc) => ({ comissao: mc.comissao, cargo: mc.cargo })),
  }), { maxAge: 60, swr: 300 })
})
