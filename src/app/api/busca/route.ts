import { NextRequest, NextResponse } from 'next/server'
import {
  buscarGlobal,
  buscarRapida,
  type TipoResultado
} from '@/lib/services/busca-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/busca - Busca global
 *
 * Query params:
 * - q: termo de busca (obrigatório)
 * - tipos: tipos separados por vírgula (proposicao,parlamentar,sessao,publicacao,noticia,comissao)
 * - dataInicio: data inicial (ISO)
 * - dataFim: data final (ISO)
 * - autorId: ID do autor (para proposições)
 * - status: status (para proposições)
 * - limite: quantidade por página (default: 20)
 * - pagina: página atual (default: 1)
 * - rapida: se "true", retorna busca rápida para autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const termo = searchParams.get('q')
    if (!termo || termo.trim().length < 2) {
      return NextResponse.json(
        { error: 'Termo de busca deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Busca rápida para autocomplete
    const rapida = searchParams.get('rapida') === 'true'
    if (rapida) {
      const limite = parseInt(searchParams.get('limite') || '5')
      const resultados = await buscarRapida(termo, limite)
      return NextResponse.json({ resultados })
    }

    // Busca completa
    const tiposParam = searchParams.get('tipos')
    const tipos = tiposParam
      ? (tiposParam.split(',') as TipoResultado[])
      : undefined

    const dataInicioParam = searchParams.get('dataInicio')
    const dataFimParam = searchParams.get('dataFim')
    const autorId = searchParams.get('autorId')
    const status = searchParams.get('status')
    const limite = parseInt(searchParams.get('limite') || '20')
    const pagina = parseInt(searchParams.get('pagina') || '1')

    const resultado = await buscarGlobal(termo, {
      tipos,
      dataInicio: dataInicioParam ? new Date(dataInicioParam) : undefined,
      dataFim: dataFimParam ? new Date(dataFimParam) : undefined,
      autorId: autorId || undefined,
      status: status || undefined,
      limite,
      offset: (pagina - 1) * limite,
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Erro na busca:', error)
    return NextResponse.json(
      { error: 'Erro interno ao realizar busca' },
      { status: 500 }
    )
  }
}
