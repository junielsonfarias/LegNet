import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    autor: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
      delete: vi.fn(),
    },
    proposicao: {
      count: vi.fn().mockResolvedValue(0),
    },
    tipoAutor: {
      findUnique: vi.fn(),
    },
    parlamentar: {
      findUnique: vi.fn(),
    },
    comissao: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma as _prisma } from '@/lib/prisma'
import { autorDbService } from '@/lib/services/autor-db-service'

const prisma = _prisma as any

describe('autorDbService.list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.autor.findMany.mockResolvedValue([])
  })

  it('lista sem filtros (where vazio)', async () => {
    await autorDbService.list()

    expect(prisma.autor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it('filtro ativo=true', async () => {
    await autorDbService.list({ ativo: true })

    expect(prisma.autor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ativo: true }) })
    )
  })

  it('filtro ativo=false (distingue de undefined)', async () => {
    await autorDbService.list({ ativo: false })

    expect(prisma.autor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ativo: false }) })
    )
  })

  it('filtro tipoAutorId', async () => {
    await autorDbService.list({ tipoAutorId: 'tipo-1' })

    expect(prisma.autor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tipoAutorId: 'tipo-1' }) })
    )
  })

  it('search aplica OR em nome E cargo (case insensitive)', async () => {
    await autorDbService.list({ search: 'Prefeito' })

    expect(prisma.autor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { nome: { contains: 'Prefeito', mode: 'insensitive' } },
            { cargo: { contains: 'Prefeito', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })

  it('orderBy nome asc (alfabetico)', async () => {
    await autorDbService.list()

    expect(prisma.autor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ nome: 'asc' }] })
    )
  })
})

describe('autorDbService.checkParlamentarVinculado (RN: 1 parlamentar = 1 autor)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('busca por parlamentarId', async () => {
    await autorDbService.checkParlamentarVinculado('parl-1')

    expect(prisma.autor.findFirst).toHaveBeenCalledWith({
      where: { parlamentarId: 'parl-1' },
    })
  })

  it('com excludeId: ignora o autor em edicao', async () => {
    await autorDbService.checkParlamentarVinculado('parl-1', 'autor-1')

    expect(prisma.autor.findFirst).toHaveBeenCalledWith({
      where: { parlamentarId: 'parl-1', id: { not: 'autor-1' } },
    })
  })

  it('retorna autor existente em duplicata', async () => {
    prisma.autor.findFirst.mockResolvedValue({ id: 'dup', parlamentarId: 'parl-1' })

    const result = await autorDbService.checkParlamentarVinculado('parl-1')

    expect(result).toMatchObject({ id: 'dup' })
  })
})

describe('autorDbService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.autor.create.mockResolvedValue({ id: 'new' })
  })

  it('cria com defaults (ativo=true, campos opcionais = null)', async () => {
    await autorDbService.create({
      tipoAutorId: 'tipo-1',
      nome: 'Joao da Silva',
    })

    expect(prisma.autor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipoAutorId: 'tipo-1',
          nome: 'Joao da Silva',
          descricao: null,
          parlamentarId: null,
          comissaoId: null,
          cargo: null,
          email: null,
          telefone: null,
          ativo: true,
        }),
      })
    )
  })

  it('cria com vinculo a parlamentar', async () => {
    await autorDbService.create({
      tipoAutorId: 'tipo-vereador',
      nome: 'Ver. Maria',
      parlamentarId: 'parl-1',
    })

    expect(prisma.autor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parlamentarId: 'parl-1',
        }),
      })
    )
  })

  it('cria com ativo=false explicito', async () => {
    await autorDbService.create({
      tipoAutorId: 'tipo-1',
      nome: 'Inativo',
      ativo: false,
    })

    expect(prisma.autor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ativo: false }),
      })
    )
  })
})

describe('autorDbService.remove (protege integridade referencial)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lanca erro se autor tem proposicoes vinculadas', async () => {
    prisma.proposicao.count.mockResolvedValue(5)

    await expect(autorDbService.remove('autor-1')).rejects.toThrow(
      /5 proposições vinculadas/i
    )

    expect(prisma.autor.delete).not.toHaveBeenCalled()
  })

  it('deleta quando nao ha proposicoes vinculadas', async () => {
    prisma.proposicao.count.mockResolvedValue(0)
    prisma.autor.delete.mockResolvedValue({ id: 'autor-1' })

    const result = await autorDbService.remove('autor-1')

    expect(prisma.autor.delete).toHaveBeenCalledWith({ where: { id: 'autor-1' } })
    expect(result).toEqual({ success: true })
  })
})

describe('autorDbService.tipoAutorExists / parlamentarExists / comissaoExists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tipoAutorExists chama tipoAutor.findUnique', async () => {
    await autorDbService.tipoAutorExists('tipo-1')

    expect(prisma.tipoAutor.findUnique).toHaveBeenCalledWith({ where: { id: 'tipo-1' } })
  })

  it('parlamentarExists chama parlamentar.findUnique', async () => {
    await autorDbService.parlamentarExists('parl-1')

    expect(prisma.parlamentar.findUnique).toHaveBeenCalledWith({ where: { id: 'parl-1' } })
  })

  it('comissaoExists chama comissao.findUnique', async () => {
    await autorDbService.comissaoExists('com-1')

    expect(prisma.comissao.findUnique).toHaveBeenCalledWith({ where: { id: 'com-1' } })
  })
})
