/**
 * API de Conformidade PNTP
 * Retorna relatorio de conformidade com requisitos PNTP
 */

import { NextResponse } from 'next/server'
import { verificarConformidadePNTP, gerarAlertasDesatualizacao } from '@/lib/services/transparencia-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [relatorio, alertas] = await Promise.all([
      verificarConformidadePNTP(),
      gerarAlertasDesatualizacao()
    ])

    return NextResponse.json({
      relatorio,
      alertas: alertas.alertas,
      geradoEm: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao gerar relatorio PNTP:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatorio de conformidade PNTP' },
      { status: 500 }
    )
  }
}
