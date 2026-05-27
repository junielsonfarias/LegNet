import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    despesa: {
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
import { despesasDbService } from '@/lib/services/despesas-db-service'

const prisma = _prisma as any

// PNTP 4.1 / 4.2 / 4.3 essencial - despesas empenhadas/liquidadas/pagas
describe('despesasDbService.list (PNTP 4.1 - despesas)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.despesa.findMany.mockResolvedValue([])
  })

  it('lista todas as despesas quando nao ha filtros', async () => {
    await despesasDbService.list()

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
        include: { licitacao: true, contrato: true, convenio: true },
      })
    )
  })

  it('aplica filtro de situacao (PAGA)', async () => {
    await despesasDbService.list({ situacao: 'PAGA' })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ situacao: 'PAGA' }),
      })
    )
  })

  it('aplica filtros temporais (ano e mes)', async () => {
    await despesasDbService.list({ ano: 2026, mes: 5 })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ano: 2026, mes: 5 }),
      })
    )
  })

  it('usa contains case insensitive no filtro de credor', async () => {
    await despesasDbService.list({ credor: 'Maria' })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          credor: { contains: 'Maria', mode: 'insensitive' },
        }),
      })
    )
  })

  it('aplica range valorMinimo/valorMaximo em valorEmpenhado', async () => {
    await despesasDbService.list({ valorMinimo: 100, valorMaximo: 1000 })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          valorEmpenhado: { gte: 100, lte: 1000 },
        }),
      })
    )
  })

  it('aplica apenas valorMinimo quando valorMaximo ausente', async () => {
    await despesasDbService.list({ valorMinimo: 500 })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          valorEmpenhado: { gte: 500 },
        }),
      })
    )
  })

  it('combina varios filtros simultaneamente', async () => {
    await despesasDbService.list({
      situacao: 'LIQUIDADA',
      ano: 2026,
      credor: 'ACME',
      funcao: 'SAUDE',
    })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          situacao: 'LIQUIDADA',
          ano: 2026,
          credor: { contains: 'ACME', mode: 'insensitive' },
          funcao: 'SAUDE',
        }),
      })
    )
  })
})

// PNTP 4.1 - paginacao publica das despesas
describe('despesasDbService.paginate (PNTP 4.1 - paginacao)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.despesa.findMany.mockResolvedValue([])
    prisma.despesa.count.mockResolvedValue(0)
  })

  it('retorna estrutura {data, pagination: {total, page, limit, totalPages}}', async () => {
    prisma.despesa.count.mockResolvedValue(25)
    prisma.despesa.findMany.mockResolvedValue([{ id: 'd1' }])

    const result = await despesasDbService.paginate()

    expect(result).toMatchObject({
      data: [{ id: 'd1' }],
      pagination: expect.objectContaining({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      }),
    })
  })

  it('calcula skip corretamente para pagina 2 com limit 5 (skip = 5)', async () => {
    await despesasDbService.paginate({}, { page: 2, limit: 5 })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    )
  })

  it('limita limit a 100 mesmo quando solicitado valor maior (defesa)', async () => {
    await despesasDbService.paginate({}, { page: 1, limit: 500 })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    )
  })

  it('forca page minima 1 quando solicitado page < 1 (defesa)', async () => {
    await despesasDbService.paginate({}, { page: 0, limit: 10 })

    const result = await despesasDbService.paginate({}, { page: -5, limit: 10 })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
      })
    )
    expect(result.pagination.page).toBe(1)
  })

  it('aplica filtros junto com paginacao', async () => {
    await despesasDbService.paginate({ situacao: 'PAGA', ano: 2026 }, { page: 1, limit: 20 })

    expect(prisma.despesa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ situacao: 'PAGA', ano: 2026 }),
        skip: 0,
        take: 20,
      })
    )
    expect(prisma.despesa.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ situacao: 'PAGA', ano: 2026 }),
      })
    )
  })

  it('garante totalPages minimo 1 mesmo com total = 0', async () => {
    prisma.despesa.count.mockResolvedValue(0)
    const result = await despesasDbService.paginate()
    expect(result.pagination.totalPages).toBe(1)
  })

  it('calcula hasNext e hasPrev corretamente', async () => {
    prisma.despesa.count.mockResolvedValue(50)
    const result = await despesasDbService.paginate({}, { page: 2, limit: 10 })

    expect(result.pagination.hasNext).toBe(true)
    expect(result.pagination.hasPrev).toBe(true)
  })
})

// PNTP 4.2 / 4.3 - criacao de despesas (registro de empenho/liquidacao/pagamento)
describe('despesasDbService.create (PNTP 4.2 - registro de despesa)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria despesa com payload valido', async () => {
    prisma.despesa.create.mockResolvedValue({ id: 'd1', numeroEmpenho: '2026NE0001' })

    await despesasDbService.create({
      numeroEmpenho: '2026NE0001',
      ano: 2026,
      mes: 5,
      data: new Date('2026-05-15'),
      credor: 'Fornecedor XYZ',
      valorEmpenhado: 1500.5,
    })

    expect(prisma.despesa.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numeroEmpenho: '2026NE0001',
          ano: 2026,
          mes: 5,
          credor: 'Fornecedor XYZ',
          valorEmpenhado: 1500.5,
          situacao: 'EMPENHADA',
        }),
      })
    )
  })

  it('aplica defaults para valorLiquidado, valorPago e situacao quando nao informados', async () => {
    prisma.despesa.create.mockResolvedValue({ id: 'd2' })

    await despesasDbService.create({
      numeroEmpenho: '2026NE0002',
      ano: 2026,
      mes: 5,
      data: new Date('2026-05-15'),
      credor: 'Credor A',
      valorEmpenhado: 200,
    })

    const chamada = prisma.despesa.create.mock.calls[0][0]
    expect(chamada.data.valorLiquidado).toBe(0)
    expect(chamada.data.valorPago).toBe(0)
    expect(chamada.data.situacao).toBe('EMPENHADA')
  })

  it('trim em numeroEmpenho e credor (limpeza de espacos)', async () => {
    prisma.despesa.create.mockResolvedValue({ id: 'd3' })

    await despesasDbService.create({
      numeroEmpenho: '  2026NE0003  ',
      ano: 2026,
      mes: 5,
      data: new Date('2026-05-15'),
      credor: '  Empresa B  ',
      valorEmpenhado: 100,
    })

    const chamada = prisma.despesa.create.mock.calls[0][0]
    expect(chamada.data.numeroEmpenho).toBe('2026NE0003')
    expect(chamada.data.credor).toBe('Empresa B')
  })

  it('preserva situacao customizada quando informada (PAGA)', async () => {
    prisma.despesa.create.mockResolvedValue({ id: 'd4' })

    await despesasDbService.create({
      numeroEmpenho: '2026NE0004',
      ano: 2026,
      mes: 5,
      data: new Date('2026-05-15'),
      credor: 'Credor B',
      valorEmpenhado: 500,
      valorLiquidado: 500,
      valorPago: 500,
      situacao: 'PAGA',
    })

    const chamada = prisma.despesa.create.mock.calls[0][0]
    expect(chamada.data.situacao).toBe('PAGA')
    expect(chamada.data.valorPago).toBe(500)
  })
})
