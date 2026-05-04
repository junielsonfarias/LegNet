/**
 * API de Dados Abertos - Publicacoes
 * Retorna leis, decretos, portarias e outros documentos
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

  return withPublicCache(
    NextResponse.json({
    dados,
    metadados: {
      total,
      pagina: page,
      limite: limit,
      paginas: Math.ceil(total / limit),
      atualizacao: new Date().toISOString(),
      fonte: info.nomeCasa
    }
  }),
    { maxAge: 60, swr: 300 }
  )
})
