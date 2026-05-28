import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma — sem banco real
vi.mock('@/lib/prisma', () => ({
  prisma: {
    proposicao: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
      delete: vi.fn(),
    },
    parlamentar: {
      findUnique: vi.fn(),
    },
    autor: {
      findUnique: vi.fn(),
    },
  },
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
import { proposicaoDbService } from '@/lib/services/proposicao-db-service'

const prisma = _prisma as any

describe('proposicaoDbService.list (paginate)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.proposicao.findMany.mockResolvedValue([])
    prisma.proposicao.count.mockResolvedValue(0)
  })

  it('P0-4: aplica filtro notDeleted (deletedAt: null) por padrao', async () => {
    await proposicaoDbService.list()

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )
  })

  it('combina notDeleted com filtros adicionais (status + tipo)', async () => {
    await proposicaoDbService.list({ status: 'APROVADA', tipo: 'PROJETO_LEI' })

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: 'APROVADA',
          tipo: 'PROJETO_LEI',
        }),
      })
    )
  })

  it('aplica todos os filtros (status + tipo + autorId + ano + entradaRetroativa)', async () => {
    await proposicaoDbService.list({
      status: 'EM_TRAMITACAO',
      tipo: 'INDICACAO',
      autorId: 'autor-123',
      ano: 2026,
      entradaRetroativa: false,
    })

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: 'EM_TRAMITACAO',
          tipo: 'INDICACAO',
          autorId: 'autor-123',
          ano: 2026,
          entradaRetroativa: false,
        }),
      })
    )
  })

  it('paginacao: page=1, limit=50 por padrao (skip=0, take=50)', async () => {
    await proposicaoDbService.list()

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 50 })
    )
  })

  it('paginacao: page=3, limit=10 calcula skip=20', async () => {
    await proposicaoDbService.list({}, { page: 3, limit: 10 })

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
  })

  it('paginacao: clampa limit em 500 (anti payload)', async () => {
    await proposicaoDbService.list({}, { page: 1, limit: 9999 })

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 })
    )
  })

  it('paginacao: clampa limit em 1 minimo (rejeita 0/negativo)', async () => {
    await proposicaoDbService.list({}, { page: 1, limit: 0 })

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 })
    )
  })

  it('paginacao: clampa page em 1 minimo (rejeita 0/negativo)', async () => {
    await proposicaoDbService.list({}, { page: -5, limit: 10 })

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    )
  })

  it('inclui autor e sessao via select (defaultAutorSelect/defaultSessaoSelect)', async () => {
    await proposicaoDbService.list()

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          autor: { select: expect.objectContaining({ id: true, nome: true, apelido: true, partido: true }) },
          sessao: { select: expect.objectContaining({ id: true, numero: true, data: true }) },
        }),
      })
    )
  })

  it('orderBy dataApresentacao desc (proposicoes recentes primeiro)', async () => {
    await proposicaoDbService.list()

    expect(prisma.proposicao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { dataApresentacao: 'desc' },
      })
    )
  })

  it('retorna estrutura { proposicoes, total, page, limit, totalPages }', async () => {
    prisma.proposicao.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }])
    prisma.proposicao.count.mockResolvedValue(125)

    const result = await proposicaoDbService.list({}, { page: 2, limit: 10 })

    expect(result).toEqual({
      proposicoes: [{ id: 'p1' }, { id: 'p2' }],
      total: 125,
      page: 2,
      limit: 10,
      totalPages: 13, // Math.ceil(125 / 10)
    })
  })

  it('count tambem aplica notDeleted (paridade com findMany)', async () => {
    await proposicaoDbService.list({ status: 'APROVADA' })

    expect(prisma.proposicao.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ deletedAt: null, status: 'APROVADA' }),
    })
  })
})

describe('proposicaoDbService.findByIdOrSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.proposicao.findUnique.mockResolvedValue(null)
    prisma.proposicao.findFirst.mockResolvedValue(null)
  })

  it('busca por ID (cuid) usa findUnique direto', async () => {
    const cuid = 'clx1234567890abcdef'
    prisma.proposicao.findUnique.mockResolvedValue({ id: cuid, numero: '0042', ano: 2026 })

    await proposicaoDbService.findByIdOrSlug(cuid)

    expect(prisma.proposicao.findUnique).toHaveBeenCalledWith({ where: { id: cuid } })
  })

  it('busca por slug tenta findUnique({ slug }) primeiro', async () => {
    const slug = 'pl-0042-2026'
    prisma.proposicao.findUnique.mockResolvedValue({ id: 'abc', slug })

    const result = await proposicaoDbService.findByIdOrSlug(slug)

    expect(prisma.proposicao.findUnique).toHaveBeenCalledWith({ where: { slug } })
    expect(result).toMatchObject({ id: 'abc', slug })
  })
})
