/**
 * API de Dados Abertos - Comissoes
 * Retorna comissoes e seus membros
 */

import { NextRequest, NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'
import { convertToCSV } from '@/lib/utils/csv-export'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  enforceRateLimit(request, 'PUBLIC')

  const info = await dadosAbertosService.getInfo()

  const { searchParams } = new URL(request.url)
  const formato = searchParams.get('formato') || 'json'
  const tipo = searchParams.get('tipo') || undefined
  const ativaParam = searchParams.get('ativa')
  const ativa = ativaParam !== null ? ativaParam === 'true' : null

  const { dados } = await dadosAbertosService.getComissoes({ tipo, ativa })

  if (formato === 'csv') {
    // Para CSV, expandir membros em linhas separadas
    const linhas: Record<string, unknown>[] = []
    for (const c of dados) {
      if (c.membros.length === 0) {
        linhas.push({
          comissao_id: c.id,
          comissao_nome: c.nome,
          comissao_tipo: c.tipo,
          comissao_ativa: c.ativa ? 'Sim' : 'Nao',
          membro_cargo: '',
          membro_nome: '',
          membro_partido: ''
        })
      } else {
        for (const m of c.membros) {
          linhas.push({
            comissao_id: c.id,
            comissao_nome: c.nome,
            comissao_tipo: c.tipo,
            comissao_ativa: c.ativa ? 'Sim' : 'Nao',
            membro_cargo: m.cargo,
            membro_nome: m.parlamentar.nome,
            membro_partido: m.parlamentar.partido
          })
        }
      }
    }

    const csv = convertToCSV(linhas, [
      'comissao_id', 'comissao_nome', 'comissao_tipo', 'comissao_ativa',
      'membro_cargo', 'membro_nome', 'membro_partido'
    ])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="comissoes.csv"'
      }
    })
  }

  return withPublicCache(
    NextResponse.json({
    dados,
    metadados: {
      total: dados.length,
      atualizacao: new Date().toISOString(),
      fonte: info.nomeCasa
    }
  }),
    { maxAge: 60, swr: 300 }
  )
})
