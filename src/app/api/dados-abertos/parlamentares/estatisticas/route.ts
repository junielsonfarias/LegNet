/**
 * API de Dados Abertos - Estatísticas dos Parlamentares
 * Retorna contagem de sessões e proposições por parlamentar
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Buscar todos os parlamentares ativos com contagens
    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        cargo: true,
        partido: true,
        _count: {
          select: {
            presencas: {
              where: { presente: true }
            },
            proposicoes: true
          }
        }
      },
      orderBy: [
        { cargo: 'asc' },
        { nome: 'asc' }
      ]
    })

    const dadosFormatados = parlamentares.map(p => ({
      id: p.id,
      nome: p.nome,
      cargo: p.cargo,
      partido: p.partido,
      sessoes: p._count.presencas,
      materias: p._count.proposicoes
    }))

    return NextResponse.json({
      dados: dadosFormatados,
      metadados: {
        total: parlamentares.length,
        atualizacao: new Date().toISOString(),
        fonte: 'Câmara Municipal de Mojuí dos Campos'
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos parlamentares:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
