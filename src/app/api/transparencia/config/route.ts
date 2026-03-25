import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { transparenciaConfigService } from '@/lib/services/transparencia-config-service'

export const dynamic = 'force-dynamic'

const CategoriaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().default(''),
  icone: z.string().default('FileText'),
  ordem: z.number().int().default(0),
  ativa: z.boolean().default(true)
})

const ItemSchema = z.object({
  categoriaId: z.string().min(1),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().default(''),
  tipo: z.enum(['link_interno', 'link_externo', 'documento']),
  url: z.string().min(1, 'URL é obrigatória'),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true),
  icone: z.string().optional()
})

// GET - Listar categorias (PÚBLICO para o portal)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const publico = searchParams.get('publico') === 'true'

  if (publico) {
    const categorias = await transparenciaConfigService.getCategoriasPublicas()
    return createSuccessResponse(categorias, 'Categorias públicas')
  }

  const categorias = await transparenciaConfigService.getCategorias()
  return createSuccessResponse(categorias, 'Categorias de transparência')
})

// POST - Criar categoria ou item (ADMIN)
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const action = body.action

  if (action === 'addCategoria') {
    const data = CategoriaSchema.parse(body)
    const categoria = await transparenciaConfigService.addCategoria(data)
    return createSuccessResponse(categoria, 'Categoria criada', undefined, 201)
  }

  if (action === 'addItem') {
    const data = ItemSchema.parse(body)
    const item = await transparenciaConfigService.addItem(data.categoriaId, {
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      url: data.url,
      ordem: data.ordem,
      ativo: data.ativo,
      icone: data.icone
    })
    return createSuccessResponse(item, 'Item criado', undefined, 201)
  }

  if (action === 'updateCategoria') {
    const { id, ...data } = body
    await transparenciaConfigService.updateCategoria(id, data)
    return createSuccessResponse(null, 'Categoria atualizada')
  }

  if (action === 'updateItem') {
    const { categoriaId, itemId, ...data } = body
    await transparenciaConfigService.updateItem(categoriaId, itemId, data)
    return createSuccessResponse(null, 'Item atualizado')
  }

  if (action === 'deleteCategoria') {
    await transparenciaConfigService.deleteCategoria(body.id)
    return createSuccessResponse(null, 'Categoria excluída')
  }

  if (action === 'deleteItem') {
    await transparenciaConfigService.deleteItem(body.categoriaId, body.itemId)
    return createSuccessResponse(null, 'Item excluído')
  }

  if (action === 'reorderCategorias') {
    await transparenciaConfigService.reorderCategorias(body.ids)
    return createSuccessResponse(null, 'Ordem atualizada')
  }

  if (action === 'reorderItens') {
    await transparenciaConfigService.reorderItens(body.categoriaId, body.itemIds)
    return createSuccessResponse(null, 'Ordem dos itens atualizada')
  }

  if (action === 'saveFull') {
    await transparenciaConfigService.saveCategorias(body.categorias)
    return createSuccessResponse(null, 'Configuração salva')
  }

  return createSuccessResponse(null, 'Ação não reconhecida', undefined, 400)
}, { permissions: 'config.manage' })
