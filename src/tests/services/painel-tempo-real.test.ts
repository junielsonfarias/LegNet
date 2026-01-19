/**
 * Testes do Servico de Painel em Tempo Real
 */

// Mock do Prisma - deve vir ANTES do import
jest.mock('@/lib/prisma', () => ({
  prisma: {
    sessao: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    presencaSessao: {
      upsert: jest.fn()
    },
    votacao: {
      upsert: jest.fn()
    },
    proposicao: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    pautaItem: {
      update: jest.fn()
    }
  }
}))

// Mock do logger
jest.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Painel Tempo Real Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    limparTodosEstados()
  })

  describe('getEstadoPainel', () => {
    it('deve retornar null para sessao inexistente', async () => {
      (mockPrisma.sessao.findUnique as jest.Mock).mockResolvedValue(null)

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

      (mockPrisma.sessao.findUnique as jest.Mock).mockResolvedValue(mockSessao)

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

      (mockPrisma.sessao.update as jest.Mock).mockResolvedValue(mockSessao);
      (mockPrisma.sessao.findUnique as jest.Mock).mockResolvedValue(mockSessao)

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
      (mockPrisma.sessao.update as jest.Mock).mockResolvedValue({ id: 'sessao-1', status: 'CONCLUIDA' })

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
