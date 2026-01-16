import { NotFoundError, ValidationError } from '@/lib/error-handler'
import {
  assertSessaoPermitePresenca,
  assertSessaoPermiteVotacao,
  ensureParlamentarPresente,
  obterSessaoParaControle,
  iniciarSessaoControle,
  finalizarSessaoControle,
  iniciarItemPauta,
  pausarItemPauta,
  finalizarItemPauta
} from '@/lib/services/sessao-controle'

jest.mock('@/lib/prisma', () => {
  const sessao = {
    findUnique: jest.fn(),
    update: jest.fn()
  }
  const presencaSessao = {
    findUnique: jest.fn()
  }
  const pautaSessao = {
    findUnique: jest.fn(),
    update: jest.fn()
  }
  const pautaItem = {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  }

  return {
    prisma: {
      sessao,
      presencaSessao,
      pautaSessao,
      pautaItem,
      $transaction: jest.fn(async (operations: any) => {
        if (Array.isArray(operations)) {
          return Promise.all(operations)
        }
        if (typeof operations === 'function') {
          return operations()
        }
        return operations
      })
    }
  }
})

const { prisma } = jest.requireMock('@/lib/prisma') as {
  prisma: {
    sessao: { findUnique: jest.Mock; update: jest.Mock }
    presencaSessao: { findUnique: jest.Mock }
    pautaSessao: { findUnique: jest.Mock; update: jest.Mock }
    pautaItem: { findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock }
    $transaction: jest.Mock
  }
}

describe('sessao-controle service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('obterSessaoParaControle', () => {
    it('retorna sessão quando existe', async () => {
      prisma.sessao.findUnique.mockResolvedValue({ id: 'sessao-1', status: 'AGENDADA' })

      const result = await obterSessaoParaControle('sessao-1')

      expect(result).toEqual({ id: 'sessao-1', status: 'AGENDADA' })
      expect(prisma.sessao.findUnique).toHaveBeenCalledWith({ where: { id: 'sessao-1' } })
    })

    it('lança NotFoundError quando sessão não existe', async () => {
      prisma.sessao.findUnique.mockResolvedValue(null)

      await expect(obterSessaoParaControle('sessao-invalida')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('assertSessaoPermitePresenca', () => {
    it('permite quando sessão não está finalizada', () => {
      expect(() => assertSessaoPermitePresenca({ status: 'EM_ANDAMENTO' })).not.toThrow()
      expect(() => assertSessaoPermitePresenca({ status: 'AGENDADA' })).not.toThrow()
    })

    it('bloqueia quando sessão finalizada/cancelada', () => {
      expect(() => assertSessaoPermitePresenca({ status: 'CONCLUIDA' })).toThrow(ValidationError)
      expect(() => assertSessaoPermitePresenca({ status: 'CANCELADA' })).toThrow(ValidationError)
    })
  })

  describe('assertSessaoPermiteVotacao', () => {
    it('permite somente sessão em andamento', () => {
      expect(() => assertSessaoPermiteVotacao({ status: 'EM_ANDAMENTO' })).not.toThrow()
      expect(() => assertSessaoPermiteVotacao({ status: 'AGENDADA' })).toThrow(ValidationError)
    })
  })

  describe('ensureParlamentarPresente', () => {
    it('retorna presença quando parlamentar está presente', async () => {
      const presencaMock = { id: 'presenca-1', presente: true }
      prisma.presencaSessao.findUnique.mockResolvedValue(presencaMock)

      const result = await ensureParlamentarPresente('sessao-1', 'parlamentar-1')

      expect(result).toBe(presencaMock)
      expect(prisma.presencaSessao.findUnique).toHaveBeenCalledWith({
        where: {
          sessaoId_parlamentarId: {
            sessaoId: 'sessao-1',
            parlamentarId: 'parlamentar-1'
          }
        }
      })
    })

    it('lança erro quando parlamentar não está presente', async () => {
      prisma.presencaSessao.findUnique.mockResolvedValue({ id: 'presenca-1', presente: false })

      await expect(ensureParlamentarPresente('sessao-1', 'parlamentar-1')).rejects.toBeInstanceOf(ValidationError)
    })

    it('lança erro quando presença não existe', async () => {
      prisma.presencaSessao.findUnique.mockResolvedValue(null)

      await expect(ensureParlamentarPresente('sessao-1', 'parlamentar-1')).rejects.toBeInstanceOf(ValidationError)
    })
  })

  describe('controle de sessão', () => {
    it('inicia sessão agendada e define item atual', async () => {
      const inicio = new Date('2025-01-01T12:00:00Z')
      jest.useFakeTimers().setSystemTime(inicio)

      prisma.sessao.findUnique.mockResolvedValueOnce({ id: 'sessao-1', status: 'AGENDADA', data: null })
      prisma.pautaSessao.findUnique.mockResolvedValueOnce({
        id: 'pauta-1',
        sessaoId: 'sessao-1',
        itens: [
          { id: 'item-1', status: 'PENDENTE' },
          { id: 'item-2', status: 'PENDENTE' }
        ]
      })
      prisma.sessao.update.mockResolvedValue({ id: 'sessao-1', status: 'EM_ANDAMENTO' })
      prisma.pautaSessao.update.mockResolvedValue({ id: 'pauta-1', itemAtualId: 'item-1' })
      prisma.sessao.findUnique.mockResolvedValueOnce({ id: 'sessao-1', status: 'EM_ANDAMENTO' })

      const resultado = await iniciarSessaoControle('sessao-1')

      expect(prisma.sessao.update).toHaveBeenCalledWith({
        where: { id: 'sessao-1' },
        data: {
          status: 'EM_ANDAMENTO',
          tempoInicio: inicio,
          data: inicio
        }
      })
      expect(prisma.pautaSessao.update).toHaveBeenCalledWith({
        where: { id: 'pauta-1' },
        data: { itemAtualId: 'item-1' }
      })
      expect(resultado).toEqual({ id: 'sessao-1', status: 'EM_ANDAMENTO' })
    })

    it('finaliza sessão em andamento', async () => {
      prisma.sessao.findUnique
        .mockResolvedValueOnce({ id: 'sessao-1', status: 'EM_ANDAMENTO', finalizada: false })
        .mockResolvedValueOnce({ id: 'sessao-1', status: 'CONCLUIDA' })
      prisma.pautaSessao.findUnique.mockResolvedValueOnce({ id: 'pauta-1', sessaoId: 'sessao-1' })
      prisma.sessao.update.mockResolvedValue({ id: 'sessao-1', status: 'CONCLUIDA' })
      prisma.pautaSessao.update.mockResolvedValue({ id: 'pauta-1', itemAtualId: null })

      const resultado = await finalizarSessaoControle('sessao-1')

      expect(prisma.sessao.update).toHaveBeenCalledWith({
        where: { id: 'sessao-1' },
        data: { status: 'CONCLUIDA', finalizada: true }
      })
      expect(prisma.pautaSessao.update).toHaveBeenCalledWith({
        where: { id: 'pauta-1' },
        data: { itemAtualId: null }
      })
      expect(resultado).toEqual({ id: 'sessao-1', status: 'CONCLUIDA' })
    })
  })

  describe('controle de pauta', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-01-01T12:00:00Z'))
    })

    it('inicia item definindo status e item atual', async () => {
      prisma.sessao.findUnique.mockResolvedValue({ id: 'sessao-1', status: 'EM_ANDAMENTO' })
      prisma.pautaItem.findUnique.mockResolvedValue({
        id: 'item-1',
        pautaId: 'pauta-1',
        status: 'PENDENTE',
        tempoAcumulado: 0,
        pauta: { sessaoId: 'sessao-1' }
      })
      prisma.pautaItem.update.mockResolvedValue({ id: 'item-1' })
      prisma.pautaSessao.update.mockResolvedValue({ id: 'pauta-1', itemAtualId: 'item-1' })

      await iniciarItemPauta('sessao-1', 'item-1')

      expect(prisma.pautaItem.update).toHaveBeenCalled()
      expect(prisma.pautaSessao.update).toHaveBeenCalledWith({
        where: { id: 'pauta-1' },
        data: { itemAtualId: 'item-1' }
      })
    })

    it('pausa item acumulando tempo', async () => {
      const inicio = new Date('2025-01-01T12:00:00Z')
      jest.useFakeTimers().setSystemTime(new Date('2025-01-01T12:05:00Z'))

      prisma.pautaItem.findUnique.mockResolvedValue({
        id: 'item-1',
        pautaId: 'pauta-1',
        iniciadoEm: inicio,
        tempoAcumulado: 30,
        pauta: { sessaoId: 'sessao-1' }
      })
      prisma.pautaItem.update.mockResolvedValue({ id: 'item-1' })
      prisma.pautaItem.findMany.mockResolvedValue([{ tempoReal: 0, tempoAcumulado: 330 }])
      prisma.pautaSessao.update.mockResolvedValue({ id: 'pauta-1', tempoTotalReal: 330 })

      await pausarItemPauta('sessao-1', 'item-1')

      expect(prisma.pautaItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          tempoAcumulado: 330,
          iniciadoEm: null
        }
      })
    })

    it('finaliza item registrando tempo real', async () => {
      const inicio = new Date('2025-01-01T12:00:00Z')
      jest.useFakeTimers().setSystemTime(new Date('2025-01-01T12:15:00Z'))

      prisma.pautaItem.findUnique.mockResolvedValue({
        id: 'item-1',
        pautaId: 'pauta-1',
        iniciadoEm: inicio,
        tempoAcumulado: 0,
        status: 'EM_DISCUSSAO',
        pauta: { sessaoId: 'sessao-1' }
      })
      prisma.pautaItem.update.mockResolvedValue({ id: 'item-1', tempoReal: 900 })
      prisma.pautaItem.findMany.mockResolvedValue([{ tempoReal: 900 }])
      prisma.pautaSessao.update.mockResolvedValue({ id: 'pauta-1', itemAtualId: null, tempoTotalReal: 900 })

      await finalizarItemPauta('sessao-1', 'item-1', 'CONCLUIDO')

      expect(prisma.pautaItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          status: 'CONCLUIDO',
          tempoAcumulado: 900,
          tempoReal: 900,
          iniciadoEm: null,
          finalizadoEm: expect.any(Date)
        }
      })
      expect(prisma.pautaSessao.update).toHaveBeenCalledWith({
        where: { id: 'pauta-1' },
        data: { itemAtualId: null }
      })
    })
  })
})
