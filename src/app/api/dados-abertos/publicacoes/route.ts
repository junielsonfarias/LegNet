/**
 * API de Dados Abertos - Publicacoes
 * Retorna leis, decretos, portarias e outros documentos
 */

import { NextRequest, NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, 'PUBLIC')

    const info = await dadosAbertosService.getInfo()

    const { searchParams } = new URL(request.url)
    const formato = searchParams.get('formato') || 'json'
    const tipo = searchParams.get('tipo') || undefined
    const anoParam = searchParams.get('ano')
    const ano = anoParam ? parseInt(anoParam, 10) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const { dados, total } = await dadosAbertosService.getPublicacoes(
      { tipo, ano },
      { page, limit }
    )

    if (formato === 'csv') {
      const csv = convertToCSV(dados.map(p => ({
        id: p.id,
        titulo: p.titulo,
        tipo: p.tipo,
        numero: p.numero,
        ano: p.ano,
        descricao: p.descricao || '',
        data: p.data,
        arquivo_url: p.arquivo_url || '',
        autor_nome: p.autor?.nome || ''
      })), [
        'id', 'titulo', 'tipo', 'numero', 'ano', 'descricao',
        'data', 'arquivo_url', 'autor_nome'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="publicacoes.csv"'
        }
      })
    }

    return NextResponse.json({
      dados,
      metadados: {
        total,
        pagina: page,
        limite: limit,
        paginas: Math.ceil(total / limit),
        atualizacao: new Date().toISOString(),
        fonte: info.nomeCasa
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 429 }
      )
    }
    console.error('Erro ao buscar publicacoes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
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
