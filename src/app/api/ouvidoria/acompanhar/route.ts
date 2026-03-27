import { NextRequest, NextResponse } from 'next/server'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Acompanhar manifestação por protocolo (público)
 * Não requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const protocolo = searchParams.get('protocolo')

    if (!protocolo) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro protocolo é obrigatório' },
        { status: 400 }
      )
    }

    const manifestacao = await ouvidoriaService.getByProtocolo(protocolo)

    if (!manifestacao) {
      return NextResponse.json(
        { success: false, error: 'Manifestação não encontrada para o protocolo informado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: manifestacao })
  } catch (error) {
    console.error('Erro ao acompanhar manifestação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
