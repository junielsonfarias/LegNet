/**
 * API do Painel - Controle de Streaming
 * POST: Configura/Inicia/Finaliza transmissao
 * GET: Busca informacoes da transmissao
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  iniciarTransmissao,
  finalizarTransmissao,
  validarUrlStreaming,
  gerarPlayerConfig,
  buscarVideosGravados
} from '@/lib/services/streaming-service'
import { configurarTransmissao, getEstadoPainel } from '@/lib/services/painel-tempo-real-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sessaoId, acao, url, titulo, plataforma } = body

    if (!sessaoId || !acao) {
      return NextResponse.json(
        { error: 'sessaoId e acao sao obrigatorios' },
        { status: 400 }
      )
    }

    switch (acao) {
      case 'iniciar':
        if (!url) {
          return NextResponse.json(
            { error: 'url e obrigatoria para iniciar transmissao' },
            { status: 400 }
          )
        }

        // Validar URL
        const validacao = validarUrlStreaming(url)
        if (!validacao.valida) {
          return NextResponse.json(
            { error: validacao.mensagem || 'URL invalida' },
            { status: 400 }
          )
        }

        // Iniciar transmissao
        const transmissao = await iniciarTransmissao(sessaoId, url, titulo)
        if (!transmissao) {
          return NextResponse.json(
            { error: 'Erro ao iniciar transmissao. URL pode nao ser suportada.' },
            { status: 400 }
          )
        }

        // Atualizar estado do painel
        await configurarTransmissao(
          sessaoId,
          url,
          validacao.plataforma as 'youtube' | 'vimeo' | 'outro',
          true
        )

        return NextResponse.json({
          success: true,
          message: 'Transmissao iniciada',
          data: transmissao
        })

      case 'parar':
        await configurarTransmissao(sessaoId, '', 'outro', false)
        return NextResponse.json({
          success: true,
          message: 'Transmissao parada'
        })

      case 'configurar':
        if (!url || !plataforma) {
          return NextResponse.json(
            { error: 'url e plataforma sao obrigatorios' },
            { status: 400 }
          )
        }
        await configurarTransmissao(sessaoId, url, plataforma, true)
        return NextResponse.json({
          success: true,
          message: 'Transmissao configurada'
        })

      default:
        return NextResponse.json(
          { error: 'Acao invalida. Use: iniciar, parar, configurar' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro no controle de streaming:', error)
    return NextResponse.json(
      { error: 'Erro no controle de streaming' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessaoId = searchParams.get('sessaoId')
    const tipo = searchParams.get('tipo') || 'atual' // atual ou historico

    if (tipo === 'historico') {
      const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')

      const videos = await buscarVideosGravados({ ano, limit, offset })

      return NextResponse.json({
        success: true,
        data: videos
      })
    }

    if (!sessaoId) {
      return NextResponse.json(
        { error: 'sessaoId e obrigatorio' },
        { status: 400 }
      )
    }

    const estado = await getEstadoPainel(sessaoId)

    if (!estado) {
      return NextResponse.json(
        { error: 'Sessao nao encontrada' },
        { status: 404 }
      )
    }

    // Gerar config do player se tiver URL
    const playerConfig = estado.transmissao.url
      ? gerarPlayerConfig(estado.transmissao.url)
      : null

    return NextResponse.json({
      success: true,
      data: {
        transmissao: estado.transmissao,
        playerConfig
      }
    })
  } catch (error) {
    console.error('Erro ao buscar streaming:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar streaming' },
      { status: 500 }
    )
  }
}
