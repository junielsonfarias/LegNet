import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

// POST - Controlar status da reuniao
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id: reuniaoId } = await params
    const body = await request.json()
    const { acao, motivo, parecerId, votosAFavor, votosContra, votosAbstencao, ataTexto } = body

    if (!acao) {
      return NextResponse.json(
        { success: false, error: 'Acao e obrigatoria' },
        { status: 400 }
      )
    }

    let resultado: any
    let mensagem: string

    switch (acao) {
      case 'convocar':
        resultado = await ReuniaoComissaoService.convocarReuniao(reuniaoId)
        mensagem = 'Reuniao convocada com sucesso'
        break

      case 'iniciar':
        resultado = await ReuniaoComissaoService.iniciarReuniao(reuniaoId)
        mensagem = 'Reuniao iniciada com sucesso'
        break

      case 'suspender':
        resultado = await ReuniaoComissaoService.suspenderReuniao(reuniaoId, motivo)
        mensagem = 'Reuniao suspensa'
        break

      case 'retomar':
        resultado = await ReuniaoComissaoService.retomarReuniao(reuniaoId)
        mensagem = 'Reuniao retomada'
        break

      case 'encerrar':
        resultado = await ReuniaoComissaoService.encerrarReuniao(reuniaoId)
        mensagem = 'Reuniao encerrada com sucesso'
        break

      case 'cancelar':
        if (!motivo) {
          return NextResponse.json(
            { success: false, error: 'Motivo e obrigatorio para cancelar' },
            { status: 400 }
          )
        }
        resultado = await ReuniaoComissaoService.cancelarReuniao(reuniaoId, motivo)
        mensagem = 'Reuniao cancelada'
        break

      case 'votar_parecer':
        if (!parecerId) {
          return NextResponse.json(
            { success: false, error: 'ID do parecer e obrigatorio para votacao' },
            { status: 400 }
          )
        }
        resultado = await ReuniaoComissaoService.votarParecer(reuniaoId, parecerId, {
          votosAFavor: votosAFavor || 0,
          votosContra: votosContra || 0,
          votosAbstencao: votosAbstencao || 0
        })
        mensagem = `Parecer ${resultado.status === 'APROVADO_COMISSAO' ? 'aprovado' : 'rejeitado'} pela comissao`
        break

      case 'emitir_parecer':
        if (!parecerId) {
          return NextResponse.json(
            { success: false, error: 'ID do parecer e obrigatorio' },
            { status: 400 }
          )
        }
        resultado = await ReuniaoComissaoService.emitirParecer(parecerId)
        mensagem = 'Parecer emitido com sucesso'
        break

      case 'salvar_ata':
        if (!ataTexto) {
          return NextResponse.json(
            { success: false, error: 'Texto da ata e obrigatorio' },
            { status: 400 }
          )
        }
        resultado = await ReuniaoComissaoService.salvarAta(reuniaoId, ataTexto)
        mensagem = 'Ata salva com sucesso'
        break

      case 'aprovar_ata':
        resultado = await ReuniaoComissaoService.aprovarAta(reuniaoId)
        mensagem = 'Ata aprovada com sucesso'
        break

      default:
        return NextResponse.json(
          { success: false, error: `Acao desconhecida: ${acao}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: mensagem
    })
  } catch (error) {
    console.error('Erro ao executar acao:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao executar acao' },
      { status: 500 }
    )
  }
}
