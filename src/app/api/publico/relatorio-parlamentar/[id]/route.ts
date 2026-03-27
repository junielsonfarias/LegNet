import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json({ success: false, error: 'Parlamentar nao encontrado' }, { status: 404 })
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

    const totalSessoes = presencas.length
    const presentes = presencas.filter((p) => p.presente).length

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

    return NextResponse.json({
      success: true,
      data: {
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
      },
    })
  } catch (error) {
    console.error('Erro ao gerar relatorio parlamentar:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
