import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma — sem banco real
vi.mock('@/lib/prisma', () => ({
  prisma: {
    solicitacaoESIC: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    recursoESIC: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}))

// Mock de utilidades de CPF — preserva chamadas para asserts
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
import { esicService } from '@/lib/services/esic-service'
import { encryptCpf, hashCpf, isValidCpfFormat } from '@/lib/security/cpf-utils'

const prisma = _prisma as any

describe('esicService.gerarProtocolo (LAI Art. 10 / RN-167)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-injeta retorno default
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(true)
  })

  it('gera primeiro protocolo do ano (00001) quando nao ha registros', async () => {
    prisma.solicitacaoESIC.findFirst.mockResolvedValue(null)

    const r = await esicService.gerarProtocolo(2026)

    expect(r.protocolo).toBe('ESIC-2026-00001')
    expect(r.numero).toBe(1)
    expect(prisma.solicitacaoESIC.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ano: 2026 },
        orderBy: { numero: 'desc' },
      })
    )
  })

  it('incrementa numero baseado no ultimo registro do ano', async () => {
    prisma.solicitacaoESIC.findFirst.mockResolvedValue({ numero: 42 })

    const r = await esicService.gerarProtocolo(2026)

    expect(r.numero).toBe(43)
    expect(r.protocolo).toBe('ESIC-2026-00043')
  })
})

describe('esicService.calcularPrazoResposta (LAI Art. 11 — 20 dias uteis)', () => {
  it('soma 20 dias uteis pulando sabado e domingo', () => {
    // Segunda-feira 2026-05-04 + 20 dias uteis = 2026-06-01 (segunda)
    const inicio = new Date('2026-05-04T12:00:00.000Z')
    const prazo = esicService.calcularPrazoResposta(inicio)

    // Verifica que retornou uma data util posterior
    expect(prazo.getTime()).toBeGreaterThan(inicio.getTime())
    expect(prazo.getDay()).not.toBe(0)
    expect(prazo.getDay()).not.toBe(6)

    // A diferenca em dias corridos deve ser >= 20 (porque pulou fins de semana)
    const diasCorridos = Math.floor((prazo.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    expect(diasCorridos).toBeGreaterThanOrEqual(20)
  })
})

describe('esicService.create (RN-166 LGPD + LAI)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(true)
    prisma.solicitacaoESIC.findFirst.mockResolvedValue(null)
    prisma.solicitacaoESIC.create.mockResolvedValue({
      id: 's1',
      protocolo: 'ESIC-2026-00001',
      ano: 2026,
      numero: 1,
      status: 'ABERTO',
    })
  })

  it('happy path: cria solicitacao com protocolo unico e prazo de 20 dias uteis', async () => {
    const result = await esicService.create({
      nome: 'Joao Silva',
      email: 'joao@example.com',
      assunto: 'Solicito relatorio X',
      descricao: 'Detalhes da solicitacao',
    })

    expect(prisma.solicitacaoESIC.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          protocolo: expect.stringMatching(/^ESIC-\d{4}-\d{5}$/),
          status: 'ABERTO',
          nome: 'Joao Silva',
          email: 'joao@example.com',
          assunto: 'Solicito relatorio X',
          descricao: 'Detalhes da solicitacao',
          prazoResposta: expect.any(Date),
          historico: expect.objectContaining({
            create: expect.objectContaining({ acao: 'CRIACAO' }),
          }),
        }),
      })
    )
    expect(result).toMatchObject({ id: 's1', status: 'ABERTO' })
  })

  it('sem CPF: ainda permite criacao (LAI Art. 10 nao obriga identificar com CPF)', async () => {
    await esicService.create({
      nome: 'Maria Anonima',
      email: 'maria@example.com',
      assunto: 'Pergunta sobre orcamento',
      descricao: 'Quero saber...',
    })

    expect(encryptCpf).not.toHaveBeenCalled()
    expect(hashCpf).not.toHaveBeenCalled()
    expect(prisma.solicitacaoESIC.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: null,
          cpfHash: null,
        }),
      })
    )
  })

  it('com CPF: chama encryptCpf E hashCpf (RN-166)', async () => {
    await esicService.create({
      nome: 'Joao Silva',
      email: 'joao@example.com',
      cpf: '12345678909',
      assunto: 'Solicito relatorio X',
      descricao: 'Detalhes',
    })

    expect(encryptCpf).toHaveBeenCalledWith('12345678909')
    expect(hashCpf).toHaveBeenCalledWith('12345678909')
    expect(prisma.solicitacaoESIC.create).toHaveBeenCalledWith(
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

    await esicService.create({
      nome: 'Joao Silva',
      email: 'joao@example.com',
      cpf: 'cpf-invalido',
      assunto: 'X',
      descricao: 'Y',
    })

    expect(encryptCpf).not.toHaveBeenCalled()
    expect(hashCpf).not.toHaveBeenCalled()
    expect(prisma.solicitacaoESIC.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cpf: null, cpfHash: null }),
      })
    )
  })
})

describe('esicService.list / paginate (filtros)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.solicitacaoESIC.findMany.mockResolvedValue([])
    prisma.solicitacaoESIC.count.mockResolvedValue(0)
  })

  it('list aplica filtro de status', async () => {
    await esicService.list({ status: 'RESPONDIDO' })

    expect(prisma.solicitacaoESIC.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'RESPONDIDO' }),
      })
    )
  })

  it('list aplica filtro de ano', async () => {
    await esicService.list({ ano: 2026 })

    expect(prisma.solicitacaoESIC.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ano: 2026 }),
      })
    )
  })

  it('list aplica filtro de busca textual em multiplos campos', async () => {
    await esicService.list({ search: 'relatorio' })

    expect(prisma.solicitacaoESIC.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ protocolo: { contains: 'relatorio', mode: 'insensitive' } }),
            expect.objectContaining({ assunto: { contains: 'relatorio', mode: 'insensitive' } }),
          ]),
        }),
      })
    )
  })

  it('paginate retorna estrutura com data + pagination', async () => {
    prisma.solicitacaoESIC.count.mockResolvedValue(25)
    prisma.solicitacaoESIC.findMany.mockResolvedValue([{ id: 's1' }, { id: 's2' }])

    const r = await esicService.paginate({}, { page: 2, limit: 10 })

    expect(r.data).toHaveLength(2)
    expect(r.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
    expect(prisma.solicitacaoESIC.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
  })

  it('paginate clampa limit > 100 para 100', async () => {
    await esicService.paginate({}, { page: 1, limit: 9999 })

    expect(prisma.solicitacaoESIC.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })
})

describe('esicService.getByProtocolo (RN-166 - nao expoe CPF)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna manifestacao SEM cpf nem cpfHash quando encontrada', async () => {
    prisma.solicitacaoESIC.findUnique.mockResolvedValue({
      id: 's1',
      protocolo: 'ESIC-2026-00001',
      nome: 'Joao',
      cpf: 'enc:12345678909',
      cpfHash: 'hash:12345678909',
      assunto: 'X',
    })

    const r = await esicService.getByProtocolo('ESIC-2026-00001')

    expect(r).toBeTruthy()
    expect(r as Record<string, unknown>).not.toHaveProperty('cpf')
    expect(r as Record<string, unknown>).not.toHaveProperty('cpfHash')
    expect(r).toMatchObject({ id: 's1', nome: 'Joao' })
  })

  it('retorna null quando protocolo nao encontrado', async () => {
    prisma.solicitacaoESIC.findUnique.mockResolvedValue(null)

    const r = await esicService.getByProtocolo('ESIC-9999-99999')

    expect(r).toBeNull()
  })
})

describe('esicService.responder (LAI Art. 11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.solicitacaoESIC.update.mockResolvedValue({ id: 's1', status: 'RESPONDIDO' })
  })

  it('muda status para RESPONDIDO, grava resposta e dataResposta', async () => {
    await esicService.responder('s1', 'Aqui esta o relatorio solicitado', 'admin-user')

    expect(prisma.solicitacaoESIC.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({
          status: 'RESPONDIDO',
          resposta: 'Aqui esta o relatorio solicitado',
          respondidoPor: 'admin-user',
          dataResposta: expect.any(Date),
          historico: expect.objectContaining({
            create: expect.objectContaining({
              acao: 'RESPOSTA',
              usuarioNome: 'admin-user',
            }),
          }),
        }),
      })
    )
  })
})

describe('esicService.prorrogar (LAI Art. 11 §2 — +10 dias uteis)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('estende prazoResposta em 10 dias uteis e muda status para PRORROGADO', async () => {
    const prazoOriginal = new Date('2026-05-04T12:00:00.000Z')
    prisma.solicitacaoESIC.findUniqueOrThrow.mockResolvedValue({
      id: 's1',
      prazoResposta: prazoOriginal,
    })
    prisma.solicitacaoESIC.update.mockResolvedValue({ id: 's1', status: 'PRORROGADO' })

    await esicService.prorrogar('s1', 'Necessidade de busca em arquivo morto')

    expect(prisma.solicitacaoESIC.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({
          status: 'PRORROGADO',
          motivoProrrogacao: 'Necessidade de busca em arquivo morto',
          dataProrrogacao: expect.any(Date),
          prazoResposta: expect.any(Date),
        }),
      })
    )

    const chamada = prisma.solicitacaoESIC.update.mock.calls[0][0]
    expect(chamada.data.prazoResposta.getTime()).toBeGreaterThan(prazoOriginal.getTime())
  })
})

describe('esicService.negar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.solicitacaoESIC.update.mockResolvedValue({ id: 's1', status: 'NEGADO' })
  })

  it('muda status para NEGADO com motivo na resposta', async () => {
    await esicService.negar('s1', 'Informacao classificada (LAI Art. 23)', 'admin')

    expect(prisma.solicitacaoESIC.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({
          status: 'NEGADO',
          resposta: 'Informacao classificada (LAI Art. 23)',
          respondidoPor: 'admin',
          historico: expect.objectContaining({
            create: expect.objectContaining({ acao: 'NEGACAO' }),
          }),
        }),
      })
    )
  })
})

describe('esicService.criarRecurso (LAI Art. 15 e 16)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.recursoESIC.create.mockResolvedValue({ id: 'r1', instancia: 1 })
    prisma.solicitacaoESIC.update.mockResolvedValue({ id: 's1' })
  })

  it('recurso 1a instancia: prazo de 5 dias uteis, status RECURSO_PRIMEIRA_INSTANCIA', async () => {
    await esicService.criarRecurso('s1', 'Resposta insuficiente', 1)

    expect(prisma.solicitacaoESIC.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({
          temRecurso: true,
          status: 'RECURSO_PRIMEIRA_INSTANCIA',
        }),
      })
    )
    expect(prisma.recursoESIC.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          solicitacaoId: 's1',
          instancia: 1,
          motivo: 'Resposta insuficiente',
        }),
      })
    )
  })

  it('recurso 2a instancia: status RECURSO_SEGUNDA_INSTANCIA', async () => {
    await esicService.criarRecurso('s1', 'Nego provimento', 2)

    expect(prisma.solicitacaoESIC.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'RECURSO_SEGUNDA_INSTANCIA',
        }),
      })
    )
  })

  it('recurso 3a+ instancia: fallback para status RECURSO (10 dias)', async () => {
    await esicService.criarRecurso('s1', 'Recurso superior', 3)

    expect(prisma.solicitacaoESIC.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'RECURSO',
        }),
      })
    )
  })
})

describe('esicService.listByCpfHash (RN-166 — cidadao consulta seus protocolos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(true)
  })

  it('busca por cpfHash sem expor CPF', async () => {
    prisma.solicitacaoESIC.findMany.mockResolvedValue([
      { id: 's1', protocolo: 'ESIC-2026-00001' },
    ])

    const r = await esicService.listByCpfHash('12345678909')

    expect(hashCpf).toHaveBeenCalledWith('12345678909')
    expect(prisma.solicitacaoESIC.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cpfHash: 'hash:12345678909' },
        select: expect.objectContaining({
          id: true,
          protocolo: true,
          status: true,
        }),
      })
    )
    expect(r).toHaveLength(1)
  })

  it('retorna array vazio se CPF invalido', async () => {
    ;(isValidCpfFormat as unknown as { mockReturnValue: (v: boolean) => void }).mockReturnValue(false)

    const r = await esicService.listByCpfHash('xxx')

    expect(r).toEqual([])
    expect(prisma.solicitacaoESIC.findMany).not.toHaveBeenCalled()
  })
})
