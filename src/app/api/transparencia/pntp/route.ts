/**
 * API de Conformidade PNTP
 * Retorna relatorio de conformidade com requisitos PNTP
 */

import { NextResponse } from 'next/server'
import { verificarConformidadePNTP, gerarAlertasDesatualizacao } from '@/lib/services/transparencia-service'
import { withErrorHandler } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  const [relatorio, alertas] = await Promise.all([
    verificarConformidadePNTP(),
    gerarAlertasDesatualizacao()
  ])

  return NextResponse.json({
    relatorio,
    alertas: alertas.alertas,
    geradoEm: new Date().toISOString()
  })
})
