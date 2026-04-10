// Jest globals (describe, it, expect) are available automatically
import {
  calculateOffset,
  createPaginationMeta,
  createPaginatedResponse,
  paginateArray,
  sortArray,
  validatePaginationParams,
  createPrismaPageArgs,
  PAGINATION_DEFAULTS
} from '@/lib/utils/pagination'

describe('pagination utils', () => {
  describe('calculateOffset', () => {
    it('calcula offset para pagina 1', () => {
      expect(calculateOffset(1, 20)).toBe(0)
    })

    it('calcula offset para pagina 2', () => {
      expect(calculateOffset(2, 20)).toBe(20)
    })

    it('calcula offset para pagina 5 com limit 10', () => {
      expect(calculateOffset(5, 10)).toBe(40)
    })
  })

  describe('createPaginationMeta', () => {
    it('cria meta para primeira pagina', () => {
      const meta = createPaginationMeta(100, 1, 20)
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: false
      })
    })

    it('cria meta para ultima pagina', () => {
      const meta = createPaginationMeta(100, 5, 20)
      expect(meta).toEqual({
        page: 5,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: false,
        hasPrev: true
      })
    })

    it('cria meta para pagina unica', () => {
      const meta = createPaginationMeta(5, 1, 20)
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      })
    })

    it('cria meta para lista vazia', () => {
      const meta = createPaginationMeta(0, 1, 20)
      expect(meta.total).toBe(0)
      expect(meta.totalPages).toBe(0)
      expect(meta.hasNext).toBe(false)
    })
  })

  describe('createPrismaPageArgs', () => {
    it('usa defaults quando parametros vazios', () => {
      const args = createPrismaPageArgs({})
      expect(args.skip).toBe(0)
      expect(args.take).toBe(PAGINATION_DEFAULTS.LIMIT)
      expect(args.orderBy).toBeUndefined()
    })

    it('calcula skip e take corretamente', () => {
      const args = createPrismaPageArgs({ page: 3, limit: 10 })
      expect(args.skip).toBe(20)
      expect(args.take).toBe(10)
    })

    it('inclui orderBy quando informado', () => {
      const args = createPrismaPageArgs({ orderBy: 'createdAt', order: 'desc' })
      expect(args.orderBy).toEqual({ createdAt: 'desc' })
    })
  })

  describe('paginateArray', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }))

    it('retorna primeira pagina', () => {
      const result = paginateArray(items, { page: 1, limit: 10 })
      expect(result.items).toHaveLength(10)
      expect(result.items[0].id).toBe(1)
      expect(result.items[9].id).toBe(10)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.totalPages).toBe(5)
    })

    it('retorna ultima pagina', () => {
      const result = paginateArray(items, { page: 5, limit: 10 })
      expect(result.items).toHaveLength(10)
      expect(result.items[0].id).toBe(41)
    })

    it('retorna pagina parcial quando ultrapassa total', () => {
      const result = paginateArray(items, { page: 3, limit: 20 })
      expect(result.items).toHaveLength(10)
      expect(result.items[0].id).toBe(41)
    })

    it('retorna vazio para pagina alem do total', () => {
      const result = paginateArray(items, { page: 10, limit: 10 })
      expect(result.items).toHaveLength(0)
    })
  })

  describe('sortArray', () => {
    const items = [
      { nome: 'Carlos', idade: 30 },
      { nome: 'Ana', idade: 25 },
      { nome: 'Bruno', idade: 35 }
    ]

    it('ordena por campo string ascendente', () => {
      const sorted = sortArray(items, 'nome', 'asc')
      expect(sorted[0].nome).toBe('Ana')
      expect(sorted[1].nome).toBe('Bruno')
      expect(sorted[2].nome).toBe('Carlos')
    })

    it('ordena por campo numerico descendente', () => {
      const sorted = sortArray(items, 'idade', 'desc')
      expect(sorted[0].idade).toBe(35)
      expect(sorted[2].idade).toBe(25)
    })

    it('lida com valores null no final', () => {
      const withNull = [...items, { nome: null as any, idade: 20 }]
      const sorted = sortArray(withNull, 'nome', 'asc')
      expect(sorted[3].nome).toBeNull()
    })

    it('nao modifica array original', () => {
      const original = [...items]
      sortArray(items, 'nome', 'asc')
      expect(items).toEqual(original)
    })
  })

  describe('validatePaginationParams', () => {
    it('aceita parametros validos', () => {
      const result = validatePaginationParams({ page: 1, limit: 20 })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejeita page negativa', () => {
      const result = validatePaginationParams({ page: -1, limit: 20 })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('rejeita limit acima do maximo', () => {
      const result = validatePaginationParams({ page: 1, limit: 1000 })
      expect(result.valid).toBe(false)
    })

    it('rejeita limit zero', () => {
      const result = validatePaginationParams({ page: 1, limit: 0 })
      expect(result.valid).toBe(false)
    })
  })

  describe('createPaginatedResponse', () => {
    it('cria resposta completa', () => {
      const items = [{ id: 1 }, { id: 2 }]
      const result = createPaginatedResponse(items, 50, { page: 1, limit: 20 })
      expect(result.items).toEqual(items)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })
  })
})
