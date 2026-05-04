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
    },
    sessao: {
      findMany: vi.fn().mockResolvedValue([])
    },
    contrato: {
      findMany: vi.fn().mockResolvedValue([])
    },
    solicitacaoESIC: {
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
import {
  processarSancaoTacita,
  gerarNotificacoesPrazo,
  verificarPautasAtrasadas,
  verificarAtasAtrasadas,
  verificarContratosAtrasados,
  verificarPrazosESIC
} from '@/lib/jobs/prazos-legais'

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

describe('verificarPautasAtrasadas (RN-122 PNTP)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.notificacaoMulticanal.findMany.mockResolvedValue([])
    prisma.user.findMany.mockResolvedValue([{ id: 'a1', email: 'admin@camara.gov.br' }])
  })

  it('detecta sessao proxima sem pauta publicada e gera notificacao', async () => {
    const em24h = new Date(Date.now() + 24 * 60 * 60 * 1000)
    prisma.sessao.findMany.mockResolvedValue([
      {
        id: 's1',
        numero: 42,
        tipo: 'ORDINARIA',
        data: em24h,
        pautaSessao: { id: 'p1', status: 'RASCUNHO', dataPublicacao: null }
      }
    ])
    prisma.notificacaoMulticanal.createMany.mockResolvedValue({ count: 1 })

    const result = await verificarPautasAtrasadas()

    expect(result.pendentes).toBe(1)
    expect(result.notificacoesCriadas).toBe(1)
    expect(prisma.notificacaoMulticanal.createMany).toHaveBeenCalled()
  })

  it('ignora sessao com pauta ja publicada', async () => {
    const em24h = new Date(Date.now() + 24 * 60 * 60 * 1000)
    prisma.sessao.findMany.mockResolvedValue([
      {
        id: 's1',
        numero: 42,
        tipo: 'ORDINARIA',
        data: em24h,
        pautaSessao: { id: 'p1', status: 'APROVADA', dataPublicacao: new Date() }
      }
    ])

    const result = await verificarPautasAtrasadas()

    expect(result.pendentes).toBe(0)
    expect(result.notificacoesCriadas).toBe(0)
  })

  it('deduplica - nao notifica sessao ja avisada nas ultimas 24h', async () => {
    const em24h = new Date(Date.now() + 24 * 60 * 60 * 1000)
    prisma.sessao.findMany.mockResolvedValue([
      {
        id: 's1',
        numero: 42,
        tipo: 'ORDINARIA',
        data: em24h,
        pautaSessao: null
      }
    ])
    prisma.notificacaoMulticanal.findMany.mockResolvedValue([
      { metadata: { entidadeId: 's1', entidadeTipo: 'SESSAO_PAUTA' } }
    ])

    const result = await verificarPautasAtrasadas()

    expect(result.pendentes).toBe(1)
    expect(result.notificacoesCriadas).toBe(0)
  })
})

describe('verificarAtasAtrasadas (RN-123 PNTP)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.notificacaoMulticanal.findMany.mockResolvedValue([])
    prisma.user.findMany.mockResolvedValue([{ id: 'a1', email: 'admin@camara.gov.br' }])
  })

  it('detecta ata aprovada ha mais de 15 dias sem publicacao', async () => {
    const ha30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    prisma.sessao.findMany.mockResolvedValue([
      { id: 's1', numero: 10, tipo: 'ORDINARIA', data: ha30Dias, updatedAt: ha30Dias }
    ])
    prisma.notificacaoMulticanal.createMany.mockResolvedValue({ count: 1 })

    const result = await verificarAtasAtrasadas()

    expect(result.pendentes).toBe(1)
    expect(result.notificacoesCriadas).toBe(1)
  })

  it('retorna zero quando nao ha atas atrasadas', async () => {
    prisma.sessao.findMany.mockResolvedValue([])

    const result = await verificarAtasAtrasadas()

    expect(result.pendentes).toBe(0)
    expect(result.notificacoesCriadas).toBe(0)
    expect(prisma.notificacaoMulticanal.createMany).not.toHaveBeenCalled()
  })
})

describe('verificarContratosAtrasados (RN-124 PNTP)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.notificacaoMulticanal.findMany.mockResolvedValue([])
    prisma.user.findMany.mockResolvedValue([{ id: 'a1', email: 'admin@camara.gov.br' }])
  })

  it('detecta contrato assinado ha mais de 24h sem dataPublicacao', async () => {
    const ha48h = new Date(Date.now() - 48 * 60 * 60 * 1000)
    prisma.contrato.findMany.mockResolvedValue([
      { id: 'c1', numero: '001', ano: 2026, contratado: 'ACME LTDA', dataAssinatura: ha48h }
    ])
    prisma.notificacaoMulticanal.createMany.mockResolvedValue({ count: 1 })

    const result = await verificarContratosAtrasados()

    expect(result.pendentes).toBe(1)
    expect(result.notificacoesCriadas).toBe(1)
  })

  it('ignora quando nao ha contratos atrasados', async () => {
    prisma.contrato.findMany.mockResolvedValue([])

    const result = await verificarContratosAtrasados()

    expect(result.pendentes).toBe(0)
    expect(result.notificacoesCriadas).toBe(0)
  })
})

describe('verificarPrazosESIC (RN-140 LAI)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.notificacaoMulticanal.findMany.mockResolvedValue([])
    prisma.user.findMany.mockResolvedValue([{ id: 'a1', email: 'admin@camara.gov.br' }])
  })

  it('classifica e-SIC vencido separadamente dos proximos do vencimento', async () => {
    const agora = new Date()
    const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
    const em2Dias = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000)

    prisma.solicitacaoESIC.findMany.mockResolvedValue([
      {
        id: 'e1',
        protocolo: 'ESIC-2026-0001',
        assunto: 'pedido 1',
        prazoResposta: ontem,
        respondidoPor: null,
        status: 'ABERTO'
      },
      {
        id: 'e2',
        protocolo: 'ESIC-2026-0002',
        assunto: 'pedido 2',
        prazoResposta: em2Dias,
        respondidoPor: null,
        status: 'EM_ANALISE'
      }
    ])
    prisma.notificacaoMulticanal.createMany.mockResolvedValue({ count: 2 })

    const result = await verificarPrazosESIC()

    expect(result.vencidos).toBe(1)
    expect(result.proximosVencimento).toBe(1)
    expect(result.notificacoesCriadas).toBe(2)
  })

  it('retorna zero quando nao ha e-SIC proximo do prazo', async () => {
    prisma.solicitacaoESIC.findMany.mockResolvedValue([])

    const result = await verificarPrazosESIC()

    expect(result.proximosVencimento).toBe(0)
    expect(result.vencidos).toBe(0)
    expect(result.notificacoesCriadas).toBe(0)
  })
})
