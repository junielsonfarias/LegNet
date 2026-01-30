/**
 * API Pública de Audiências Públicas
 * GET: Lista audiências públicas com filtros
 *
 * Nota: Usa mock service até que o modelo Prisma seja criado
 */

import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { audienciasPublicasService } from '@/lib/parlamentares-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')
  const search = searchParams.get('search')
  const id = searchParams.get('id')
  const limit = searchParams.get('limit')

  // Buscar por ID específico
  if (id) {
    const audiencia = audienciasPublicasService.getById(id)
    if (!audiencia) {
      return createSuccessResponse(null, 'Audiência não encontrada')
    }
    return createSuccessResponse(audiencia)
  }

  // Buscar todas as audiências
  let audiencias = audienciasPublicasService.getAll()

  // Aplicar filtros
  if (status && status !== 'all') {
    audiencias = audiencias.filter(a => a.status === status)
  }

  if (tipo && tipo !== 'all') {
    audiencias = audiencias.filter(a => a.tipo === tipo)
  }

  if (search) {
    const termo = search.toLowerCase()
    audiencias = audiencias.filter(a =>
      a.titulo.toLowerCase().includes(termo) ||
      a.descricao.toLowerCase().includes(termo) ||
      a.objetivo.toLowerCase().includes(termo) ||
      a.responsavel.toLowerCase().includes(termo)
    )
  }

  // Aplicar limite
  if (limit) {
    audiencias = audiencias.slice(0, parseInt(limit))
  }

  // Estatísticas
  const stats = audienciasPublicasService.getStats()

  return createSuccessResponse({
    audiencias,
    total: audiencias.length,
    stats
  })
}
