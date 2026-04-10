/**
 * API de Dados Abertos - Presencas
 * Retorna registro de presenca em sessoes
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
  const parlamentarId = searchParams.get('parlamentar') || undefined
  const sessaoId = searchParams.get('sessao') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const { dados, total } = await dadosAbertosService.getPresencas(
    { ano, parlamentarId, sessaoId },
    { page, limit }
  )

  if (formato === 'csv') {
    const csv = convertToCSV(dados.map(p => ({
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
