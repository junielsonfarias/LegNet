import { vi } from 'vitest'
import { publicacoesService } from '@/lib/publicacoes-service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    publicacao: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({
        id: 'pub-test-1',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        visualizacoes: 0,
      })),
      update: vi.fn().mockImplementation((args: any) => Promise.resolve({
        id: args.where.id,
        titulo: 'Publicacao Teste',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { visualizacoes: 0 } }),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    categoriaPublicacao: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  }
}))

describe('publicacoesService', () => {
  it('lista publicações retorna array', async () => {
    const result = await publicacoesService.list()
    expect(Array.isArray(result)).toBe(true)
  })

  it('retorna estatísticas com propriedades corretas', async () => {
    const stats = await publicacoesService.getStats()
    expect(stats).toHaveProperty('total')
    expect(stats).toHaveProperty('publicadas')
    expect(stats).toHaveProperty('rascunhos')
    expect(stats).toHaveProperty('totalVisualizacoes')
  })
})
