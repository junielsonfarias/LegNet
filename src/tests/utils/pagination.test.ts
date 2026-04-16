import { describe, it, expect } from 'vitest'
import {
  extractPaginationParams,
  calculateOffset,
  createPrismaPageArgs,
  createPaginationMeta,
  createPaginatedResponse,
  paginateArray,
  sortArray,
  sortAndPaginateArray,
  generatePaginationLinks,
  validatePaginationParams,
  PAGINATION_DEFAULTS
} from '@/lib/utils/pagination'

describe('pagination', () => {
  describe('extractPaginationParams', () => {
    it('retorna defaults quando sem parametros', () => {
      const params = new URLSearchParams()
      const result = extractPaginationParams(params)

      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.order).toBe('desc')
      expect(result.orderBy).toBeUndefined()
    })

    it('extrai parametros da URL', () => {
      const params = new URLSearchParams('page=3&limit=50&orderBy=nome&order=asc')
      const result = extractPaginationParams(params)

      expect(result.page).toBe(3)
      expect(result.limit).toBe(50)
      expect(result.orderBy).toBe('nome')
      expect(result.order).toBe('asc')
    })

    it('limita page a minimo 1', () => {
      const params = new URLSearchParams('page=-5')
      expect(extractPaginationParams(params).page).toBe(1)
    })

    it('limita limit ao maximo configurado', () => {
      const params = new URLSearchParams('limit=999')
      expect(extractPaginationParams(params).limit).toBe(PAGINATION_DEFAULTS.MAX_LIMIT)
    })

    it('limita limit a minimo 1', () => {
      const params = new URLSearchParams('limit=0')
      expect(extractPaginationParams(params).limit).toBe(1)
    })
  })

  describe('calculateOffset', () => {
    it('calcula offset corretamente', () => {
      expect(calculateOffset(1, 20)).toBe(0)
      expect(calculateOffset(2, 20)).toBe(20)
      expect(calculateOffset(3, 10)).toBe(20)
      expect(calculateOffset(5, 50)).toBe(200)
    })
  })

  describe('createPrismaPageArgs', () => {
    it('gera args basicos', () => {
      const args = createPrismaPageArgs({ page: 2, limit: 10 })
      expect(args.skip).toBe(10)
      expect(args.take).toBe(10)
      expect(args.orderBy).toBeUndefined()
    })

    it('inclui orderBy quando fornecido', () => {
      const args = createPrismaPageArgs({ page: 1, limit: 20, orderBy: 'createdAt', order: 'desc' })
      expect(args.orderBy).toEqual({ createdAt: 'desc' })
    })

    it('usa defaults quando sem parametros', () => {
      const args = createPrismaPageArgs({})
      expect(args.skip).toBe(0)
      expect(args.take).toBe(20)
    })
  })

  describe('createPaginationMeta', () => {
    it('calcula metadados corretamente', () => {
      const meta = createPaginationMeta(100, 1, 20)
      expect(meta.total).toBe(100)
      expect(meta.totalPages).toBe(5)
      expect(meta.hasNext).toBe(true)
      expect(meta.hasPrev).toBe(false)
    })

    it('ultima pagina nao tem next', () => {
      const meta = createPaginationMeta(100, 5, 20)
      expect(meta.hasNext).toBe(false)
      expect(meta.hasPrev).toBe(true)
    })

    it('pagina unica nao tem next nem prev', () => {
      const meta = createPaginationMeta(5, 1, 20)
      expect(meta.totalPages).toBe(1)
      expect(meta.hasNext).toBe(false)
      expect(meta.hasPrev).toBe(false)
    })

    it('zero items gera zero paginas', () => {
      const meta = createPaginationMeta(0, 1, 20)
      expect(meta.totalPages).toBe(0)
      expect(meta.hasNext).toBe(false)
    })
  })

  describe('paginateArray', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }))

    it('retorna primeira pagina', () => {
      const result = paginateArray(items, { page: 1, limit: 10 })
      expect(result.items).toHaveLength(10)
      expect(result.items[0].id).toBe(1)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.totalPages).toBe(5)
    })

    it('retorna pagina intermediaria', () => {
      const result = paginateArray(items, { page: 3, limit: 10 })
      expect(result.items[0].id).toBe(21)
      expect(result.items).toHaveLength(10)
    })

    it('retorna ultima pagina parcial', () => {
      const result = paginateArray(items, { page: 6, limit: 9 })
      expect(result.items).toHaveLength(5) // 50 - 45 = 5
    })

    it('retorna vazio para pagina alem do total', () => {
      const result = paginateArray(items, { page: 100, limit: 10 })
      expect(result.items).toHaveLength(0)
    })
  })

  describe('sortArray', () => {
    it('ordena strings asc', () => {
      const items = [{ nome: 'Carlos' }, { nome: 'Ana' }, { nome: 'Bruno' }]
      const sorted = sortArray(items, 'nome', 'asc')
      expect(sorted.map(i => i.nome)).toEqual(['Ana', 'Bruno', 'Carlos'])
    })

    it('ordena strings desc', () => {
      const items = [{ nome: 'Ana' }, { nome: 'Carlos' }, { nome: 'Bruno' }]
      const sorted = sortArray(items, 'nome', 'desc')
      expect(sorted.map(i => i.nome)).toEqual(['Carlos', 'Bruno', 'Ana'])
    })

    it('ordena numeros', () => {
      const items = [{ valor: 30 }, { valor: 10 }, { valor: 20 }]
      const sorted = sortArray(items, 'valor', 'asc')
      expect(sorted.map(i => i.valor)).toEqual([10, 20, 30])
    })

    it('ordena datas', () => {
      const d1 = new Date('2026-01-01')
      const d2 = new Date('2026-06-01')
      const d3 = new Date('2026-03-01')
      const items = [{ data: d2 }, { data: d1 }, { data: d3 }]
      const sorted = sortArray(items, 'data', 'asc')
      expect(sorted.map(i => i.data)).toEqual([d1, d3, d2])
    })

    it('coloca null/undefined no final', () => {
      const items = [{ v: null }, { v: 'B' }, { v: 'A' }]
      const sorted = sortArray(items, 'v', 'asc')
      expect(sorted[2].v).toBeNull()
    })

    it('nao modifica array original', () => {
      const items = [{ v: 3 }, { v: 1 }, { v: 2 }]
      sortArray(items, 'v', 'asc')
      expect(items[0].v).toBe(3) // original inalterado
    })
  })

  describe('sortAndPaginateArray', () => {
    it('ordena e pagina corretamente', () => {
      const items = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, nome: `Item ${30 - i}` }))
      const result = sortAndPaginateArray(items, { page: 1, limit: 5, orderBy: 'nome', order: 'asc' })

      expect(result.items).toHaveLength(5)
      expect(result.pagination.total).toBe(30)
    })

    it('sem orderBy pula ordenacao', () => {
      const items = [{ id: 3 }, { id: 1 }, { id: 2 }]
      const result = sortAndPaginateArray(items, { page: 1, limit: 10 })
      expect(result.items[0].id).toBe(3) // manteve ordem original
    })
  })

  describe('generatePaginationLinks', () => {
    it('gera links completos', () => {
      const meta = createPaginationMeta(100, 3, 20)
      const links = generatePaginationLinks('https://api.com/items?limit=20', meta)

      expect(links.first).toContain('page=1')
      expect(links.prev).toContain('page=2')
      expect(links.next).toContain('page=4')
      expect(links.last).toContain('page=5')
    })

    it('primeira pagina nao tem prev', () => {
      const meta = createPaginationMeta(100, 1, 20)
      const links = generatePaginationLinks('https://api.com/items', meta)
      expect(links.prev).toBeNull()
      expect(links.next).not.toBeNull()
    })

    it('ultima pagina nao tem next', () => {
      const meta = createPaginationMeta(100, 5, 20)
      const links = generatePaginationLinks('https://api.com/items', meta)
      expect(links.next).toBeNull()
      expect(links.prev).not.toBeNull()
    })
  })

  describe('validatePaginationParams', () => {
    it('aceita parametros validos', () => {
      const result = validatePaginationParams({ page: 1, limit: 20, order: 'asc' })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejeita page negativo', () => {
      const result = validatePaginationParams({ page: -1 })
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('rejeita page fracionario', () => {
      const result = validatePaginationParams({ page: 1.5 })
      expect(result.valid).toBe(false)
    })

    it('rejeita limit acima do maximo', () => {
      const result = validatePaginationParams({ limit: 999 })
      expect(result.valid).toBe(false)
    })

    it('rejeita order invalido', () => {
      const result = validatePaginationParams({ order: 'invalid' as any })
      expect(result.valid).toBe(false)
    })

    it('aceita parametros undefined', () => {
      const result = validatePaginationParams({})
      expect(result.valid).toBe(true)
    })
  })
})
