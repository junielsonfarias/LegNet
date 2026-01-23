import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Forçar rota dinâmica (não pode ser pré-renderizada)
export const dynamic = 'force-dynamic'

/**
 * API para verificar status de acesso do parlamentar
 *
 * Retorna:
 * - sessaoEmAndamento: boolean - se há sessão EM_ANDAMENTO
 * - presencaConfirmada: boolean - se o parlamentar tem presença confirmada na sessão
 * - sessaoId: string | null - ID da sessão em andamento
 * - podeAcessarVotacao: boolean - se pode acessar módulo de votação
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

    // Buscar sessão em andamento
    const sessaoEmAndamento = await prisma.sessao.findFirst({
      where: {
        status: 'EM_ANDAMENTO'
      },
      select: {
        id: true,
        numero: true,
        tipo: true,
        data: true,
        status: true
      }
    })

    // Se não há sessão em andamento
    if (!sessaoEmAndamento) {
      return NextResponse.json({
        success: true,
        data: {
          sessaoEmAndamento: false,
          presencaConfirmada: false,
          sessaoId: null,
          sessao: null,
          podeAcessarVotacao: false,
          podeAcessarDashboard: true,
          mensagem: 'Nenhuma sessão em andamento'
        }
      })
    }

    // Verificar presença do parlamentar na sessão
    const presenca = await prisma.presencaSessao.findFirst({
      where: {
        sessaoId: sessaoEmAndamento.id,
        parlamentarId: parlamentarId,
        presente: true
      }
    })

    const presencaConfirmada = !!presenca

    // Regras de acesso:
    // - Se sessão em andamento E presença confirmada → pode acessar votação, NÃO pode acessar dashboard
    // - Se sessão em andamento E sem presença → NÃO pode acessar votação, NÃO pode acessar dashboard (bloqueado)
    // - Se não há sessão em andamento → pode acessar dashboard, NÃO pode acessar votação

    const podeAcessarVotacao = presencaConfirmada
    const podeAcessarDashboard = !sessaoEmAndamento // Só pode ver dashboard se NÃO houver sessão em andamento

    let mensagem = ''
    if (presencaConfirmada) {
      mensagem = 'Sessão em andamento - acesso ao módulo de votação liberado'
    } else {
      mensagem = 'Sessão em andamento - aguardando confirmação de presença pelo operador'
    }

    return NextResponse.json({
      success: true,
      data: {
        sessaoEmAndamento: true,
        presencaConfirmada,
        sessaoId: sessaoEmAndamento.id,
        sessao: sessaoEmAndamento,
        podeAcessarVotacao,
        podeAcessarDashboard,
        mensagem
      }
    })
  } catch (error) {
    console.error('Erro ao verificar status do parlamentar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
