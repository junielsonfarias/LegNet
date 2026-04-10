import { publicacoesService } from '@/lib/publicacoes-service'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    publicacao: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args: any) => Promise.resolve({
        id: 'pub-test-1',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        visualizacoes: 0,
      })),
      update: jest.fn().mockImplementation((args: any) => Promise.resolve({
        id: args.where.id,
        titulo: 'Publicacao Teste',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { visualizacoes: 0 } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    categoriaPublicacao: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
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
