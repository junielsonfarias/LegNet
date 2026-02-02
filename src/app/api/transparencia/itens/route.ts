import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { transparenciaService } from '@/lib/transparencia-dados-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const categoria = searchParams.get('categoria')
  const subcategoria = searchParams.get('subcategoria')
  const ano = searchParams.get('ano')
  const tipo = searchParams.get('tipo')
  const search = searchParams.get('search')
  const id = searchParams.get('id')
  const limit = searchParams.get('limit')
  const recentes = searchParams.get('recentes')
  const maisAcessados = searchParams.get('maisAcessados')

  // Buscar por ID específico
  if (id) {
    const item = transparenciaService.getById(id)
    if (!item) {
      return createSuccessResponse(null, 'Item não encontrado')
    }
    return createSuccessResponse(item)
  }

  // Buscar itens recentes
  if (recentes === 'true') {
    const resultado = transparenciaService.getRecentes(limit ? parseInt(limit) : 10)
    return createSuccessResponse(resultado.data)
  }

  // Buscar mais acessados
  if (maisAcessados === 'true') {
    const resultado = transparenciaService.getMaisAcessados(limit ? parseInt(limit) : 10)
    return createSuccessResponse(resultado.data)
  }

  // Buscar por categoria e subcategoria
  if (categoria && subcategoria) {
    const itens = transparenciaService.getBySubcategoria(categoria, subcategoria)
    return createSuccessResponse(itens)
  }

  // Buscar por categoria
  if (categoria) {
    const itens = transparenciaService.getByCategoria(categoria)
    const subcategorias = transparenciaService.getSubcategorias(categoria)
    return createSuccessResponse({
      itens,
      subcategorias
    })
  }

  // Buscar por ano
  if (ano) {
    const itens = transparenciaService.getByAno(parseInt(ano))
    return createSuccessResponse(itens)
  }

  // Buscar por tipo
  if (tipo) {
    const itens = transparenciaService.getByTipo(tipo)
    return createSuccessResponse(itens)
  }

  // Busca textual
  if (search) {
    const itens = transparenciaService.search(search)
    return createSuccessResponse(itens)
  }

  // Retornar todos os dados com metadados
  const resultado = transparenciaService.getAll()
  return createSuccessResponse({
    itens: resultado.data,
    categorias: resultado.categorias,
    tipos: resultado.tipos,
    anos: resultado.anos,
    stats: resultado.stats
  })
}
