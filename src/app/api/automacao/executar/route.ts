import { NextRequest, NextResponse } from 'next/server'
import { automacaoService } from '@/lib/automacao-service'
import { withAuth } from '@/lib/auth/permissions'

// POST - Executar agendamentos
export const POST = withAuth(async (request: NextRequest) => {
  // Executar todos os agendamentos pendentes
  automacaoService.executarAgendamentos()

  return NextResponse.json({
    message: 'Agendamentos executados com sucesso',
    timestamp: new Date().toISOString()
  })
}, { permissions: 'automacao.manage' })

// GET - Verificar próximos agendamentos
export async function GET() {
  try {
    const agendamentos = automacaoService.getAllAgendamentosPauta()
    const agora = new Date()
    
    const proximos = agendamentos
      .filter(a => a.proximaExecucao > agora)
      .sort((a, b) => a.proximaExecucao.getTime() - b.proximaExecucao.getTime())
    
    const pendentes = agendamentos
      .filter(a => a.proximaExecucao <= agora)
      .sort((a, b) => a.proximaExecucao.getTime() - b.proximaExecucao.getTime())
    
    return NextResponse.json({
      proximos,
      pendentes,
      total: agendamentos.length
    })
  } catch (error) {
    console.error('Erro ao verificar agendamentos:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
