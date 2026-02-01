/**
 * API de Dados Abertos - Proposicoes
 * Retorna lista de proposicoes legislativas
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
    const anoParam = searchParams.get('ano')
    const ano = anoParam ? parseInt(anoParam, 10) : undefined
    const tipo = searchParams.get('tipo')
    const status = searchParams.get('status')
    const autorId = searchParams.get('autor')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where = {
      ...(ano && { ano }),
      ...(tipo && { tipo: tipo as 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'INDICACAO' | 'REQUERIMENTO' | 'MOCAO' | 'VOTO_PESAR' | 'VOTO_APLAUSO' }),
      ...(status && { status: status as 'APRESENTADA' | 'EM_TRAMITACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA' }),
      ...(autorId && { autorId })
    }

    const [proposicoes, total] = await Promise.all([
      prisma.proposicao.findMany({
        where,
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          ementa: true,
          status: true,
          dataApresentacao: true,
          dataVotacao: true,
          autor: {
            select: {
              id: true,
              nome: true,
              partido: true
            }
          },
          _count: {
            select: {
              tramitacoes: true,
              votacoes: true
            }
          }
        },
        orderBy: [{ ano: 'desc' }, { numero: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.proposicao.count({ where })
    ])

    const dadosFormatados = proposicoes.map(p => ({
      id: p.id,
      numero: p.numero,
      ano: p.ano,
      tipo: p.tipo,
      ementa: p.ementa,
      status: p.status,
      data_apresentacao: p.dataApresentacao?.toISOString().split('T')[0] || null,
      data_votacao: p.dataVotacao?.toISOString().split('T')[0] || null,
      autor: p.autor ? {
        id: p.autor.id,
        nome: p.autor.nome,
        partido: p.autor.partido
      } : null,
      total_tramitacoes: p._count.tramitacoes,
      total_votacoes: p._count.votacoes
    }))

    if (formato === 'csv') {
      const csv = convertToCSV(dadosFormatados.map(p => ({
        ...p,
        autor_nome: p.autor?.nome || '',
        autor_partido: p.autor?.partido || ''
      })), [
        'id', 'numero', 'ano', 'tipo', 'ementa', 'status', 'data_apresentacao', 'data_votacao', 'autor_nome', 'autor_partido'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="proposicoes.csv"'
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
    console.error('Erro ao buscar proposicoes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados de proposicoes' },
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
