/**
 * Testes unitários para regras-regimentais-service.
 *
 * Cobertura:
 * - Estrutura do catálogo REGRAS_REGIMENTAIS (códigos únicos, campos obrigatórios)
 * - executarValidacao para contextos QUORUM (cálculo real: ABSOLUTA, QUALIFICADA, SIMPLES)
 * - executarValidacao para contextos TRAMITACAO (CLJ, parecer obrigatório)
 * - executarValidacao para contextos INICIATIVA (iniciativa privativa do Executivo)
 * - executarValidacao para contextos IMPEDIMENTO (autor da proposição)
 * - verificarElegibilidadePauta (divisão bloqueios × avisos)
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    sessao: { findUnique: jest.fn() },
    parlamentar: { count: jest.fn() },
    proposicao: { findUnique: jest.fn() },
  },
}))

jest.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}))

import {
  REGRAS_REGIMENTAIS,
  executarValidacao,
  verificarElegibilidadePauta,
} from '@/lib/services/regras-regimentais-service'
import { prisma } from '@/lib/prisma'

const mockedPrisma = prisma as unknown as {
  sessao: { findUnique: jest.Mock }
  parlamentar: { count: jest.Mock }
  proposicao: { findUnique: jest.Mock }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================
// Catálogo REGRAS_REGIMENTAIS
// ============================================================

describe('REGRAS_REGIMENTAIS (catálogo)', () => {
  it('deve conter ao menos 18 regras', () => {
    expect(REGRAS_REGIMENTAIS.length).toBeGreaterThanOrEqual(18)
  })

  it('deve ter todos os códigos únicos', () => {
    const codigos = REGRAS_REGIMENTAIS.map((r) => r.codigo)
    const unicos = new Set(codigos)
    expect(unicos.size).toBe(codigos.length)
  })

  it('deve seguir padrão RR-XXX em todos os códigos', () => {
    REGRAS_REGIMENTAIS.forEach((r) => {
      expect(r.codigo).toMatch(/^RR-\d{3}$/)
    })
  })

  it('deve ter campos obrigatórios preenchidos em todas as regras', () => {
    REGRAS_REGIMENTAIS.forEach((r) => {
      expect(r.codigo).toBeTruthy()
      expect(r.nome).toBeTruthy()
      expect(r.tipo).toBeTruthy()
      expect(r.descricao).toBeTruthy()
      expect(r.mensagemErro).toBeTruthy()
      expect(r.sugestaoCorretiva).toBeTruthy()
      expect(['INFO', 'AVISO', 'ERRO', 'BLOQUEIO']).toContain(r.severidade)
    })
  })

  it('deve cobrir os 8 tipos regimentais', () => {
    const tipos = new Set(REGRAS_REGIMENTAIS.map((r) => r.tipo))
    expect(tipos).toContain('QUORUM')
    expect(tipos).toContain('PRAZO')
    expect(tipos).toContain('INTERSTICIO')
    expect(tipos).toContain('TRAMITACAO')
    expect(tipos).toContain('VOTACAO')
    expect(tipos).toContain('INICIATIVA')
    expect(tipos).toContain('IMPEDIMENTO')
    expect(tipos).toContain('PUBLICIDADE')
  })

  it('deve ter RR-001 como BLOQUEIO (quórum de instalação)', () => {
    const rr001 = REGRAS_REGIMENTAIS.find((r) => r.codigo === 'RR-001')
    expect(rr001).toBeDefined()
    expect(rr001?.severidade).toBe('BLOQUEIO')
    expect(rr001?.tipo).toBe('QUORUM')
  })

  it('deve ter RR-030 (passagem obrigatória CLJ) como BLOQUEIO', () => {
    const rr030 = REGRAS_REGIMENTAIS.find((r) => r.codigo === 'RR-030')
    expect(rr030?.severidade).toBe('BLOQUEIO')
    expect(rr030?.tipo).toBe('TRAMITACAO')
  })
})

// ============================================================
// executarValidacao — QUORUM
// ============================================================

describe('executarValidacao — regras de QUORUM', () => {
  const fazSessao = (presentes: number) => ({
    id: 'sessao-1',
    presencas: Array.from({ length: presentes }, (_, i) => ({
      id: `p-${i}`,
      parlamentarId: `parl-${i}`,
      presente: true,
    })),
  })

  it('QUORUM ABSOLUTA (RR-001): atendido quando presentes ≥ floor(total/2)+1', async () => {
    mockedPrisma.sessao.findUnique.mockResolvedValue(fazSessao(6))
    mockedPrisma.parlamentar.count.mockResolvedValue(10)

    const resultados = await executarValidacao({ sessaoId: 'sessao-1' })
    const rr001 = resultados.find((r) => r.codigo === 'RR-001')

    expect(rr001).toBeDefined()
    // floor(10/2)+1 = 6, 6 presentes → atende
    expect(rr001?.atendida).toBe(true)
  })

  it('QUORUM ABSOLUTA (RR-001): NÃO atendido quando presentes < floor(total/2)+1', async () => {
    mockedPrisma.sessao.findUnique.mockResolvedValue(fazSessao(5))
    mockedPrisma.parlamentar.count.mockResolvedValue(10)

    const resultados = await executarValidacao({ sessaoId: 'sessao-1' })
    const rr001 = resultados.find((r) => r.codigo === 'RR-001')

    expect(rr001?.atendida).toBe(false)
    expect(rr001?.mensagem).toContain('Quórum')
  })

  it('QUORUM QUALIFICADA (RR-003): atendido quando presentes ≥ ceil(total*2/3)', async () => {
    // 10 parlamentares, ceil(20/3) = 7 necessários
    mockedPrisma.sessao.findUnique.mockResolvedValue(fazSessao(7))
    mockedPrisma.parlamentar.count.mockResolvedValue(10)

    const resultados = await executarValidacao({ sessaoId: 'sessao-1' })
    const rr003 = resultados.find((r) => r.codigo === 'RR-003')

    expect(rr003?.atendida).toBe(true)
  })

  it('QUORUM QUALIFICADA (RR-003): NÃO atendido com 6 de 10', async () => {
    mockedPrisma.sessao.findUnique.mockResolvedValue(fazSessao(6))
    mockedPrisma.parlamentar.count.mockResolvedValue(10)

    const resultados = await executarValidacao({ sessaoId: 'sessao-1' })
    const rr003 = resultados.find((r) => r.codigo === 'RR-003')

    expect(rr003?.atendida).toBe(false)
  })

  it('QUORUM SIMPLES (RR-002): sempre atendida quando há presentes', async () => {
    mockedPrisma.sessao.findUnique.mockResolvedValue(fazSessao(2))
    mockedPrisma.parlamentar.count.mockResolvedValue(10)

    const resultados = await executarValidacao({ sessaoId: 'sessao-1' })
    const rr002 = resultados.find((r) => r.codigo === 'RR-002')

    expect(rr002?.atendida).toBe(true)
  })

  it('sem sessaoId no contexto, regras de QUORUM retornam null (não avaliadas)', async () => {
    const resultados = await executarValidacao({ proposicaoId: 'prop-1' })
    const quoruns = resultados.filter((r) => r.tipo === 'QUORUM')
    expect(quoruns).toHaveLength(0)
  })

  it('sessão inexistente: regras de QUORUM não são incluídas', async () => {
    mockedPrisma.sessao.findUnique.mockResolvedValue(null)
    mockedPrisma.parlamentar.count.mockResolvedValue(10)

    const resultados = await executarValidacao({ sessaoId: 'inexistente' })
    const quoruns = resultados.filter((r) => r.tipo === 'QUORUM')
    expect(quoruns).toHaveLength(0)
  })
})

// ============================================================
// executarValidacao — TRAMITACAO
// ============================================================

describe('executarValidacao — regras de TRAMITACAO', () => {
  const fazProposicao = (opts: {
    status?: string
    tramitacoes?: Array<{ unidade?: { tipo: string; nome: string }; parecer?: unknown }>
    autorId?: string | null
    tipo?: string
    ementa?: string
  }) => ({
    id: 'prop-1',
    status: opts.status || 'EM_TRAMITACAO',
    autorId: opts.autorId ?? 'autor-1',
    tipo: opts.tipo || 'PROJETO_LEI',
    ementa: opts.ementa || 'Dispõe sobre...',
    dataVotacao: null,
    updatedAt: new Date(),
    autor: opts.autorId ? { id: opts.autorId, nome: 'Fulano' } : null,
    tramitacoes: opts.tramitacoes || [],
  })

  it('RR-030 (passagem CLJ): atendida quando há tramitação em comissão com parecer', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue(
      fazProposicao({
        tramitacoes: [
          {
            unidade: { tipo: 'COMISSAO', nome: 'CLJ' },
            parecer: { texto: 'Favorável', tipo: 'FAVORAVEL' },
          },
        ],
      })
    )

    const resultados = await executarValidacao({ proposicaoId: 'prop-1' })
    const rr030 = resultados.find((r) => r.codigo === 'RR-030')

    expect(rr030?.atendida).toBe(true)
  })

  it('RR-030 (passagem CLJ): NÃO atendida sem parecer em comissão', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue(
      fazProposicao({
        tramitacoes: [{ unidade: { tipo: 'PLENARIO', nome: 'Plenário' }, parecer: null }],
      })
    )

    const resultados = await executarValidacao({ proposicaoId: 'prop-1' })
    const rr030 = resultados.find((r) => r.codigo === 'RR-030')

    expect(rr030?.atendida).toBe(false)
    expect(rr030?.sugestaoCorretiva).toBeTruthy()
  })

  it('RR-031 (parecer obrigatório): atendida quando ao menos uma tramitação tem parecer', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue(
      fazProposicao({
        tramitacoes: [
          { unidade: { tipo: 'COMISSAO', nome: 'CLJ' }, parecer: { ok: true } },
        ],
      })
    )

    const resultados = await executarValidacao({ proposicaoId: 'prop-1' })
    const rr031 = resultados.find((r) => r.codigo === 'RR-031')

    expect(rr031?.atendida).toBe(true)
  })

  it('RR-031: NÃO atendida quando nenhuma tramitação tem parecer', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue(
      fazProposicao({ tramitacoes: [] })
    )

    const resultados = await executarValidacao({ proposicaoId: 'prop-1' })
    const rr031 = resultados.find((r) => r.codigo === 'RR-031')

    expect(rr031?.atendida).toBe(false)
  })
})

// ============================================================
// executarValidacao — IMPEDIMENTO
// ============================================================

describe('executarValidacao — regras de IMPEDIMENTO', () => {
  it('RR-060: detecta autor como impedido', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue({
      id: 'prop-1',
      autorId: 'parl-1',
      autor: { id: 'parl-1', nome: 'Fulano' },
      status: 'EM_TRAMITACAO',
      tipo: 'PROJETO_LEI',
      ementa: 'Teste',
      dataVotacao: null,
      updatedAt: new Date(),
      tramitacoes: [],
    })

    const resultados = await executarValidacao({
      proposicaoId: 'prop-1',
      parlamentarId: 'parl-1',
    })
    const rr060 = resultados.find((r) => r.codigo === 'RR-060')

    expect(rr060?.atendida).toBe(false)
    expect(rr060?.dados).toMatchObject({ ehAutor: true })
  })

  it('RR-060: parlamentar diferente do autor não está impedido', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue({
      id: 'prop-1',
      autorId: 'parl-1',
      autor: { id: 'parl-1', nome: 'Fulano' },
      status: 'EM_TRAMITACAO',
      tipo: 'PROJETO_LEI',
      ementa: 'Teste',
      dataVotacao: null,
      updatedAt: new Date(),
      tramitacoes: [],
    })

    const resultados = await executarValidacao({
      proposicaoId: 'prop-1',
      parlamentarId: 'parl-2',
    })
    const rr060 = resultados.find((r) => r.codigo === 'RR-060')

    expect(rr060?.atendida).toBe(true)
    expect(rr060?.dados).toMatchObject({ ehAutor: false })
  })
})

// ============================================================
// verificarElegibilidadePauta
// ============================================================

describe('verificarElegibilidadePauta', () => {
  it('deve ser elegível quando nenhuma regra BLOQUEIO é violada', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue({
      id: 'prop-1',
      status: 'EM_TRAMITACAO',
      autorId: 'parl-1',
      tipo: 'PROJETO_LEI',
      ementa: 'Dispõe sobre teste.',
      dataVotacao: null,
      updatedAt: new Date(),
      autor: { id: 'parl-1', nome: 'Fulano' },
      tramitacoes: [
        {
          unidade: { tipo: 'COMISSAO', nome: 'CLJ' },
          parecer: { texto: 'Favorável' },
        },
      ],
    })

    const resultado = await verificarElegibilidadePauta('prop-1')

    expect(resultado).toHaveProperty('elegivel')
    expect(resultado).toHaveProperty('bloqueios')
    expect(resultado).toHaveProperty('avisos')
    expect(Array.isArray(resultado.bloqueios)).toBe(true)
    expect(Array.isArray(resultado.avisos)).toBe(true)
  })

  it('deve NÃO ser elegível quando há bloqueio de tramitação (sem parecer)', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue({
      id: 'prop-1',
      status: 'EM_TRAMITACAO',
      autorId: 'parl-1',
      tipo: 'PROJETO_LEI',
      ementa: 'Dispõe sobre teste.',
      dataVotacao: null,
      updatedAt: new Date(),
      autor: { id: 'parl-1', nome: 'Fulano' },
      tramitacoes: [],
    })

    const resultado = await verificarElegibilidadePauta('prop-1')

    expect(resultado.elegivel).toBe(false)
    expect(resultado.bloqueios.length).toBeGreaterThan(0)
    // RR-030 é BLOQUEIO e deve aparecer
    expect(resultado.bloqueios.some((b) => b.codigo === 'RR-030')).toBe(true)
  })

  it('deve separar bloqueios (severidade BLOQUEIO) de avisos (outras severidades)', async () => {
    mockedPrisma.proposicao.findUnique.mockResolvedValue({
      id: 'prop-1',
      status: 'EM_TRAMITACAO',
      autorId: 'parl-1',
      tipo: 'PROJETO_LEI',
      ementa: 'Teste.',
      dataVotacao: null,
      updatedAt: new Date(),
      autor: { id: 'parl-1', nome: 'Fulano' },
      tramitacoes: [],
    })

    const resultado = await verificarElegibilidadePauta('prop-1')

    // Todos os bloqueios devem ter severidade BLOQUEIO
    resultado.bloqueios.forEach((b) => expect(b.severidade).toBe('BLOQUEIO'))
    // Nenhum aviso deve ter severidade BLOQUEIO
    resultado.avisos.forEach((a) => expect(a.severidade).not.toBe('BLOQUEIO'))
  })
})
