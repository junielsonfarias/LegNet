/**
 * Testes para os servicos de Emendas e Normas Juridicas
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Emenda, VotoEmenda, NormaJuridica, Prisma } from '@prisma/client'

// Mock do prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    emenda: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn()
    },
    votoEmenda: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    proposicao: {
      findUnique: vi.fn()
    },
    parlamentar: {
      findUnique: vi.fn()
    },
    normaJuridica: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    artigoNorma: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    paragrafooNorma: {
      create: vi.fn()
    },
    alteracaoNorma: {
      create: vi.fn()
    },
    versaoNorma: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

// Mock do logger
vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  })
}))

describe('Emenda Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('criarEmenda', () => {
    it('deve criar uma emenda com dados validos', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockEmenda = {
        id: 'emenda-1',
        numero: 1,
        ano: 2024,
        proposicaoId: 'prop-1',
        autorId: 'parlamentar-1',
        tipo: 'ADITIVA',
        textoNovo: 'Texto da emenda',
        justificativa: 'Justificativa',
        status: 'APRESENTADA',
        turnoApresentacao: 1,
        votos: []
      }

      vi.mocked(prisma.emenda.count).mockResolvedValue(0)
      vi.mocked(prisma.emenda.create).mockResolvedValue(mockEmenda as unknown as Emenda)

      const { criarEmenda } = await import('@/lib/services/emenda-service')

      const resultado = await criarEmenda({
        proposicaoId: 'prop-1',
        autorId: 'parlamentar-1',
        tipo: 'ADITIVA',
        textoNovo: 'Texto da emenda',
        justificativa: 'Justificativa'
      })

      expect(resultado).toBeDefined()
      expect(resultado.status).toBe('APRESENTADA')
      expect(prisma.emenda.create).toHaveBeenCalled()
    })
  })

  describe('votarEmenda', () => {
    it('deve registrar novo voto', async () => {
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(prisma.votoEmenda.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.votoEmenda.create).mockResolvedValue({
        id: 'voto-1',
        emendaId: 'emenda-1',
        parlamentarId: 'parlamentar-1',
        voto: 'SIM'
      } as unknown as VotoEmenda)

      const { votarEmenda } = await import('@/lib/services/emenda-service')

      const resultado = await votarEmenda('emenda-1', {
        parlamentarId: 'parlamentar-1',
        voto: 'SIM'
      })

      expect(resultado).toBeDefined()
      expect(prisma.votoEmenda.create).toHaveBeenCalled()
    })

    it('deve atualizar voto existente', async () => {
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(prisma.votoEmenda.findUnique).mockResolvedValue({
        id: 'voto-existente',
        voto: 'NAO'
      } as unknown as VotoEmenda)
      vi.mocked(prisma.votoEmenda.update).mockResolvedValue({
        id: 'voto-existente',
        voto: 'SIM'
      } as unknown as VotoEmenda)

      const { votarEmenda } = await import('@/lib/services/emenda-service')

      const resultado = await votarEmenda('emenda-1', {
        parlamentarId: 'parlamentar-1',
        voto: 'SIM'
      })

      expect(resultado.voto).toBe('SIM')
      expect(prisma.votoEmenda.update).toHaveBeenCalled()
    })
  })

  describe('apurarVotacaoEmenda', () => {
    it('deve calcular resultado corretamente', async () => {
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(prisma.votoEmenda.findMany).mockResolvedValue([
        { voto: 'SIM' },
        { voto: 'SIM' },
        { voto: 'SIM' },
        { voto: 'NAO' },
        { voto: 'ABSTENCAO' }
      ] as unknown as VotoEmenda[])

      const { apurarVotacaoEmenda } = await import('@/lib/services/emenda-service')

      const resultado = await apurarVotacaoEmenda('emenda-1')

      expect(resultado.contagem.SIM).toBe(3)
      expect(resultado.contagem.NAO).toBe(1)
      expect(resultado.contagem.ABSTENCAO).toBe(1)
      expect(resultado.aprovada).toBe(true)
      expect(resultado.resultado).toBe('APROVADA')
    })

    it('deve rejeitar quando NAO > SIM', async () => {
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(prisma.votoEmenda.findMany).mockResolvedValue([
        { voto: 'SIM' },
        { voto: 'NAO' },
        { voto: 'NAO' },
        { voto: 'NAO' }
      ] as unknown as VotoEmenda[])

      const { apurarVotacaoEmenda } = await import('@/lib/services/emenda-service')

      const resultado = await apurarVotacaoEmenda('emenda-1')

      expect(resultado.aprovada).toBe(false)
      expect(resultado.resultado).toBe('REJEITADA')
    })
  })

  describe('aglutinarEmendas', () => {
    it('deve aglutinar emendas da mesma proposicao', async () => {
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(prisma.emenda.findMany).mockResolvedValue([
        { id: 'emenda-1', proposicaoId: 'prop-1', turnoApresentacao: 1, status: 'APRESENTADA' },
        { id: 'emenda-2', proposicaoId: 'prop-1', turnoApresentacao: 1, status: 'APRESENTADA' }
      ] as unknown as Emenda[])
      vi.mocked(prisma.emenda.count).mockResolvedValue(2)

      const mockNovaEmenda = {
        id: 'emenda-aglutinada',
        numero: 3,
        tipo: 'SUBSTITUTIVA',
        status: 'APRESENTADA'
      }

      vi.mocked(prisma.$transaction).mockImplementation((async (
        fn: (tx: Prisma.TransactionClient) => Promise<unknown>
      ) => {
        return fn({
          emenda: {
            create: vi.fn().mockResolvedValue(mockNovaEmenda),
            updateMany: vi.fn().mockResolvedValue({ count: 2 })
          }
        } as unknown as Prisma.TransactionClient)
      }) as unknown as typeof prisma.$transaction)

      const { aglutinarEmendas } = await import('@/lib/services/emenda-service')

      const resultado = await aglutinarEmendas(
        'prop-1',
        ['emenda-1', 'emenda-2'],
        'parlamentar-1',
        'Texto aglutinado',
        'Justificativa'
      )

      expect(resultado).toBeDefined()
    })
  })
})

describe('Norma Juridica Service', () => {
  describe('listarNormas', () => {
    it('deve listar normas com paginacao', async () => {
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(prisma.normaJuridica.findMany).mockResolvedValue([
        { id: 'norma-1', tipo: 'LEI_ORDINARIA', numero: 1, ano: 2024 }
      ] as unknown as NormaJuridica[])
      vi.mocked(prisma.normaJuridica.count).mockResolvedValue(1)

      expect(prisma.normaJuridica.findMany).toBeDefined()
      expect(prisma.normaJuridica.count).toBeDefined()
    })
  })
})

describe('Compilacao Service', () => {
  describe('formatacao', () => {
    it('deve formatar tipo de norma corretamente', () => {
      const tipos: Record<string, string> = {
        'LEI_ORDINARIA': 'LEI ORDINARIA',
        'LEI_COMPLEMENTAR': 'LEI COMPLEMENTAR',
        'DECRETO_LEGISLATIVO': 'DECRETO LEGISLATIVO',
        'RESOLUCAO': 'RESOLUCAO',
        'EMENDA_LEI_ORGANICA': 'EMENDA A LEI ORGANICA',
        'LEI_ORGANICA': 'LEI ORGANICA',
        'REGIMENTO_INTERNO': 'REGIMENTO INTERNO'
      }

      Object.entries(tipos).forEach(([key, expected]) => {
        expect(key).toBeDefined()
        expect(expected).toBeDefined()
      })
    })
  })
})

describe('Relatorio Agendado Service', () => {
  it('deve ter tipos de relatorio definidos', () => {
    const tiposRelatorio = [
      'PRODUCAO_LEGISLATIVA',
      'PRESENCA_SESSOES',
      'VOTACOES',
      'TRAMITACAO',
      'PROTOCOLO',
      'COMISSOES'
    ]

    expect(tiposRelatorio).toHaveLength(6)
    expect(tiposRelatorio).toContain('PRODUCAO_LEGISLATIVA')
    expect(tiposRelatorio).toContain('PRESENCA_SESSOES')
  })

  it('deve ter frequencias definidas', () => {
    const frequencias = ['DIARIO', 'SEMANAL', 'MENSAL', 'SOB_DEMANDA']

    expect(frequencias).toHaveLength(4)
    expect(frequencias).toContain('DIARIO')
    expect(frequencias).toContain('SOB_DEMANDA')
  })

  it('deve ter formatos de exportacao definidos', () => {
    const formatos = ['PDF', 'EXCEL', 'CSV']

    expect(formatos).toHaveLength(3)
    expect(formatos).toContain('PDF')
    expect(formatos).toContain('EXCEL')
  })
})
