import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sessao: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/utils/sessoes-utils', () => ({
  getLegislaturaAtual: vi.fn(),
  getLegislaturaParaData: vi.fn(),
  getPeriodoAtual: vi.fn(),
  getPeriodoParaData: vi.fn(),
  getProximoNumeroSessaoOrdinaria: vi.fn(),
  gerarPautaAutomatica: vi.fn(),
  gerarAtaSessao: vi.fn(),
}))

vi.mock('@/lib/utils/date', () => ({
  combineDateAndTimeUTC: vi.fn((d: Date) => d),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

import { prisma as _prisma } from '@/lib/prisma'
import { sessaoDbService } from '@/lib/services/sessao-db-service'

const prisma = _prisma as any

describe('sessaoDbService.list (paginate)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.sessao.findMany.mockResolvedValue([])
    prisma.sessao.count.mockResolvedValue(0)
  })

  it('P0-4: aplica filtro notDeleted (deletedAt: null) por padrao', async () => {
    await sessaoDbService.list()

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )
  })

  it('combina notDeleted com filtros (status + tipo + legislaturaId)', async () => {
    await sessaoDbService.list({
      status: 'AGENDADA',
      tipo: 'ORDINARIA',
      legislaturaId: 'leg-2024',
    })

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: 'AGENDADA',
          tipo: 'ORDINARIA',
          legislaturaId: 'leg-2024',
        }),
      })
    )
  })

  it('filtro por ano converte para range de datas (gte/lt)', async () => {
    await sessaoDbService.list({ ano: 2026 })

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          data: {
            gte: new Date('2026-01-01'),
            lt: new Date('2027-01-01'),
          },
        }),
      })
    )
  })

  it('paginacao: page=1, limit=50 por padrao (skip=0)', async () => {
    await sessaoDbService.list()

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 50 })
    )
  })

  it('paginacao: clampa limit em 100 (max menor que outras entidades)', async () => {
    await sessaoDbService.list({}, { page: 1, limit: 9999 })

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })

  it('orderBy data desc, numero desc (recentes primeiro)', async () => {
    await sessaoDbService.list()

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ data: 'desc' }, { numero: 'desc' }],
      })
    )
  })

  it('retorna estrutura { data, pagination: { total, page, limit, totalPages, hasNext, hasPrev } }', async () => {
    prisma.sessao.findMany.mockResolvedValue([{ id: 's1' }, { id: 's2' }])
    prisma.sessao.count.mockResolvedValue(125)

    const result = await sessaoDbService.list({}, { page: 2, limit: 10 })

    expect(result).toEqual({
      data: [{ id: 's1' }, { id: 's2' }],
      pagination: {
        total: 125,
        page: 2,
        limit: 10,
        totalPages: 13,
        hasNext: true,
        hasPrev: true,
      },
    })
  })

  it('hasPrev false na primeira pagina', async () => {
    prisma.sessao.count.mockResolvedValue(100)

    const result = await sessaoDbService.list({}, { page: 1, limit: 10 })

    expect(result.pagination.hasPrev).toBe(false)
    expect(result.pagination.hasNext).toBe(true)
  })

  it('hasNext false na ultima pagina', async () => {
    prisma.sessao.count.mockResolvedValue(15)

    const result = await sessaoDbService.list({}, { page: 2, limit: 10 })

    expect(result.pagination.hasPrev).toBe(true)
    expect(result.pagination.hasNext).toBe(false)
  })
})

describe('sessaoDbService.listPublic (API integracoes)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.sessao.findMany.mockResolvedValue([])
  })

  it('P0-4: aplica filtro notDeleted na API publica de integracoes', async () => {
    await sessaoDbService.listPublic({})

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )
  })

  it('aplica filtro de status na API publica', async () => {
    await sessaoDbService.listPublic({ status: 'CONCLUIDA' })

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null, status: 'CONCLUIDA' }),
      })
    )
  })

  it('aplica range de datas (from + to)', async () => {
    const from = new Date('2026-01-01')
    const to = new Date('2026-12-31')
    await sessaoDbService.listPublic({ from, to })

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          data: { gte: from, lte: to },
        }),
      })
    )
  })

  it('usa take=50 por default, customizavel via limit', async () => {
    await sessaoDbService.listPublic({ limit: 20 })

    expect(prisma.sessao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 })
    )
  })
})
