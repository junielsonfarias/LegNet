/**
 * API de Dados Abertos - Presencas
 * Retorna registro de presenca em sessoes
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formato = searchParams.get('formato') || 'json'
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
    const parlamentarId = searchParams.get('parlamentar')
    const sessaoId = searchParams.get('sessao')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where = {
      ...(ano && {
        sessao: {
          data: {
            gte: new Date(ano, 0, 1),
            lt: new Date(ano + 1, 0, 1)
          }
        }
      }),
      ...(parlamentarId && { parlamentarId }),
      ...(sessaoId && { sessaoId })
    }

    const [presencas, total] = await Promise.all([
      prisma.presencaSessao.findMany({
        where,
        select: {
          id: true,
          presente: true,
          justificativa: true,
          createdAt: true,
          parlamentar: {
            select: {
              id: true,
              nome: true,
              partido: true
            }
          },
          sessao: {
            select: {
              id: true,
              numero: true,
              tipo: true,
              data: true
            }
          }
        },
        orderBy: { sessao: { data: 'desc' } },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.presencaSessao.count({ where })
    ])

    const dadosFormatados = presencas.map(p => ({
      id: p.id,
      presente: p.presente,
      justificativa: p.justificativa,
      registrado_em: p.createdAt.toISOString(),
      parlamentar: {
        id: p.parlamentar.id,
        nome: p.parlamentar.nome,
        partido: p.parlamentar.partido
      },
      sessao: {
        id: p.sessao.id,
        numero: p.sessao.numero,
        tipo: p.sessao.tipo,
        data: p.sessao.data.toISOString().split('T')[0]
      }
    }))

    if (formato === 'csv') {
      const csv = convertToCSV(dadosFormatados.map(p => ({
        id: p.id,
        presente: p.presente ? 'Sim' : 'Nao',
        justificativa: p.justificativa || '',
        registrado_em: p.registrado_em,
        parlamentar_nome: p.parlamentar.nome,
        parlamentar_partido: p.parlamentar.partido,
        sessao_numero: p.sessao.numero,
        sessao_tipo: p.sessao.tipo,
        sessao_data: p.sessao.data
      })), [
        'id', 'presente', 'justificativa', 'registrado_em',
        'parlamentar_nome', 'parlamentar_partido', 'sessao_numero', 'sessao_tipo', 'sessao_data'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="presencas.csv"'
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
        fonte: 'Camara Municipal de Mojui dos Campos'
      }
    })
  } catch (error) {
    console.error('Erro ao buscar presencas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados de presencas' },
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
