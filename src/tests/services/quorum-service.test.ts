import { vi } from "vitest"
/**
 * Testes unitarios para quorum-service
 * Testa funcoes puras: calcularVotosNecessarios, determinarAplicacaoQuorum, mapAplicacaoToTipoQuorum
 */

vi.mock('@/lib/prisma', () => ({
  prisma: {
    configuracaoQuorum: {
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
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

import {
  calcularVotosNecessarios,
  determinarAplicacaoQuorum,
  mapAplicacaoToTipoQuorum
} from '@/lib/services/quorum-service'

// ============================================================
// calcularVotosNecessarios
// ============================================================

describe('calcularVotosNecessarios', () => {
  describe('MAIORIA_SIMPLES', () => {
    it('deve calcular floor(base/2)+1 com 10 presentes = 6', () => {
      const resultado = calcularVotosNecessarios('MAIORIA_SIMPLES', 10)

      expect(resultado).toBe(6) // floor(10/2)+1 = 6
    })

    it('deve calcular floor(base/2)+1 com 15 presentes = 8', () => {
      const resultado = calcularVotosNecessarios('MAIORIA_SIMPLES', 15)

      expect(resultado).toBe(8) // floor(15/2)+1 = 8
    })

    it('deve calcular corretamente com base impar (9 presentes = 5)', () => {
      const resultado = calcularVotosNecessarios('MAIORIA_SIMPLES', 9)

      expect(resultado).toBe(5) // floor(9/2)+1 = 5
    })
  })

  describe('MAIORIA_ABSOLUTA', () => {
    it('deve calcular floor(base/2)+1 com 15 membros = 8', () => {
      const resultado = calcularVotosNecessarios('MAIORIA_ABSOLUTA', 15)

      expect(resultado).toBe(8) // floor(15/2)+1 = 8
    })

    it('deve calcular floor(base/2)+1 com 10 membros = 6', () => {
      const resultado = calcularVotosNecessarios('MAIORIA_ABSOLUTA', 10)

      expect(resultado).toBe(6) // floor(10/2)+1 = 6
    })

    it('deve calcular corretamente com base par (12 membros = 7)', () => {
      const resultado = calcularVotosNecessarios('MAIORIA_ABSOLUTA', 12)

      expect(resultado).toBe(7) // floor(12/2)+1 = 7
    })
  })

  describe('DOIS_TERCOS', () => {
    it('deve calcular ceil(base*2/3) com 15 membros = 10', () => {
      const resultado = calcularVotosNecessarios('DOIS_TERCOS', 15)

      expect(resultado).toBe(10) // ceil(15*2/3) = ceil(10) = 10
    })

    it('deve calcular ceil(base*2/3) com 10 membros = 7', () => {
      const resultado = calcularVotosNecessarios('DOIS_TERCOS', 10)

      expect(resultado).toBe(7) // ceil(10*2/3) = ceil(6.666) = 7
    })

    it('deve calcular ceil(base*2/3) com 9 membros = 6', () => {
      const resultado = calcularVotosNecessarios('DOIS_TERCOS', 9)

      expect(resultado).toBe(6) // ceil(9*2/3) = ceil(6) = 6
    })
  })

  describe('TRES_QUINTOS', () => {
    it('deve calcular ceil(base*3/5) com 15 membros = 9', () => {
      const resultado = calcularVotosNecessarios('TRES_QUINTOS', 15)

      expect(resultado).toBe(9) // ceil(15*3/5) = ceil(9) = 9
    })

    it('deve calcular ceil(base*3/5) com 10 membros = 6', () => {
      const resultado = calcularVotosNecessarios('TRES_QUINTOS', 10)

      expect(resultado).toBe(6) // ceil(10*3/5) = ceil(6) = 6
    })

    it('deve calcular ceil(base*3/5) com 11 membros = 7', () => {
      const resultado = calcularVotosNecessarios('TRES_QUINTOS', 11)

      expect(resultado).toBe(7) // ceil(11*3/5) = ceil(6.6) = 7
    })
  })

  describe('UNANIMIDADE', () => {
    it('deve retornar a base completa (15 membros = 15)', () => {
      const resultado = calcularVotosNecessarios('UNANIMIDADE', 15)

      expect(resultado).toBe(15)
    })

    it('deve retornar a base completa (10 membros = 10)', () => {
      const resultado = calcularVotosNecessarios('UNANIMIDADE', 10)

      expect(resultado).toBe(10)
    })
  })

  describe('tipo desconhecido (fallback)', () => {
    it('deve usar floor(base/2)+1 como fallback', () => {
      const resultado = calcularVotosNecessarios('TIPO_INVALIDO' as any, 15)

      expect(resultado).toBe(8) // floor(15/2)+1 = 8
    })
  })
})

// ============================================================
// determinarAplicacaoQuorum
// ============================================================

describe('determinarAplicacaoQuorum', () => {
  it('deve retornar VOTACAO_ABSOLUTA para PROJETO_LEI', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_LEI')

    expect(resultado).toBe('VOTACAO_ABSOLUTA')
  })

  it('deve retornar VOTACAO_ABSOLUTA para PROJETO_RESOLUCAO', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_RESOLUCAO')

    expect(resultado).toBe('VOTACAO_ABSOLUTA')
  })

  it('deve retornar VOTACAO_ABSOLUTA para PROJETO_DECRETO_LEGISLATIVO', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_DECRETO_LEGISLATIVO')

    expect(resultado).toBe('VOTACAO_ABSOLUTA')
  })

  it('deve retornar VOTACAO_QUALIFICADA para PROJETO_EMENDA_LEI_ORGANICA', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_EMENDA_LEI_ORGANICA')

    expect(resultado).toBe('VOTACAO_QUALIFICADA')
  })

  it('deve retornar VOTACAO_QUALIFICADA para PROJETO_LEI_COMPLEMENTAR', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_LEI_COMPLEMENTAR')

    expect(resultado).toBe('VOTACAO_QUALIFICADA')
  })

  it('deve retornar VOTACAO_SIMPLES para INDICACAO (tipo simples)', () => {
    const resultado = determinarAplicacaoQuorum('INDICACAO')

    expect(resultado).toBe('VOTACAO_SIMPLES')
  })

  it('deve retornar VOTACAO_SIMPLES para REQUERIMENTO', () => {
    const resultado = determinarAplicacaoQuorum('REQUERIMENTO')

    expect(resultado).toBe('VOTACAO_SIMPLES')
  })

  it('deve retornar VOTACAO_URGENCIA quando regimeUrgencia=true', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_LEI', true)

    expect(resultado).toBe('VOTACAO_URGENCIA')
  })

  it('deve retornar DERRUBADA_VETO quando isDerrubadaVeto=true', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_LEI', false, true)

    expect(resultado).toBe('DERRUBADA_VETO')
  })

  it('deve retornar VOTACAO_COMISSAO quando isVotacaoComissao=true', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_LEI', false, false, true)

    expect(resultado).toBe('VOTACAO_COMISSAO')
  })

  it('deve priorizar DERRUBADA_VETO sobre regimeUrgencia', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_LEI', true, true)

    expect(resultado).toBe('DERRUBADA_VETO')
  })

  it('deve priorizar VOTACAO_COMISSAO sobre regimeUrgencia quando nao e derrubada', () => {
    const resultado = determinarAplicacaoQuorum('PROJETO_LEI', true, false, true)

    expect(resultado).toBe('VOTACAO_COMISSAO')
  })
})

// ============================================================
// mapAplicacaoToTipoQuorum
// ============================================================

describe('mapAplicacaoToTipoQuorum', () => {
  it('deve mapear VOTACAO_SIMPLES para MAIORIA_SIMPLES', () => {
    expect(mapAplicacaoToTipoQuorum('VOTACAO_SIMPLES')).toBe('MAIORIA_SIMPLES')
  })

  it('deve mapear VOTACAO_ABSOLUTA para MAIORIA_ABSOLUTA', () => {
    expect(mapAplicacaoToTipoQuorum('VOTACAO_ABSOLUTA')).toBe('MAIORIA_ABSOLUTA')
  })

  it('deve mapear VOTACAO_QUALIFICADA para DOIS_TERCOS', () => {
    expect(mapAplicacaoToTipoQuorum('VOTACAO_QUALIFICADA')).toBe('DOIS_TERCOS')
  })

  it('deve mapear VOTACAO_URGENCIA para MAIORIA_ABSOLUTA', () => {
    expect(mapAplicacaoToTipoQuorum('VOTACAO_URGENCIA')).toBe('MAIORIA_ABSOLUTA')
  })

  it('deve mapear VOTACAO_COMISSAO para MAIORIA_SIMPLES', () => {
    expect(mapAplicacaoToTipoQuorum('VOTACAO_COMISSAO')).toBe('MAIORIA_SIMPLES')
  })

  it('deve mapear DERRUBADA_VETO para MAIORIA_ABSOLUTA', () => {
    expect(mapAplicacaoToTipoQuorum('DERRUBADA_VETO')).toBe('MAIORIA_ABSOLUTA')
  })

  it('deve mapear INSTALACAO_SESSAO para MAIORIA_ABSOLUTA', () => {
    expect(mapAplicacaoToTipoQuorum('INSTALACAO_SESSAO')).toBe('MAIORIA_ABSOLUTA')
  })

  it('deve retornar MAIORIA_SIMPLES para valor desconhecido', () => {
    expect(mapAplicacaoToTipoQuorum('VALOR_INEXISTENTE')).toBe('MAIORIA_SIMPLES')
  })

  it('deve retornar MAIORIA_SIMPLES para null', () => {
    expect(mapAplicacaoToTipoQuorum(null)).toBe('MAIORIA_SIMPLES')
  })

  it('deve retornar MAIORIA_SIMPLES para undefined', () => {
    expect(mapAplicacaoToTipoQuorum(undefined)).toBe('MAIORIA_SIMPLES')
  })
})
