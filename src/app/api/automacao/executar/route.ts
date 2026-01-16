import { NextResponse } from 'next/server'
import { automacaoService } from '@/lib/automacao-service'

// POST - Executar agendamentos
export async function POST(request: Request) {
  try {
    // Executar todos os agendamentos pendentes
    automacaoService.executarAgendamentos()
    
    return NextResponse.json({ 
      message: 'Agendamentos executados com sucesso',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao executar agendamentos:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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
