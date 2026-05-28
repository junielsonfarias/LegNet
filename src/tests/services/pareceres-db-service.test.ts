import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    parecer: {
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

import { prisma as _prisma } from '@/lib/prisma'
import { pareceresDbService } from '@/lib/services/pareceres-db-service'

const prisma = _prisma as any

describe('pareceresDbService.list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.parecer.findMany.mockResolvedValue([])
  })

  it('P0-4: aplica filtro notDeleted (deletedAt: null) por padrao', async () => {
    await pareceresDbService.list()

    expect(prisma.parecer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )
  })

  it('combina notDeleted com filtros (comissaoId + proposicaoId)', async () => {
    await pareceresDbService.list({
      comissaoId: 'com-1',
      proposicaoId: 'prop-1',
    })

    expect(prisma.parecer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          comissaoId: 'com-1',
          proposicaoId: 'prop-1',
        }),
      })
    )
  })

  it('aplica todos os filtros (relatorId + status + tipo + ano)', async () => {
    await pareceresDbService.list({
      relatorId: 'parl-1',
      status: 'APROVADO',
      tipo: 'FAVORAVEL',
      ano: 2026,
    })

    expect(prisma.parecer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          relatorId: 'parl-1',
          status: 'APROVADO',
          tipo: 'FAVORAVEL',
          ano: 2026,
        }),
      })
    )
  })

  it('orderBy dataDistribuicao desc (pareceres recentes primeiro)', async () => {
    await pareceresDbService.list()

    expect(prisma.parecer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ dataDistribuicao: 'desc' }],
      })
    )
  })

  it('include defaultInclude (proposicao + comissao + relator)', async () => {
    await pareceresDbService.list()

    expect(prisma.parecer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          proposicao: expect.any(Object),
          comissao: expect.any(Object),
          relator: expect.any(Object),
        }),
      })
    )
  })

  it('retorna array de pareceres (estrutura direta - sem paginacao)', async () => {
    const mockData = [
      { id: 'p1', tipo: 'FAVORAVEL', status: 'APROVADO' },
      { id: 'p2', tipo: 'CONTRARIO', status: 'APROVADO' },
    ]
    prisma.parecer.findMany.mockResolvedValue(mockData)

    const result = await pareceresDbService.list({})

    expect(result).toEqual(mockData)
  })
})

describe('pareceresDbService.checkDuplicate (RN-073 - 1 parecer por proposicao+comissao)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('busca por chave composta proposicao+comissao', async () => {
    await pareceresDbService.checkDuplicate('prop-1', 'com-1')

    expect(prisma.parecer.findUnique).toHaveBeenCalledWith({
      where: { proposicaoId_comissaoId: { proposicaoId: 'prop-1', comissaoId: 'com-1' } },
    })
  })

  it('retorna parecer existente quando ja ha duplicata', async () => {
    prisma.parecer.findUnique.mockResolvedValue({ id: 'existing', status: 'APROVADO' })

    const result = await pareceresDbService.checkDuplicate('prop-1', 'com-1')

    expect(result).toMatchObject({ id: 'existing' })
  })

  it('retorna null quando nao ha duplicata', async () => {
    prisma.parecer.findUnique.mockResolvedValue(null)

    const result = await pareceresDbService.checkDuplicate('prop-1', 'com-1')

    expect(result).toBeNull()
  })
})
