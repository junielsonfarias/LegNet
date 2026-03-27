import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET - Verificar se ha sessao ao vivo (publico)
 */
export async function GET() {
  try {
    const sessaoAtiva = await prisma.sessao.findFirst({
      where: {
        status: 'EM_ANDAMENTO',
      },
      include: {
        pautaSessao: {
          include: {
            itens: {
              include: {
                proposicao: {
                  select: { id: true, numero: true, ano: true, ementa: true, tipo: true },
                },
              },
              orderBy: { ordem: 'asc' },
            },
          },
        },
      },
      orderBy: { data: 'desc' },
    })

    if (!sessaoAtiva) {
      const proximaSessao = await prisma.sessao.findFirst({
        where: {
          status: 'AGENDADA',
          data: { gte: new Date() },
        },
        orderBy: { data: 'asc' },
      })

      return NextResponse.json({
        success: true,
        aoVivo: false,
        proximaSessao: proximaSessao
          ? {
              id: proximaSessao.id,
              tipo: proximaSessao.tipo,
              dataInicio: proximaSessao.data,
              titulo: `Sessao ${proximaSessao.tipo} ${proximaSessao.numero}`,
            }
          : null,
      })
    }

    const itens = sessaoAtiva.pautaSessao?.itens || []

    return NextResponse.json({
      success: true,
      aoVivo: true,
      sessao: {
        id: sessaoAtiva.id,
        tipo: sessaoAtiva.tipo,
        titulo: `Sessao ${sessaoAtiva.tipo} ${sessaoAtiva.numero}`,
        dataInicio: sessaoAtiva.data,
        urlTransmissao: sessaoAtiva.urlTransmissao,
        pauta: itens.map((item) => ({
          ordem: item.ordem,
          descricao: item.descricao || item.titulo,
          proposicao: item.proposicao,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao verificar sessao ao vivo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
