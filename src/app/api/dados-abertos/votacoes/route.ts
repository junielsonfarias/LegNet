/**
 * API de Dados Abertos - Votacoes
 * Retorna votacoes nominais realizadas
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Buscar configuração institucional
    const config = await prisma.configuracaoInstitucional.findFirst({
      where: { slug: 'principal' }
    })
    const nomeCasa = config?.nomeCasa || 'Câmara Municipal'

    const { searchParams } = new URL(request.url)
    const formato = searchParams.get('formato') || 'json'
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
    const proposicaoId = searchParams.get('proposicao')
    const parlamentarId = searchParams.get('parlamentar')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where = {
      ...(ano && {
        proposicao: {
          ano
        }
      }),
      ...(proposicaoId && { proposicaoId }),
      ...(parlamentarId && { parlamentarId })
    }

    const [votacoes, total] = await Promise.all([
      prisma.votacao.findMany({
        where,
        select: {
          id: true,
          voto: true,
          createdAt: true,
          parlamentar: {
            select: {
              id: true,
              nome: true,
              partido: true
            }
          },
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              tipo: true,
              ementa: true,
              sessao: {
                select: {
                  id: true,
                  numero: true,
                  tipo: true,
                  data: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.votacao.count({ where })
    ])

    const dadosFormatados = votacoes.map(v => ({
      id: v.id,
      voto: v.voto,
      data_voto: v.createdAt.toISOString(),
      parlamentar: {
        id: v.parlamentar.id,
        nome: v.parlamentar.nome,
        partido: v.parlamentar.partido
      },
      proposicao: v.proposicao ? {
        id: v.proposicao.id,
        numero: v.proposicao.numero,
        ano: v.proposicao.ano,
        tipo: v.proposicao.tipo,
        ementa: v.proposicao.ementa
      } : null,
      sessao: v.proposicao?.sessao ? {
        id: v.proposicao.sessao.id,
        numero: v.proposicao.sessao.numero,
        tipo: v.proposicao.sessao.tipo,
        data: v.proposicao.sessao.data.toISOString().split('T')[0]
      } : null
    }))

    if (formato === 'csv') {
      const csv = convertToCSV(dadosFormatados.map(v => ({
        id: v.id,
        voto: v.voto,
        data_voto: v.data_voto,
        parlamentar_nome: v.parlamentar.nome,
        parlamentar_partido: v.parlamentar.partido,
        proposicao_numero: v.proposicao?.numero || '',
        proposicao_ano: v.proposicao?.ano || '',
        proposicao_tipo: v.proposicao?.tipo || '',
        sessao_numero: v.sessao?.numero || '',
        sessao_data: v.sessao?.data || ''
      })), [
        'id', 'voto', 'data_voto', 'parlamentar_nome', 'parlamentar_partido',
        'proposicao_numero', 'proposicao_ano', 'proposicao_tipo', 'sessao_numero', 'sessao_data'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="votacoes.csv"'
        }
      })
    }

    return NextResponse.json({
      dados: dadosFormatados,
      metadados: {
        total,
        pagina: page,
        limite: limit,
        paginas: Math.ceil(total / limit),
        atualizacao: new Date().toISOString(),
        fonte: nomeCasa
      }
    })
  } catch (error) {
    console.error('Erro ao buscar votacoes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados de votacoes' },
      { status: 500 }
    )
  }
}

function convertToCSV(data: Record<string, unknown>[], campos: string[]): string {
  const header = campos.join(';')
  const rows = data.map(item =>
    campos.map(campo => {
      const valor = item[campo]
      if (valor === null || valor === undefined) return ''
      if (typeof valor === 'string' && valor.includes(';')) {
        return `"${valor}"`
      }
      return String(valor)
    }).join(';')
  )
  return [header, ...rows].join('\n')
}
