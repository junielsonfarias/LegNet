import { NextResponse } from 'next/server'

/**
 * API para retornar a hora atual do servidor
 * Usado para sincronizar cronometros entre diferentes paineis
 *
 * GET /api/painel/hora-servidor
 *
 * Response:
 * {
 *   timestamp: string (ISO 8601),
 *   unix: number (timestamp em ms)
 * }
 */
export async function GET() {
  const agora = new Date()

  return NextResponse.json({
    timestamp: agora.toISOString(),
    unix: agora.getTime()
  }, {
    headers: {
      // Evitar cache para garantir hora atualizada
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
