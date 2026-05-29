import { vi, beforeEach } from "vitest"

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    sessao: { findUnique: vi.fn() },
    mandato: { findFirst: vi.fn() },
    votacao: { upsert: vi.fn() }
  }
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

vi.mock('@/lib/services/turno-service', () => ({
  getConfiguracaoTurno: vi.fn((tipo: string) => {
    const configs: Record<string, { totalTurnos: number; intersticioDias: number; tipoQuorum: string; descricao: string }> = {
      'PROJETO_EMENDA_LEI_ORGANICA': {
        totalTurnos: 2,
        intersticioDias: 10,
        tipoQuorum: 'DOIS_TERCOS',
        descricao: 'Emenda à Lei Orgânica - 2 turnos'
      },
      'PROJETO_LEI': {
        totalTurnos: 1,
        intersticioDias: 0,
        tipoQuorum: 'MAIORIA_SIMPLES',
        descricao: 'Projeto de Lei Ordinária - Turno único'
      },
      'DEFAULT': {
        totalTurnos: 1,
        intersticioDias: 0,
        tipoQuorum: 'MAIORIA_SIMPLES',
        descricao: 'Configuração padrão - Turno único'
      }
    }
    return configs[tipo] || configs['DEFAULT']
  }),
  requerDoisTurnos: vi.fn((tipo: string) => {
    return tipo === 'PROJETO_EMENDA_LEI_ORGANICA'
  })
}))

import {
  calcularQuorum,
  deveSerVotacaoNominal,
  verificarDoisTurnos,
  validarMandatoAtivo,
  upsertVotoIndividual
} from '@/lib/services/votacao-service'

describe('calcularQuorum', () => {
  describe('SIMPLES (maioria simples)', () => {
    it('deve calcular quorum com 15 membros e 10 presentes', () => {
      const resultado = calcularQuorum('SIMPLES', 15, 10)

      expect(resultado.tipo).toBe('SIMPLES')
      expect(resultado.totalMembros).toBe(15)
      expect(resultado.presentes).toBe(10)
      expect(resultado.quorumNecessario).toBe(8) // floor(15/2)+1
      expect(resultado.temQuorum).toBe(true)     // 10 >= 8
      expect(resultado.minVotosAprovacao).toBe(6) // floor(10/2)+1
    })

    it('deve retornar temQuorum=false com apenas 5 presentes', () => {
      const resultado = calcularQuorum('SIMPLES', 15, 5)

      expect(resultado.quorumNecessario).toBe(8)
      expect(resultado.temQuorum).toBe(false) // 5 < 8
    })

    it('deve calcular minVotosAprovacao baseado nos presentes', () => {
      const resultado = calcularQuorum('SIMPLES', 15, 9)

      expect(resultado.quorumNecessario).toBe(8)
      expect(resultado.temQuorum).toBe(true)
      expect(resultado.minVotosAprovacao).toBe(5) // floor(9/2)+1
    })
  })

  describe('ABSOLUTA (maioria absoluta)', () => {
    it('deve calcular quorum com 15 membros e 10 presentes', () => {
      const resultado = calcularQuorum('ABSOLUTA', 15, 10)

      expect(resultado.tipo).toBe('ABSOLUTA')
      expect(resultado.quorumNecessario).toBe(8) // floor(15/2)+1
      expect(resultado.temQuorum).toBe(true)
      expect(resultado.minVotosAprovacao).toBe(8) // igual ao quorumNecessario
    })

    it('minVotosAprovacao deve ser igual ao quorumNecessario', () => {
      const resultado = calcularQuorum('ABSOLUTA', 15, 10)

      expect(resultado.minVotosAprovacao).toBe(resultado.quorumNecessario)
    })
  })

  describe('QUALIFICADA (2/3)', () => {
    it('deve calcular quorum com 15 membros e 10 presentes', () => {
      const resultado = calcularQuorum('QUALIFICADA', 15, 10)

      expect(resultado.tipo).toBe('QUALIFICADA')
      expect(resultado.quorumNecessario).toBe(10) // ceil(15*2/3)
      expect(resultado.temQuorum).toBe(true)      // 10 >= 10
      expect(resultado.minVotosAprovacao).toBe(10) // igual ao quorumNecessario
    })

    it('deve retornar temQuorum=false quando presentes < 2/3', () => {
      const resultado = calcularQuorum('QUALIFICADA', 15, 9)

      expect(resultado.quorumNecessario).toBe(10)
      expect(resultado.temQuorum).toBe(false) // 9 < 10
    })
  })

  describe('casos limite', () => {
    it('deve funcionar com numero par de membros', () => {
      const resultado = calcularQuorum('SIMPLES', 10, 6)

      expect(resultado.quorumNecessario).toBe(6)  // floor(10/2)+1
      expect(resultado.temQuorum).toBe(true)
      expect(resultado.minVotosAprovacao).toBe(4)  // floor(6/2)+1
    })

    it('deve funcionar com todos os membros presentes', () => {
      const resultado = calcularQuorum('SIMPLES', 15, 15)

      expect(resultado.temQuorum).toBe(true)
      expect(resultado.minVotosAprovacao).toBe(8) // floor(15/2)+1
    })

    it('deve funcionar com zero presentes', () => {
      const resultado = calcularQuorum('SIMPLES', 15, 0)

      expect(resultado.temQuorum).toBe(false)
      expect(resultado.minVotosAprovacao).toBe(1) // floor(0/2)+1
    })
  })
})

describe('deveSerVotacaoNominal', () => {
  it('deve exigir nominal para quorum QUALIFICADA', () => {
    const resultado = deveSerVotacaoNominal('PROJETO_LEI', 'QUALIFICADA')

    expect(resultado.nominal).toBe(true)
    expect(resultado.motivo).toContain('RN-061')
  })

  it('deve exigir nominal para PROJETO_EMENDA_LEI_ORGANICA', () => {
    const resultado = deveSerVotacaoNominal('PROJETO_EMENDA_LEI_ORGANICA', 'SIMPLES')

    expect(resultado.nominal).toBe(true)
    expect(resultado.motivo).toContain('Emendas à Lei Orgânica')
  })

  it('deve exigir nominal para APRECIACAO_VETO', () => {
    const resultado = deveSerVotacaoNominal('APRECIACAO_VETO', 'SIMPLES')

    expect(resultado.nominal).toBe(true)
    expect(resultado.motivo).toContain('veto')
  })

  it('deve exigir nominal quando requerimentoNominal=true', () => {
    const resultado = deveSerVotacaoNominal('PROJETO_LEI', 'SIMPLES', true)

    expect(resultado.nominal).toBe(true)
    expect(resultado.motivo).toContain('requerida por parlamentar')
  })

  it('deve permitir votacao simbolica para PROJETO_LEI + SIMPLES sem requerimento', () => {
    const resultado = deveSerVotacaoNominal('PROJETO_LEI', 'SIMPLES', false)

    expect(resultado.nominal).toBe(false)
    expect(resultado.motivo).toContain('simbólica permitida')
  })

  it('deve respeitar prioridade: QUALIFICADA tem precedencia sobre tipo', () => {
    const resultado = deveSerVotacaoNominal('PROJETO_LEI', 'QUALIFICADA', false)

    expect(resultado.nominal).toBe(true)
    expect(resultado.motivo).toContain('quórum qualificado')
  })
})

describe('verificarDoisTurnos', () => {
  it('deve retornar requer=true para PROJETO_EMENDA_LEI_ORGANICA', () => {
    const resultado = verificarDoisTurnos('PROJETO_EMENDA_LEI_ORGANICA')

    expect(resultado.requer).toBe(true)
    expect(resultado.config).toBeDefined()
    expect(resultado.config.totalTurnos).toBe(2)
  })

  it('deve retornar requer=false para PROJETO_LEI', () => {
    const resultado = verificarDoisTurnos('PROJETO_LEI')

    expect(resultado.requer).toBe(false)
    expect(resultado.config).toBeDefined()
    expect(resultado.config.totalTurnos).toBe(1)
  })

  it('deve retornar config com todas as propriedades', () => {
    const resultado = verificarDoisTurnos('PROJETO_EMENDA_LEI_ORGANICA')

    expect(resultado.config).toHaveProperty('totalTurnos')
    expect(resultado.config).toHaveProperty('intersticioDias')
    expect(resultado.config).toHaveProperty('tipoQuorum')
    expect(resultado.config).toHaveProperty('descricao')
  })

  it('deve usar configuracao DEFAULT para tipo desconhecido', () => {
    const resultado = verificarDoisTurnos('TIPO_INEXISTENTE')

    expect(resultado.requer).toBe(false)
    expect(resultado.config.totalTurnos).toBe(1)
  })
})

describe('validarMandatoAtivo (P0-4 / RN-061)', () => {
  beforeEach(() => {
    mockPrisma.sessao.findUnique.mockReset()
    mockPrisma.mandato.findFirst.mockReset()
  })

  it('valido quando sessao tem legislaturaId e parlamentar tem mandato ativo', async () => {
    mockPrisma.sessao.findUnique.mockResolvedValue({ legislaturaId: 'leg-1' })
    mockPrisma.mandato.findFirst.mockResolvedValue({ id: 'm-1' })

    const result = await validarMandatoAtivo('parl-1', 'sess-1')

    expect(result.valido).toBe(true)
    expect(mockPrisma.mandato.findFirst).toHaveBeenCalledWith({
      where: { parlamentarId: 'parl-1', legislaturaId: 'leg-1', ativo: true },
      select: { id: true }
    })
  })

  it('invalido quando parlamentar nao tem mandato ativo na legislatura', async () => {
    mockPrisma.sessao.findUnique.mockResolvedValue({ legislaturaId: 'leg-1' })
    mockPrisma.mandato.findFirst.mockResolvedValue(null)

    const result = await validarMandatoAtivo('parl-1', 'sess-1')

    expect(result.valido).toBe(false)
    expect(result.motivo).toMatch(/RN-061/)
    expect(result.motivo).toMatch(/mandato ativo/)
  })

  it('valido por compatibilidade quando sessao nao tem legislaturaId', async () => {
    mockPrisma.sessao.findUnique.mockResolvedValue({ legislaturaId: null })

    const result = await validarMandatoAtivo('parl-1', 'sess-1')

    expect(result.valido).toBe(true)
    expect(mockPrisma.mandato.findFirst).not.toHaveBeenCalled()
  })

  it('valido quando sessao nao existe (defensivo)', async () => {
    mockPrisma.sessao.findUnique.mockResolvedValue(null)

    const result = await validarMandatoAtivo('parl-1', 'inexistente')

    expect(result.valido).toBe(true)
    expect(mockPrisma.mandato.findFirst).not.toHaveBeenCalled()
  })
})

describe('upsertVotoIndividual (P0-4 enforcement)', () => {
  beforeEach(() => {
    mockPrisma.sessao.findUnique.mockReset()
    mockPrisma.mandato.findFirst.mockReset()
    mockPrisma.votacao.upsert.mockReset()
  })

  it('lanca erro quando parlamentar nao tem mandato ativo', async () => {
    mockPrisma.sessao.findUnique.mockResolvedValue({ legislaturaId: 'leg-1' })
    mockPrisma.mandato.findFirst.mockResolvedValue(null)

    await expect(
      upsertVotoIndividual({
        proposicaoId: 'p-1',
        parlamentarId: 'parl-1',
        voto: 'SIM',
        turno: 1,
        sessaoId: 'sess-1'
      })
    ).rejects.toThrow(/RN-061/)

    expect(mockPrisma.votacao.upsert).not.toHaveBeenCalled()
  })

  it('persiste voto quando parlamentar tem mandato ativo', async () => {
    mockPrisma.sessao.findUnique.mockResolvedValue({ legislaturaId: 'leg-1' })
    mockPrisma.mandato.findFirst.mockResolvedValue({ id: 'm-1' })
    mockPrisma.votacao.upsert.mockResolvedValue({ id: 'v-1' })

    await upsertVotoIndividual({
      proposicaoId: 'p-1',
      parlamentarId: 'parl-1',
      voto: 'SIM',
      turno: 1,
      sessaoId: 'sess-1'
    })

    expect(mockPrisma.votacao.upsert).toHaveBeenCalledTimes(1)
  })
})
