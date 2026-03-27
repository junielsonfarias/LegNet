/**
 * API de Dados Abertos - Estatísticas dos Parlamentares
 * Retorna contagem de sessões e proposições por parlamentar
 */

import { NextRequest, NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, 'PUBLIC')

    const [info, { dados, total }] = await Promise.all([
      dadosAbertosService.getInfo(),
      dadosAbertosService.getEstatisticasParlamentares()
    ])

    return NextResponse.json({
      dados,
      metadados: {
        total,
        atualizacao: new Date().toISOString(),
        fonte: info.nomeCasa
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
