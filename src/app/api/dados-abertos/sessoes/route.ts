/**
 * API de Dados Abertos - Sessoes
 * Retorna lista de sessoes legislativas
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
    const tipo = searchParams.get('tipo')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where = {
      ...(ano && {
        data: {
          gte: new Date(ano, 0, 1),
          lt: new Date(ano + 1, 0, 1)
        }
      }),
      ...(tipo && { tipo: tipo as 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL' }),
      ...(status && { status: status as 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' })
    }

    const [sessoes, total] = await Promise.all([
      prisma.sessao.findMany({
        where,
        select: {
          id: true,
          numero: true,
          tipo: true,
          data: true,
          horario: true,
          local: true,
          status: true,
          descricao: true,
          _count: {
            select: {
              presencas: true,
              proposicoes: true
            }
          },
          legislatura: {
            select: {
              numero: true,
              anoInicio: true,
              anoFim: true
            }
          }
        },
        orderBy: { data: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.sessao.count({ where })
    ])

    const dadosFormatados = sessoes.map(s => ({
      id: s.id,
      numero: s.numero,
      tipo: s.tipo,
      data: s.data.toISOString().split('T')[0],
      horario: s.horario,
      local: s.local,
      status: s.status,
      descricao: s.descricao,
      total_presencas: s._count.presencas,
      total_proposicoes: s._count.proposicoes,
      legislatura: s.legislatura ? {
        numero: s.legislatura.numero,
        ano_inicio: s.legislatura.anoInicio,
        ano_fim: s.legislatura.anoFim
      } : null
    }))

    if (formato === 'csv') {
      const csv = convertToCSV(dadosFormatados, [
        'id', 'numero', 'tipo', 'data', 'horario', 'local', 'status', 'total_presencas', 'total_proposicoes'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="sessoes.csv"'
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
    console.error('Erro ao buscar sessoes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados de sessoes' },
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
