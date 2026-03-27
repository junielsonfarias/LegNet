import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'

// Forcar rota dinamica (nao pode ser pre-renderizada)
export const dynamic = 'force-dynamic'

/**
 * API para verificar status de acesso do parlamentar
 *
 * Retorna:
 * - sessaoEmAndamento: boolean - se ha sessao EM_ANDAMENTO
 * - presencaConfirmada: boolean - se o parlamentar tem presenca confirmada na sessao
 * - sessaoId: string | null - ID da sessao em andamento
 * - podeAcessarVotacao: boolean - se pode acessar modulo de votacao
 * - podeAcessarDashboard: boolean - se pode acessar o dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = session.user as any
    const parlamentarId = user.parlamentarId

    if (!parlamentarId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não vinculado a um parlamentar' },
        { status: 403 }
      )
    }

    const data = await parlamentarDbService.getStatus(parlamentarId)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao verificar status do parlamentar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
