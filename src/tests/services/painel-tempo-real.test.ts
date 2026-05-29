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
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({ id: 'm-1' })
    },
    parlamentar: {
      findMany: vi.fn().mockResolvedValue([])
    },
    $transaction: vi.fn(async (callback: any) => {
      if (typeof callback === 'function') {
        return callback({ votacao: { upsert: vi.fn().mockResolvedValue({}) } })
      }
      return Promise.all(callback as unknown[])
    })
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

// Mock do audit log (P0-2)
vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined)
}))

// Import apos mocks
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import {
  getEstadoPainel,
  iniciarSessao,
  iniciarVotacao,
  registrarVoto,
  finalizarSessao,
  registrarPresenca,
  limparTodosEstados
} from '@/lib/services/painel-tempo-real-service'

const mockPrisma = prisma as any
const mockLogAudit = logAudit as unknown as ReturnType<typeof vi.fn>

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

  // P0-2 / RN-003: voto individual auditado em AuditLog
  describe('registrarVoto (P0-2 audit log)', () => {
    const setupVotacaoAtiva = async () => {
      const parlamentar = { id: 'parl-1', nome: 'Vereador A', partido: 'PX', foto: null, ativo: true }
      const mockSessao = {
        id: 'sess-aud',
        numero: 1,
        tipo: 'ORDINARIA',
        status: 'EM_ANDAMENTO',
        data: new Date(),
        horario: '09:00',
        local: 'Plenario',
        legislaturaId: 'leg-1',
        presencas: [
          { parlamentarId: 'parl-1', presente: true, createdAt: new Date(), justificativa: null }
        ],
        pautaSessao: { itens: [] },
        proposicoes: [],
        legislatura: {
          mandatos: [{ parlamentarId: 'parl-1', ativo: true, parlamentar }]
        }
      }
      mockPrisma.sessao.findUnique.mockResolvedValue(mockSessao)
      mockPrisma.proposicao.findUnique.mockResolvedValue({
        id: 'prop-1',
        numero: '001',
        ano: 2026,
        tipo: 'PROJETO_LEI',
        ementa: 'Teste',
        autor: { id: 'a', nome: 'X' }
      })
      // Carrega estado e abre votacao
      await iniciarVotacao('sess-aud', 'prop-1', 60)
    }

    it('chama logAudit com action=VOTO_REGISTRADO quando auditContext fornecido', async () => {
      await setupVotacaoAtiva()

      const fakeRequest = new Request('http://localhost/api/painel/votacao', {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.0.0.1', 'user-agent': 'jest' }
      })
      const fakeSession = { user: { id: 'u1', name: 'Op', email: 'op@x', role: 'OPERADOR' } } as any

      const ok = await registrarVoto('sess-aud', 'parl-1', 'SIM', {
        request: fakeRequest,
        session: fakeSession
      })

      expect(ok).toBe(true)
      expect(mockLogAudit).toHaveBeenCalledTimes(1)
      const auditCall = mockLogAudit.mock.calls[0][0]
      expect(auditCall.action).toBe('VOTO_REGISTRADO')
      expect(auditCall.entity).toBe('Votacao')
      expect(auditCall.entityId).toBe('prop-1:parl-1:1')
      expect(auditCall.metadata).toMatchObject({
        proposicaoId: 'prop-1',
        parlamentarId: 'parl-1',
        voto: 'SIM',
        turno: 1,
        sessaoId: 'sess-aud'
      })
    })

    it('NAO chama logAudit quando auditContext omitido (compat)', async () => {
      await setupVotacaoAtiva()

      const ok = await registrarVoto('sess-aud', 'parl-1', 'NAO')

      expect(ok).toBe(true)
      expect(mockLogAudit).not.toHaveBeenCalled()
    })

    it('P0-4: rejeita voto se mandato inativo (sem chamar audit)', async () => {
      await setupVotacaoAtiva()
      mockPrisma.mandato.findFirst.mockResolvedValueOnce(null)

      const ok = await registrarVoto('sess-aud', 'parl-1', 'SIM', {
        request: new Request('http://x'),
        session: { user: { id: 'u' } } as any
      })

      expect(ok).toBe(false)
      expect(mockLogAudit).not.toHaveBeenCalled()
    })
  })
})
