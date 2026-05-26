import { NextResponse } from 'next/server'
import { getTransmissaoConfig } from '@/lib/services/transmissao-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/transmissao
 *
 * Endpoint publico (sem auth) que devolve apenas os dados essenciais da
 * transmissao para o banner do portal. NAO retorna o embedHtml para evitar
 * que terceiros injetem markup arbitrario via consumo da API.
 */
export async function GET() {
  const cfg = await getTransmissaoConfig()

  return NextResponse.json({
    data: {
      ativa: cfg.ativa,
      url: cfg.url,
      plataforma: cfg.plataforma,
      titulo: cfg.titulo,
      aviso: cfg.aviso,
    },
  })
}
