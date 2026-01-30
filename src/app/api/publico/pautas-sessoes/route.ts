/**
 * API Pública de Pautas de Sessões
 * GET: Lista pautas publicadas
 *
 * Nota: Usa mock service até que os modelos Prisma sejam migrados
 * A estrutura do mock difere da estrutura Prisma atual
 */

import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { pautasSessoesService } from '@/lib/parlamentares-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')
  const search = searchParams.get('search')
  const id = searchParams.get('id')
  const publicadas = searchParams.get('publicadas')

  // Buscar por ID específico
  if (id) {
    const pauta = pautasSessoesService.getById(id)
    if (!pauta) {
      return createSuccessResponse(null, 'Pauta não encontrada')
    }
    return createSuccessResponse(pauta)
  }

  // Buscar pautas publicadas por padrão
  let pautas = publicadas === 'false'
    ? pautasSessoesService.getAll()
    : pautasSessoesService.getPublicadas()

  // Aplicar filtros
  if (status && status !== 'all') {
    pautas = pautas.filter(p => p.status === status)
  }

  if (tipo && tipo !== 'all') {
    pautas = pautas.filter(p => p.tipo === tipo)
  }

  if (search) {
    const termo = search.toLowerCase()
    pautas = pautas.filter(p =>
      p.titulo.toLowerCase().includes(termo) ||
      p.descricao?.toLowerCase().includes(termo)
    )
  }

  // Estatísticas
  const stats = pautasSessoesService.getStats()

  return createSuccessResponse({
    pautas,
    total: pautas.length,
    stats
  })
}
