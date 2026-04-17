import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    proposicao: {
      findMany: vi.fn(),
      updateMany: vi.fn()
    },
    parecer: {
      findMany: vi.fn().mockResolvedValue([])
    },
    notificacaoMulticanal: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn()
    },
    user: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

import { prisma as _prisma } from '@/lib/prisma'
import { processarSancaoTacita, gerarNotificacoesPrazo } from '@/lib/jobs/prazos-legais'

const prisma = _prisma as any

describe('processarSancaoTacita (RN-081)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aplica sanção tácita em proposição APROVADA após 15 dias úteis', async () => {
    const haMuitoTempo = new Date()
    haMuitoTempo.setDate(haMuitoTempo.getDate() - 40) // garante 15+ dias úteis

    prisma.proposicao.findMany.mockResolvedValue([
      { id: 'p1', numero: '001', ano: 2026, tipo: 'PROJETO_LEI', updatedAt: haMuitoTempo, dataVotacao: haMuitoTempo }
    ])
    prisma.proposicao.updateMany.mockResolvedValue({ count: 1 })

    const result = await processarSancaoTacita()

    expect(result.total).toBe(1)
    expect(result.sancionadas).toEqual(['PROJETO_LEI 001/2026'])
    expect(prisma.proposicao.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['p1'] } },
      data: { status: 'SANCIONADA' }
    })
  })

  it('NÃO sanciona proposição recente (menos de 15 dias úteis)', async () => {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)

    prisma.proposicao.findMany.mockResolvedValue([
      { id: 'p1', numero: '001', ano: 2026, tipo: 'PROJETO_LEI', updatedAt: ontem, dataVotacao: ontem }
    ])

    const result = await processarSancaoTacita()

    expect(result.total).toBe(0)
    expect(prisma.proposicao.updateMany).not.toHaveBeenCalled()
  })

  it('retorna zero quando não há proposições APROVADAS', async () => {
    prisma.proposicao.findMany.mockResolvedValue([])

    const result = await processarSancaoTacita()

    expect(result.total).toBe(0)
    expect(result.sancionadas).toEqual([])
  })
})

describe('gerarNotificacoesPrazo (RN-084)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.notificacaoMulticanal.findMany.mockResolvedValue([])
    prisma.user.findMany.mockResolvedValue([])
    prisma.parecer.findMany.mockResolvedValue([])
  })

  it('gera notificações para vetos com prazo <= 7 dias', async () => {
    const haVinte5Dias = new Date()
    haVinte5Dias.setDate(haVinte5Dias.getDate() - 25) // restam 5 dias dos 30

    prisma.proposicao.findMany.mockResolvedValue([
      { id: 'v1', numero: '010', ano: 2026, tipo: 'PROJETO_LEI', updatedAt: haVinte5Dias }
    ])
    prisma.user.findMany.mockResolvedValue([
      { id: 'admin1', email: 'admin@camara.gov.br' }
    ])
    prisma.notificacaoMulticanal.createMany.mockResolvedValue({ count: 1 })

    const result = await gerarNotificacoesPrazo()

    expect(result.notificacoesCriadas).toBeGreaterThan(0)
    expect(prisma.notificacaoMulticanal.createMany).toHaveBeenCalled()
  })

  it('NÃO gera notificação duplicada para mesma entidade nas últimas 24h', async () => {
    const haVinte5Dias = new Date()
    haVinte5Dias.setDate(haVinte5Dias.getDate() - 25)

    prisma.proposicao.findMany.mockResolvedValue([
      { id: 'v1', numero: '010', ano: 2026, tipo: 'PROJETO_LEI', updatedAt: haVinte5Dias }
    ])
    prisma.notificacaoMulticanal.findMany.mockResolvedValue([
      { metadata: { entidadeId: 'v1', entidadeTipo: 'PROPOSICAO' } }
    ])
    prisma.user.findMany.mockResolvedValue([
      { id: 'admin1', email: 'admin@camara.gov.br' }
    ])

    const result = await gerarNotificacoesPrazo()

    expect(result.notificacoesCriadas).toBe(0)
    expect(prisma.notificacaoMulticanal.createMany).not.toHaveBeenCalled()
  })

  it('NÃO gera notificação para veto com prazo > 7 dias', async () => {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1) // restam 29 dias dos 30

    prisma.proposicao.findMany.mockResolvedValue([
      { id: 'v1', numero: '010', ano: 2026, tipo: 'PROJETO_LEI', updatedAt: ontem }
    ])

    const result = await gerarNotificacoesPrazo()

    expect(result.notificacoesCriadas).toBe(0)
  })
})
