/**
 * API de Dados Abertos - Parlamentares
 * Retorna lista de parlamentares com dados publicos
 */

import { NextRequest, NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, 'PUBLIC')

    const { searchParams } = new URL(request.url)
    const formato = searchParams.get('formato') || 'json'
    const legislaturaId = searchParams.get('legislatura') || undefined

    const [info, { dados }] = await Promise.all([
      dadosAbertosService.getInfo(),
      dadosAbertosService.getParlamentares({ legislaturaId })
    ])

    // Retornar em formato CSV se solicitado
    if (formato === 'csv') {
      const csv = convertToCSV(dados, [
        'id', 'nome', 'apelido', 'partido', 'cargo', 'email', 'telefone'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="parlamentares.csv"'
        }
      })
    }

    return NextResponse.json({
      dados,
      metadados: {
        total: dados.length,
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
    console.error('Erro ao buscar parlamentares:', error)
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
