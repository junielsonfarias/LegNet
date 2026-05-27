import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma — sem banco real
vi.mock('@/lib/prisma', () => ({
  prisma: {
    manifestacaoOuvidoria: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
  },
}))

// Mock CPF utils — preserva chamadas
vi.mock('@/lib/security/cpf-utils', () => ({
  encryptCpf: vi.fn((cpf: string) => `enc:${cpf}`),
  hashCpf: vi.fn((cpf: string) => `hash:${cpf}`),
  normalizeCpf: vi.fn((cpf: string) => cpf?.replace(/\D/g, '')),
  isValidCpfFormat: vi.fn(() => true),
  maskCpf: vi.fn((cpf: string) => `***.${cpf?.slice(-6)}`),
  maskEncryptedCpf: vi.fn((cpf: string | null | undefined) => (cpf ? `MASKED(${cpf})` : '')),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

import { prisma as _prisma } from '@/lib/prisma'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'
import { encryptCpf, hashCpf, isValidCpfFormat } from '@/lib/security/cpf-utils'

const prisma = _prisma as any

describe('ouvidoriaService.gerarProtocolo (RN-167)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(true)
  })

  it('gera primeiro protocolo do ano (OUV-2026-00001)', async () => {
    prisma.manifestacaoOuvidoria.findFirst.mockResolvedValue(null)

    const r = await ouvidoriaService.gerarProtocolo(2026)

    expect(r.protocolo).toBe('OUV-2026-00001')
    expect(r.numero).toBe(1)
  })

  it('incrementa numero baseado no ultimo registro do ano', async () => {
    prisma.manifestacaoOuvidoria.findFirst.mockResolvedValue({ numero: 100 })

    const r = await ouvidoriaService.gerarProtocolo(2026)

    expect(r.numero).toBe(101)
    expect(r.protocolo).toBe('OUV-2026-00101')
  })
})

describe('ouvidoriaService.calcularPrazoResposta (Lei 13.460/2017)', () => {
  it('ELOGIO: prazo de 15 dias corridos', () => {
    const before = new Date()
    const prazo = ouvidoriaService.calcularPrazoResposta('ELOGIO' as never)
    const dias = Math.round((prazo.getTime() - before.getTime()) / (1000 * 60 * 60 * 24))
    expect(dias).toBe(15)
  })

  it('RECLAMACAO: prazo de 30 dias corridos', () => {
    const before = new Date()
    const prazo = ouvidoriaService.calcularPrazoResposta('RECLAMACAO' as never)
    const dias = Math.round((prazo.getTime() - before.getTime()) / (1000 * 60 * 60 * 24))
    expect(dias).toBe(30)
  })

  it('DENUNCIA: prazo de 30 dias corridos', () => {
    const before = new Date()
    const prazo = ouvidoriaService.calcularPrazoResposta('DENUNCIA' as never)
    const dias = Math.round((prazo.getTime() - before.getTime()) / (1000 * 60 * 60 * 24))
    expect(dias).toBe(30)
  })
})

describe('ouvidoriaService.create (RN-166 LGPD + Lei 13.460)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(true)
    prisma.manifestacaoOuvidoria.findFirst.mockResolvedValue(null)
    prisma.manifestacaoOuvidoria.create.mockResolvedValue({
      id: 'm1',
      protocolo: 'OUV-2026-00001',
      ano: 2026,
      numero: 1,
      tipo: 'RECLAMACAO',
    })
  })

  it('nao-anonimo: persiste nome, email, telefone e protocolo unico', async () => {
    await ouvidoriaService.create({
      nome: 'Joao Silva',
      email: 'joao@example.com',
      telefone: '91999999999',
      tipo: 'RECLAMACAO' as never,
      assunto: 'Reclamacao X',
      descricao: 'Detalhes',
    })

    expect(prisma.manifestacaoOuvidoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          protocolo: expect.stringMatching(/^OUV-\d{4}-\d{5}$/),
          anonimo: false,
          nome: 'Joao Silva',
          email: 'joao@example.com',
          telefone: '91999999999',
          tipo: 'RECLAMACAO',
          assunto: 'Reclamacao X',
          descricao: 'Detalhes',
          prioridade: 'NORMAL',
          prazoResposta: expect.any(Date),
          historico: expect.objectContaining({
            create: expect.objectContaining({ acao: 'REGISTRO' }),
          }),
        }),
      })
    )
  })

  it('anonimo: NAO persiste CPF (cpf/cpfHash = null) e nao chama encryptCpf', async () => {
    await ouvidoriaService.create({
      anonimo: true,
      tipo: 'DENUNCIA' as never,
      assunto: 'Denuncia anonima',
      descricao: 'Suspeita de irregularidade',
      // sem nome/email/cpf
    })

    expect(encryptCpf).not.toHaveBeenCalled()
    expect(hashCpf).not.toHaveBeenCalled()
    expect(prisma.manifestacaoOuvidoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          anonimo: true,
          nome: null,
          email: null,
          telefone: null,
          cpf: null,
          cpfHash: null,
        }),
      })
    )
  })

  it('com CPF (nao-anonimo): chama encryptCpf E hashCpf — RN-166', async () => {
    await ouvidoriaService.create({
      anonimo: false,
      nome: 'Maria',
      email: 'maria@example.com',
      cpf: '12345678909',
      tipo: 'RECLAMACAO' as never,
      assunto: 'X',
      descricao: 'Y',
    })

    expect(encryptCpf).toHaveBeenCalledWith('12345678909')
    expect(hashCpf).toHaveBeenCalledWith('12345678909')
    expect(prisma.manifestacaoOuvidoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: 'enc:12345678909',
          cpfHash: 'hash:12345678909',
        }),
      })
    )
  })

  it('com CPF invalido: nao criptografa, salva null', async () => {
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(false)

    await ouvidoriaService.create({
      nome: 'Joao',
      email: 'j@e.com',
      cpf: 'invalido',
      tipo: 'ELOGIO' as never,
      assunto: 'X',
      descricao: 'Y',
    })

    expect(encryptCpf).not.toHaveBeenCalled()
    expect(hashCpf).not.toHaveBeenCalled()
    expect(prisma.manifestacaoOuvidoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cpf: null, cpfHash: null }),
      })
    )
  })

  it('prioridade customizada e respeitada (default NORMAL)', async () => {
    await ouvidoriaService.create({
      tipo: 'DENUNCIA' as never,
      assunto: 'X',
      descricao: 'Y',
      prioridade: 'ALTA',
    })

    expect(prisma.manifestacaoOuvidoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ prioridade: 'ALTA' }),
      })
    )
  })
})

describe('ouvidoriaService.list / paginate (filtros)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.manifestacaoOuvidoria.findMany.mockResolvedValue([])
    prisma.manifestacaoOuvidoria.count.mockResolvedValue(0)
  })

  it('list aplica filtro de tipo + status + prioridade', async () => {
    await ouvidoriaService.list({
      tipo: 'RECLAMACAO' as never,
      status: 'ABERTA' as never,
      prioridade: 'ALTA',
    })

    expect(prisma.manifestacaoOuvidoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tipo: 'RECLAMACAO',
          status: 'ABERTA',
          prioridade: 'ALTA',
        }),
      })
    )
  })

  it('list aplica busca textual em multiplos campos', async () => {
    await ouvidoriaService.list({ search: 'iluminacao' })

    expect(prisma.manifestacaoOuvidoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ protocolo: { contains: 'iluminacao', mode: 'insensitive' } }),
            expect.objectContaining({ assunto: { contains: 'iluminacao', mode: 'insensitive' } }),
          ]),
        }),
      })
    )
  })

  it('paginate retorna data + pagination correta', async () => {
    prisma.manifestacaoOuvidoria.count.mockResolvedValue(15)
    prisma.manifestacaoOuvidoria.findMany.mockResolvedValue([{ id: 'm1' }])

    const r = await ouvidoriaService.paginate({}, { page: 1, limit: 10 })

    expect(r.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 15,
      totalPages: 2,
      hasNext: true,
      hasPrev: false,
    })
  })
})

describe('ouvidoriaService.getByProtocolo (RN-166 + anonimato)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna manifestacao SEM cpf nem cpfHash quando nao-anonimo', async () => {
    prisma.manifestacaoOuvidoria.findUnique.mockResolvedValue({
      id: 'm1',
      protocolo: 'OUV-2026-00001',
      anonimo: false,
      nome: 'Joao',
      email: 'j@e.com',
      cpf: 'enc:12345678909',
      cpfHash: 'hash:12345678909',
    })

    const r = await ouvidoriaService.getByProtocolo('OUV-2026-00001') as Record<string, unknown> | null

    expect(r).toBeTruthy()
    expect(r).not.toHaveProperty('cpf')
    expect(r).not.toHaveProperty('cpfHash')
    expect(r).toMatchObject({ id: 'm1', nome: 'Joao', email: 'j@e.com' })
  })

  it('quando anonimo: nao expoe nome/email/telefone na consulta publica', async () => {
    prisma.manifestacaoOuvidoria.findUnique.mockResolvedValue({
      id: 'm2',
      protocolo: 'OUV-2026-00002',
      anonimo: true,
      nome: 'Nome Vazado',
      email: 'vazado@e.com',
      telefone: '99999',
      cpf: null,
      cpfHash: null,
    })

    const r = await ouvidoriaService.getByProtocolo('OUV-2026-00002') as Record<string, unknown> | null

    expect(r).toBeTruthy()
    expect(r).toMatchObject({
      id: 'm2',
      anonimo: true,
      nome: null,
      email: null,
      telefone: null,
    })
  })

  it('retorna null quando protocolo nao existe', async () => {
    prisma.manifestacaoOuvidoria.findUnique.mockResolvedValue(null)

    const r = await ouvidoriaService.getByProtocolo('OUV-9999-99999')

    expect(r).toBeNull()
  })
})

describe('ouvidoriaService.responder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.manifestacaoOuvidoria.update.mockResolvedValue({ id: 'm1', status: 'RESPONDIDA' })
  })

  it('muda status para RESPONDIDA + grava resposta + dataResposta', async () => {
    await ouvidoriaService.responder('m1', 'Resposta final', 'admin')

    expect(prisma.manifestacaoOuvidoria.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: expect.objectContaining({
          status: 'RESPONDIDA',
          resposta: 'Resposta final',
          respondidoPor: 'admin',
          dataResposta: expect.any(Date),
          historico: expect.objectContaining({
            create: expect.objectContaining({
              acao: 'RESPOSTA',
              usuarioNome: 'admin',
            }),
          }),
        }),
      })
    )
  })
})

describe('ouvidoriaService.encaminhar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.manifestacaoOuvidoria.update.mockResolvedValue({ id: 'm1', status: 'ENCAMINHADA' })
  })

  it('muda status para ENCAMINHADA e grava setor', async () => {
    await ouvidoriaService.encaminhar('m1', 'JURIDICO', 'admin')

    expect(prisma.manifestacaoOuvidoria.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: expect.objectContaining({
          status: 'ENCAMINHADA',
          setor: 'JURIDICO',
          historico: expect.objectContaining({
            create: expect.objectContaining({
              acao: 'ENCAMINHAMENTO',
              usuarioNome: 'admin',
            }),
          }),
        }),
      })
    )
  })
})

describe('ouvidoriaService.concluir', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.manifestacaoOuvidoria.update.mockResolvedValue({ id: 'm1', status: 'CONCLUIDA' })
  })

  it('muda status para CONCLUIDA', async () => {
    await ouvidoriaService.concluir('m1', 'admin')

    expect(prisma.manifestacaoOuvidoria.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: expect.objectContaining({
          status: 'CONCLUIDA',
          historico: expect.objectContaining({
            create: expect.objectContaining({
              acao: 'CONCLUSAO',
              usuarioNome: 'admin',
            }),
          }),
        }),
      })
    )
  })
})

describe('ouvidoriaService.avaliarSatisfacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.manifestacaoOuvidoria.update.mockResolvedValue({ id: 'm1', satisfacao: 5 })
  })

  it('atualiza nota de satisfacao via protocolo', async () => {
    await ouvidoriaService.avaliarSatisfacao('OUV-2026-00001', 5)

    expect(prisma.manifestacaoOuvidoria.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { protocolo: 'OUV-2026-00001' },
        data: expect.objectContaining({ satisfacao: 5 }),
      })
    )
  })
})

describe('ouvidoriaService.listByCpfHash (RN-166 — cidadao consulta protocolos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(true)
  })

  it('busca por cpfHash, retorna campos minimos sem CPF', async () => {
    prisma.manifestacaoOuvidoria.findMany.mockResolvedValue([
      { id: 'm1', protocolo: 'OUV-2026-00001', tipo: 'RECLAMACAO' },
    ])

    const r = await ouvidoriaService.listByCpfHash('12345678909')

    expect(hashCpf).toHaveBeenCalledWith('12345678909')
    expect(prisma.manifestacaoOuvidoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cpfHash: 'hash:12345678909' },
        select: expect.objectContaining({
          id: true,
          protocolo: true,
          tipo: true,
        }),
      })
    )
    expect(r).toHaveLength(1)
  })

  it('retorna [] se CPF invalido', async () => {
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(false)

    const r = await ouvidoriaService.listByCpfHash('xxx')

    expect(r).toEqual([])
    expect(prisma.manifestacaoOuvidoria.findMany).not.toHaveBeenCalled()
  })
})
