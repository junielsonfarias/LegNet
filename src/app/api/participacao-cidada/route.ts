import { NextRequest, NextResponse } from 'next/server'
import { participacaoCidadaService } from '@/lib/participacao-cidada-service'
import { withAuth } from '@/lib/auth/permissions'

// GET - Buscar dados de participação cidadã (público)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const termo = searchParams.get('termo')

    if (tipo === 'sugestoes') {
      const sugestoes = termo
        ? participacaoCidadaService.searchSugestoes(termo)
        : participacaoCidadaService.getAllSugestoes()
      return NextResponse.json(sugestoes)
    }

    if (tipo === 'consultas') {
      const consultas = termo
        ? participacaoCidadaService.searchConsultas(termo)
        : participacaoCidadaService.getAllConsultas()
      return NextResponse.json(consultas)
    }

    if (tipo === 'peticoes') {
      const peticoes = termo
        ? participacaoCidadaService.searchPeticoes(termo)
        : participacaoCidadaService.getAllPeticoes()
      return NextResponse.json(peticoes)
    }

    if (tipo === 'foruns') {
      const foruns = participacaoCidadaService.getAllForuns()
      return NextResponse.json(foruns)
    }

    if (tipo === 'estatisticas') {
      const estatisticas = participacaoCidadaService.getEstatisticas()
      return NextResponse.json(estatisticas)
    }

    // Retorna todos os dados
    const sugestoes = participacaoCidadaService.getAllSugestoes()
    const consultas = participacaoCidadaService.getAllConsultas()
    const peticoes = participacaoCidadaService.getAllPeticoes()
    const foruns = participacaoCidadaService.getAllForuns()
    const estatisticas = participacaoCidadaService.getEstatisticas()

    return NextResponse.json({
      sugestoes,
      consultas,
      peticoes,
      foruns,
      estatisticas
    })
  } catch (error) {
    console.error('Erro ao buscar dados de participação cidadã:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova sugestão, consulta, petição ou forum
export const POST = withAuth(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const data = await request.json()

    if (tipo === 'sugestao') {
      const sugestao = participacaoCidadaService.createSugestao(data)
      return NextResponse.json(sugestao, { status: 201 })
    }

    if (tipo === 'consulta') {
      const consulta = participacaoCidadaService.createConsulta(data)
      return NextResponse.json(consulta, { status: 201 })
    }

    if (tipo === 'peticao') {
      const peticao = participacaoCidadaService.createPeticao(data)
      return NextResponse.json(peticao, { status: 201 })
    }

    if (tipo === 'forum') {
      const forum = participacaoCidadaService.createForum(data)
      return NextResponse.json(forum, { status: 201 })
    }

    if (tipo === 'votar-sugestao') {
      const sucesso = participacaoCidadaService.votarSugestao(data.id)
      if (sucesso) {
        return NextResponse.json({ message: 'Voto registrado com sucesso' })
      }
      return NextResponse.json(
        { message: 'Erro ao registrar voto' },
        { status: 400 }
      )
    }

    if (tipo === 'votar-consulta') {
      const sucesso = participacaoCidadaService.votarConsulta(data.consultaId, data.opcaoId)
      if (sucesso) {
        return NextResponse.json({ message: 'Voto registrado com sucesso' })
      }
      return NextResponse.json(
        { message: 'Erro ao registrar voto' },
        { status: 400 }
      )
    }

    if (tipo === 'assinar-peticao') {
      const assinatura = participacaoCidadaService.assinarPeticao(data.peticaoId, data.assinatura)
      return NextResponse.json(assinatura, { status: 201 })
    }

    if (tipo === 'comentario-sugestao') {
      const comentario = participacaoCidadaService.addComentarioSugestao(data.sugestaoId, data.comentario)
      return NextResponse.json(comentario, { status: 201 })
    }

    return NextResponse.json(
      { message: 'Tipo não especificado' },
      { status: 400 }
    )
  },
  { permissions: 'participacao.manage' }
)

// PUT - Atualizar sugestão, consulta, petição ou forum
export const PUT = withAuth(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const id = searchParams.get('id')
    const data = await request.json()

    if (!id) {
      return NextResponse.json(
        { message: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    if (tipo === 'sugestao') {
      const sugestao = participacaoCidadaService.updateSugestao(id, data)
      if (!sugestao) {
        return NextResponse.json(
          { message: 'Sugestão não encontrada' },
          { status: 404 }
        )
      }
      return NextResponse.json(sugestao)
    }

    if (tipo === 'consulta') {
      // Para consultas, implementar update se necessário
      return NextResponse.json(
        { message: 'Atualização de consulta não implementada' },
        { status: 501 }
      )
    }

    if (tipo === 'peticao') {
      // Para petições, implementar update se necessário
      return NextResponse.json(
        { message: 'Atualização de petição não implementada' },
        { status: 501 }
      )
    }

    if (tipo === 'validar-assinatura') {
      const sucesso = participacaoCidadaService.validarAssinatura(data.peticaoId, id)
      if (sucesso) {
        return NextResponse.json({ message: 'Assinatura validada com sucesso' })
      }
      return NextResponse.json(
        { message: 'Erro ao validar assinatura' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Tipo não especificado' },
      { status: 400 }
    )
  },
  { permissions: 'participacao.manage' }
)

// DELETE - Deletar sugestão, consulta, petição ou forum
export const DELETE = withAuth(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Implementar delete conforme necessário
    // Por enquanto, retorna não implementado

    return NextResponse.json(
      { message: 'Exclusão não implementada' },
      { status: 501 }
    )
  },
  { permissions: 'participacao.manage' }
)
