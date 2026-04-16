import { vi } from "vitest"
/**
 * Testes do Servico de Painel em Tempo Real
 */

// Mock do Prisma - deve vir ANTES do import
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sessao: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn()
    },
    presencaSessao: {
      upsert: vi.fn(),
      findMany: vi.fn().mockResolvedValue([])
    },
    votacao: {
      upsert: vi.fn(),
      findMany: vi.fn().mockResolvedValue([])
    },
    voto: {
      findMany: vi.fn().mockResolvedValue([])
    },
    proposicao: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn()
    },
    pautaItem: {
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue([])
    },
    pautaSessao: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([])
    },
    mandato: {
      findMany: vi.fn().mockResolvedValue([])
    },
    parlamentar: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}))

// Mock do logger
vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

// Import apos mocks
import { prisma } from '@/lib/prisma'
import {
  getEstadoPainel,
  iniciarSessao,
  finalizarSessao,
  registrarPresenca,
  limparTodosEstados
} from '@/lib/services/painel-tempo-real-service'

const mockPrisma = prisma as any

describe('Painel Tempo Real Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    limparTodosEstados()
  })

  describe('getEstadoPainel', () => {
    it('deve retornar null para sessao inexistente', async () => {
      (mockPrisma.sessao.findUnique as any).mockResolvedValue(null)

      const estado = await getEstadoPainel('sessao-inexistente')

      expect(estado).toBeNull()
    })

    it('deve retornar estado do painel para sessao valida', async () => {
      const mockSessao = {
        id: 'sessao-1',
        numero: 1,
        tipo: 'ORDINARIA',
        status: 'EM_ANDAMENTO',
        data: new Date(),
        horario: '09:00',
        local: 'Plenario',
        presencas: [],
        pautaSessao: { itens: [] },
        proposicoes: [],
        legislatura: {
          mandatos: []
        }
      };

      (mockPrisma.sessao.findUnique as any).mockResolvedValue(mockSessao)

      const estado = await getEstadoPainel('sessao-1')

      expect(estado).not.toBeNull()
      expect(estado?.sessao?.id).toBe('sessao-1')
      expect(estado?.sessao?.numero).toBe(1)
      expect(estado?.sessao?.tipo).toBe('ORDINARIA')
    })
  })

  describe('iniciarSessao', () => {
    it('deve atualizar status da sessao para EM_ANDAMENTO', async () => {
      const mockSessao = {
        id: 'sessao-1',
        numero: 1,
        tipo: 'ORDINARIA',
        status: 'EM_ANDAMENTO',
        data: new Date(),
        horario: '09:00',
        local: 'Plenario',
        presencas: [],
        pautaSessao: { itens: [] },
        proposicoes: [],
        legislatura: { mandatos: [] }
      };

      (mockPrisma.sessao.update as any).mockResolvedValue(mockSessao);
      (mockPrisma.sessao.findUnique as any).mockResolvedValue(mockSessao)

      const estado = await iniciarSessao('sessao-1')

      expect(mockPrisma.sessao.update).toHaveBeenCalledWith({
        where: { id: 'sessao-1' },
        data: { status: 'EM_ANDAMENTO' }
      })
      expect(estado).not.toBeNull()
    })
  })

  describe('finalizarSessao', () => {
    it('deve atualizar status da sessao para CONCLUIDA', async () => {
      (mockPrisma.sessao.update as any).mockResolvedValue({ id: 'sessao-1', status: 'CONCLUIDA' })

      await finalizarSessao('sessao-1')

      expect(mockPrisma.sessao.update).toHaveBeenCalledWith({
        where: { id: 'sessao-1' },
        data: { status: 'CONCLUIDA' }
      })
    })
  })

  describe('registrarPresenca', () => {
    it('deve retornar false para sessao sem estado carregado', async () => {
      const sucesso = await registrarPresenca('sessao-inexistente', 'p1', true)
      expect(sucesso).toBe(false)
    })
  })

  describe('limparTodosEstados', () => {
    it('deve limpar todos os estados em memoria sem erro', () => {
      expect(() => limparTodosEstados()).not.toThrow()
    })
  })
})
