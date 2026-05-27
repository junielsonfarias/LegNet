import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    receita: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}))

import { prisma as _prisma } from '@/lib/prisma'
import { receitasDbService } from '@/lib/services/receitas-db-service'

const prisma = _prisma as any

// PNTP 3.1 essencial - receitas arrecadadas
describe('receitasDbService.list (PNTP 3.1 - receitas)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.receita.findMany.mockResolvedValue([])
  })

  it('lista todas as receitas quando nao ha filtros', async () => {
    await receitasDbService.list()

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
      })
    )
  })

  it('aplica filtro de situacao (ARRECADADA)', async () => {
    await receitasDbService.list({ situacao: 'ARRECADADA' })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ situacao: 'ARRECADADA' }),
      })
    )
  })

  it('aplica filtros temporais (ano e mes)', async () => {
    await receitasDbService.list({ ano: 2026, mes: 5 })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ano: 2026, mes: 5 }),
      })
    )
  })

  it('usa contains case insensitive no filtro de contribuinte', async () => {
    await receitasDbService.list({ contribuinte: 'Maria' })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          contribuinte: { contains: 'Maria', mode: 'insensitive' },
        }),
      })
    )
  })

  it('aplica filtro de categoria (RECEITA_CORRENTE)', async () => {
    await receitasDbService.list({ categoria: 'RECEITA_CORRENTE' })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoria: 'RECEITA_CORRENTE' }),
      })
    )
  })

  it('aplica filtro de origem (TRIBUTARIA)', async () => {
    await receitasDbService.list({ origem: 'TRIBUTARIA' })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ origem: 'TRIBUTARIA' }),
      })
    )
  })

  it('aplica range valorMinimo/valorMaximo em valorArrecadado', async () => {
    await receitasDbService.list({ valorMinimo: 100, valorMaximo: 1000 })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          valorArrecadado: { gte: 100, lte: 1000 },
        }),
      })
    )
  })

  it('aplica apenas valorMaximo quando valorMinimo ausente', async () => {
    await receitasDbService.list({ valorMaximo: 2000 })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          valorArrecadado: { lte: 2000 },
        }),
      })
    )
  })

  it('combina varios filtros simultaneamente', async () => {
    await receitasDbService.list({
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRIBUTARIA',
      ano: 2026,
      contribuinte: 'XPTO',
    })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoria: 'RECEITA_CORRENTE',
          origem: 'TRIBUTARIA',
          ano: 2026,
          contribuinte: { contains: 'XPTO', mode: 'insensitive' },
        }),
      })
    )
  })
})

// PNTP 3.1 - paginacao publica de receitas
describe('receitasDbService.paginate (PNTP 3.1 - paginacao)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.receita.findMany.mockResolvedValue([])
    prisma.receita.count.mockResolvedValue(0)
  })

  it('retorna estrutura {data, pagination: {total, page, limit, totalPages}}', async () => {
    prisma.receita.count.mockResolvedValue(25)
    prisma.receita.findMany.mockResolvedValue([{ id: 'r1' }])

    const result = await receitasDbService.paginate()

    expect(result).toMatchObject({
      data: [{ id: 'r1' }],
      pagination: expect.objectContaining({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      }),
    })
  })

  it('calcula skip corretamente para pagina 2 com limit 5 (skip = 5)', async () => {
    await receitasDbService.paginate({}, { page: 2, limit: 5 })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    )
  })

  it('limita limit a 100 mesmo quando solicitado valor maior (defesa)', async () => {
    await receitasDbService.paginate({}, { page: 1, limit: 500 })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    )
  })

  it('forca page minima 1 quando solicitado page < 1 (defesa)', async () => {
    const result = await receitasDbService.paginate({}, { page: -3, limit: 10 })

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
      })
    )
    expect(result.pagination.page).toBe(1)
  })

  it('aplica filtros junto com paginacao', async () => {
    await receitasDbService.paginate(
      { situacao: 'ARRECADADA', ano: 2026 },
      { page: 1, limit: 20 }
    )

    expect(prisma.receita.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ situacao: 'ARRECADADA', ano: 2026 }),
        skip: 0,
        take: 20,
      })
    )
    expect(prisma.receita.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ situacao: 'ARRECADADA', ano: 2026 }),
      })
    )
  })

  it('garante totalPages minimo 1 mesmo com total = 0', async () => {
    prisma.receita.count.mockResolvedValue(0)
    const result = await receitasDbService.paginate()
    expect(result.pagination.totalPages).toBe(1)
  })

  it('calcula hasNext e hasPrev corretamente', async () => {
    prisma.receita.count.mockResolvedValue(50)
    const result = await receitasDbService.paginate({}, { page: 2, limit: 10 })

    expect(result.pagination.hasNext).toBe(true)
    expect(result.pagination.hasPrev).toBe(true)
  })
})

// PNTP 3.1 - criacao de receitas (registro de arrecadacao)
describe('receitasDbService.create (PNTP 3.1 - registro de receita)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria receita com payload valido', async () => {
    prisma.receita.create.mockResolvedValue({ id: 'r1', valorArrecadado: 1000 })

    await receitasDbService.create({
      ano: 2026,
      mes: 5,
      data: new Date('2026-05-15'),
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRIBUTARIA',
      valorArrecadado: 1000,
    })

    expect(prisma.receita.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ano: 2026,
          mes: 5,
          categoria: 'RECEITA_CORRENTE',
          origem: 'TRIBUTARIA',
          valorArrecadado: 1000,
          situacao: 'ARRECADADA',
        }),
      })
    )
  })

  it('aplica defaults para valorPrevisto e situacao quando nao informados', async () => {
    prisma.receita.create.mockResolvedValue({ id: 'r2' })

    await receitasDbService.create({
      ano: 2026,
      mes: 5,
      data: new Date('2026-05-15'),
      categoria: 'RECEITA_CAPITAL',
      origem: 'TRANSFERENCIAS',
      valorArrecadado: 500,
    })

    const chamada = prisma.receita.create.mock.calls[0][0]
    expect(chamada.data.valorPrevisto).toBe(0)
    expect(chamada.data.situacao).toBe('ARRECADADA')
  })

  it('preserva campos opcionais quando informados', async () => {
    prisma.receita.create.mockResolvedValue({ id: 'r3' })

    await receitasDbService.create({
      ano: 2026,
      mes: 5,
      data: new Date('2026-05-15'),
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRIBUTARIA',
      valorArrecadado: 2500,
      valorPrevisto: 3000,
      contribuinte: 'Empresa Z',
      cnpjCpf: '12.345.678/0001-99',
      fonteRecurso: 'TESOURO',
      observacoes: 'IPTU 2026',
    })

    const chamada = prisma.receita.create.mock.calls[0][0]
    expect(chamada.data.valorPrevisto).toBe(3000)
    expect(chamada.data.contribuinte).toBe('Empresa Z')
    expect(chamada.data.cnpjCpf).toBe('12.345.678/0001-99')
    expect(chamada.data.fonteRecurso).toBe('TESOURO')
    expect(chamada.data.observacoes).toBe('IPTU 2026')
  })

  it('aceita situacao customizada (PREVISTA)', async () => {
    prisma.receita.create.mockResolvedValue({ id: 'r4' })

    await receitasDbService.create({
      ano: 2026,
      mes: 5,
      data: new Date('2026-05-15'),
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRIBUTARIA',
      valorArrecadado: 0,
      valorPrevisto: 5000,
      situacao: 'PREVISTA',
    })

    const chamada = prisma.receita.create.mock.calls[0][0]
    expect(chamada.data.situacao).toBe('PREVISTA')
  })

  it('converte string de data em Date', async () => {
    prisma.receita.create.mockResolvedValue({ id: 'r5' })

    await receitasDbService.create({
      ano: 2026,
      mes: 5,
      data: '2026-05-15',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRIBUTARIA',
      valorArrecadado: 100,
    })

    const chamada = prisma.receita.create.mock.calls[0][0]
    expect(chamada.data.data).toBeInstanceOf(Date)
  })
})
