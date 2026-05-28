import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    comissao: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    membroComissao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/services/deadline-service', () => ({
  calcularPrazoRestante: vi.fn(() => 0),
}))

import { prisma as _prisma } from '@/lib/prisma'
import { comissaoDbService } from '@/lib/services/comissao-db-service'

const prisma = _prisma as any

describe('comissaoDbService.list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.comissao.findMany.mockResolvedValue([])
  })

  it('lista todas as comissoes quando sem filtros', async () => {
    await comissaoDbService.list()

    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    )
  })

  it('aplica filtro de tipo (PERMANENTE/TEMPORARIA)', async () => {
    await comissaoDbService.list({ tipo: 'PERMANENTE' })

    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tipo: 'PERMANENTE' }),
      })
    )
  })

  it('aplica filtro ativa=true', async () => {
    await comissaoDbService.list({ ativa: true })

    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ativa: true }),
      })
    )
  })

  it('aplica filtro ativa=false (distingue de undefined)', async () => {
    await comissaoDbService.list({ ativa: false })

    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ativa: false }),
      })
    )
  })

  it('search usa OR em nome E sigla com contains case insensitive', async () => {
    await comissaoDbService.list({ search: 'CCJR' })

    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { nome: { contains: 'CCJR', mode: 'insensitive' } },
            { sigla: { contains: 'CCJR', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })

  it('include defaultInclude (membros + parlamentar)', async () => {
    await comissaoDbService.list()

    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          membros: expect.objectContaining({
            include: expect.objectContaining({
              parlamentar: expect.any(Object),
            }),
          }),
        }),
      })
    )
  })
})

describe('comissaoDbService.paginate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.comissao.findMany.mockResolvedValue([])
    prisma.comissao.count.mockResolvedValue(0)
  })

  it('paginacao default page=1, limit=50', async () => {
    await comissaoDbService.paginate({})

    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 50 })
    )
  })

  it('page=3 limit=10 calcula skip=20', async () => {
    await comissaoDbService.paginate({}, { page: 3, limit: 10 })

    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
  })

  it('retorna { data, pagination: { total, page, limit, totalPages, hasNext, hasPrev } }', async () => {
    prisma.comissao.findMany.mockResolvedValue([{ id: 'c1' }])
    prisma.comissao.count.mockResolvedValue(42)

    const result = await comissaoDbService.paginate({}, { page: 1, limit: 10 })

    expect(result).toMatchObject({
      data: [{ id: 'c1' }],
      pagination: {
        total: 42,
        page: 1,
        limit: 10,
        totalPages: 5,
        hasNext: true,
        hasPrev: false,
      },
    })
  })
})

describe('comissaoDbService.checkDuplicateName (RN-070 - unicidade)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('busca case insensitive por nome', async () => {
    await comissaoDbService.checkDuplicateName('Comissao de Justica')

    expect(prisma.comissao.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        nome: { equals: 'Comissao de Justica', mode: 'insensitive' },
      }),
    })
  })

  it('com excludeId: nao bate contra a propria comissao em edicao', async () => {
    await comissaoDbService.checkDuplicateName('CCJR', 'comissao-1')

    expect(prisma.comissao.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        nome: { equals: 'CCJR', mode: 'insensitive' },
        id: { not: 'comissao-1' },
      }),
    })
  })

  it('retorna comissao existente em caso de duplicata', async () => {
    prisma.comissao.findFirst.mockResolvedValue({ id: 'dup-1', nome: 'CCJR' })

    const result = await comissaoDbService.checkDuplicateName('CCJR')

    expect(result).toMatchObject({ id: 'dup-1' })
  })

  it('retorna null quando nao ha duplicata', async () => {
    prisma.comissao.findFirst.mockResolvedValue(null)

    const result = await comissaoDbService.checkDuplicateName('NovaComissao')

    expect(result).toBeNull()
  })
})

describe('comissaoDbService.exists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna a comissao (id+nome) quando existe', async () => {
    prisma.comissao.findUnique.mockResolvedValue({ id: 'c-1', nome: 'CCJR' })

    const result = await comissaoDbService.exists('c-1')

    expect(result).toMatchObject({ id: 'c-1', nome: 'CCJR' })
    expect(prisma.comissao.findUnique).toHaveBeenCalledWith({
      where: { id: 'c-1' },
      select: { id: true, nome: true },
    })
  })

  it('retorna null quando nao existe', async () => {
    prisma.comissao.findUnique.mockResolvedValue(null)

    const result = await comissaoDbService.exists('c-naoexiste')

    expect(result).toBeNull()
  })
})

describe('comissaoDbService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria comissao com defaults (ativa=true)', async () => {
    prisma.comissao.create.mockResolvedValue({ id: 'new' })

    await comissaoDbService.create({
      nome: 'Nova Comissao',
      sigla: 'NC',
      tipo: 'PERMANENTE',
    })

    expect(prisma.comissao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: 'Nova Comissao',
          sigla: 'NC',
          tipo: 'PERMANENTE',
          ativa: true,
        }),
      })
    )
  })
})
