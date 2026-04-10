/**
 * API de Dados Abertos - Votacoes
 * Retorna votacoes nominais realizadas
 */

import { NextRequest, NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { withErrorHandler } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  enforceRateLimit(request, 'PUBLIC')

  const info = await dadosAbertosService.getInfo()

  const { searchParams } = new URL(request.url)
  const formato = searchParams.get('formato') || 'json'
  const anoParam = searchParams.get('ano')
  const ano = anoParam ? parseInt(anoParam, 10) : undefined
  const proposicaoId = searchParams.get('proposicao') || undefined
  const parlamentarId = searchParams.get('parlamentar') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const { dados, total } = await dadosAbertosService.getVotacoes(
    { ano, proposicaoId, parlamentarId },
    { page, limit }
  )

  if (formato === 'csv') {
    const csv = convertToCSV(dados.map(v => ({
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
})

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
