import { NextRequest, NextResponse } from 'next/server'
import { esicService } from '@/lib/services/esic-service'

export const dynamic = 'force-dynamic'

/**
 * GET - Acompanhar solicitação e-SIC por protocolo (público)
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

    const solicitacao = await esicService.getByProtocolo(protocolo)

    if (!solicitacao) {
      return NextResponse.json(
        { success: false, error: 'Solicitação não encontrada para o protocolo informado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: solicitacao })
  } catch (error) {
    console.error('Erro ao acompanhar solicitação e-SIC:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
