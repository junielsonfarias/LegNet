/**
 * Service para gerenciar categorias e itens de transparência.
 * Armazena dados na tabela Configuracao (key-value) como JSON.
 * Permite CRUD completo de categorias e itens com ordenação.
 */

import { prisma } from '@/lib/prisma'

const CONFIG_KEY = 'transparencia.categorias'

export interface TransparenciaItemConfig {
  id: string
  titulo: string
  descricao: string
  tipo: 'link_interno' | 'link_externo' | 'documento'
  url: string
  ordem: number
  ativo: boolean
  icone?: string
}

export interface TransparenciaCategoriaConfig {
  id: string
  nome: string
  descricao: string
  icone: string
  ordem: number
  ativa: boolean
  itens: TransparenciaItemConfig[]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const transparenciaConfigService = {
  /**
   * Buscar todas as categorias com itens
   */
  async getCategorias(): Promise<TransparenciaCategoriaConfig[]> {
    const config = await prisma.configuracao.findUnique({
      where: { chave: CONFIG_KEY }
    })

    if (!config) return []

    try {
      const categorias = JSON.parse(config.valor) as TransparenciaCategoriaConfig[]
      return categorias.sort((a, b) => a.ordem - b.ordem)
    } catch {
      return []
    }
  },

  /**
   * Salvar todas as categorias (replace completo)
   */
  async saveCategorias(categorias: TransparenciaCategoriaConfig[]): Promise<void> {
    await prisma.configuracao.upsert({
      where: { chave: CONFIG_KEY },
      update: { valor: JSON.stringify(categorias) },
      create: {
        chave: CONFIG_KEY,
        valor: JSON.stringify(categorias),
        descricao: 'Categorias e itens do portal de transparência',
        categoria: 'Transparência',
        tipo: 'json',
        editavel: true
      }
    })
  },

  /**
   * Adicionar nova categoria
   */
  async addCategoria(data: Omit<TransparenciaCategoriaConfig, 'id' | 'itens'>): Promise<TransparenciaCategoriaConfig> {
    const categorias = await this.getCategorias()
    const nova: TransparenciaCategoriaConfig = {
      ...data,
      id: generateId(),
      itens: []
    }
    categorias.push(nova)
    await this.saveCategorias(categorias)
    return nova
  },

  /**
   * Atualizar categoria existente
   */
  async updateCategoria(id: string, data: Partial<Omit<TransparenciaCategoriaConfig, 'id' | 'itens'>>): Promise<void> {
    const categorias = await this.getCategorias()
    const index = categorias.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Categoria não encontrada')

    categorias[index] = { ...categorias[index], ...data }
    await this.saveCategorias(categorias)
  },

  /**
   * Excluir categoria
   */
  async deleteCategoria(id: string): Promise<void> {
    const categorias = await this.getCategorias()
    const filtered = categorias.filter(c => c.id !== id)
    await this.saveCategorias(filtered)
  },

  /**
   * Adicionar item a uma categoria
   */
  async addItem(categoriaId: string, data: Omit<TransparenciaItemConfig, 'id'>): Promise<TransparenciaItemConfig> {
    const categorias = await this.getCategorias()
    const cat = categorias.find(c => c.id === categoriaId)
    if (!cat) throw new Error('Categoria não encontrada')

    const novoItem: TransparenciaItemConfig = { ...data, id: generateId() }
    cat.itens.push(novoItem)
    await this.saveCategorias(categorias)
    return novoItem
  },

  /**
   * Atualizar item
   */
  async updateItem(categoriaId: string, itemId: string, data: Partial<Omit<TransparenciaItemConfig, 'id'>>): Promise<void> {
    const categorias = await this.getCategorias()
    const cat = categorias.find(c => c.id === categoriaId)
    if (!cat) throw new Error('Categoria não encontrada')

    const index = cat.itens.findIndex(i => i.id === itemId)
    if (index === -1) throw new Error('Item não encontrado')

    cat.itens[index] = { ...cat.itens[index], ...data }
    await this.saveCategorias(categorias)
  },

  /**
   * Excluir item
   */
  async deleteItem(categoriaId: string, itemId: string): Promise<void> {
    const categorias = await this.getCategorias()
    const cat = categorias.find(c => c.id === categoriaId)
    if (!cat) throw new Error('Categoria não encontrada')

    cat.itens = cat.itens.filter(i => i.id !== itemId)
    await this.saveCategorias(categorias)
  },

  /**
   * Reordenar categorias
   */
  async reorderCategorias(ids: string[]): Promise<void> {
    const categorias = await this.getCategorias()
    const reordered = ids.map((id, index) => {
      const cat = categorias.find(c => c.id === id)
      if (cat) cat.ordem = index + 1
      return cat
    }).filter(Boolean) as TransparenciaCategoriaConfig[]

    await this.saveCategorias(reordered)
  },

  /**
   * Reordenar itens de uma categoria
   */
  async reorderItens(categoriaId: string, itemIds: string[]): Promise<void> {
    const categorias = await this.getCategorias()
    const cat = categorias.find(c => c.id === categoriaId)
    if (!cat) throw new Error('Categoria não encontrada')

    cat.itens = itemIds.map((id, index) => {
      const item = cat.itens.find(i => i.id === id)
      if (item) item.ordem = index + 1
      return item
    }).filter(Boolean) as TransparenciaItemConfig[]

    await this.saveCategorias(categorias)
  },

  /**
   * Buscar apenas categorias ativas com itens ativos (para o portal público)
   */
  async getCategoriasPublicas(): Promise<TransparenciaCategoriaConfig[]> {
    const categorias = await this.getCategorias()
    return categorias
      .filter(c => c.ativa)
      .map(c => ({
        ...c,
        itens: c.itens.filter(i => i.ativo).sort((a, b) => a.ordem - b.ordem)
      }))
      .sort((a, b) => a.ordem - b.ordem)
  }
}
