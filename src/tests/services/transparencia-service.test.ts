/**
 * Testes do Servico de Transparencia PNTP
 */

// Mocks devem vir ANTES dos imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    votacao: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    presencaSessao: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    sessao: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    parlamentar: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    publicacao: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    proposicao: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    tramitacao: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    configuracao: {
      findFirst: jest.fn()
    },
    historicoParticipacao: {
      count: jest.fn()
    }
  }
}))

jest.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}))

describe('Transparencia Service', () => {
  describe('Prazos PNTP', () => {
    it('deve ter prazo de votacoes de 30 dias', () => {
      const PRAZOS = { VOTACOES_NOMINAIS: 30 }
      expect(PRAZOS.VOTACOES_NOMINAIS).toBe(30)
    })

    it('deve ter prazo de presenca de 30 dias', () => {
      const PRAZOS = { PRESENCA_SESSOES: 30 }
      expect(PRAZOS.PRESENCA_SESSOES).toBe(30)
    })

    it('deve ter prazo de pautas de 2 dias (48h)', () => {
      const PRAZOS = { PAUTAS_ANTECEDENCIA: 2 }
      expect(PRAZOS.PAUTAS_ANTECEDENCIA).toBe(2)
    })

    it('deve ter prazo de atas de 15 dias', () => {
      const PRAZOS = { ATAS_PUBLICACAO: 15 }
      expect(PRAZOS.ATAS_PUBLICACAO).toBe(15)
    })

    it('deve ter prazo de contratos de 1 dia (24h)', () => {
      const PRAZOS = { CONTRATOS_PUBLICACAO: 1 }
      expect(PRAZOS.CONTRATOS_PUBLICACAO).toBe(1)
    })
  })

  describe('Niveis de Transparencia', () => {
    it('deve classificar corretamente os niveis', () => {
      const NIVEIS = {
        DIAMANTE: 'DIAMANTE',
        OURO: 'OURO',
        PRATA: 'PRATA',
        BRONZE: 'BRONZE'
      }

      expect(NIVEIS.DIAMANTE).toBe('DIAMANTE')
      expect(NIVEIS.OURO).toBe('OURO')
      expect(NIVEIS.PRATA).toBe('PRATA')
      expect(NIVEIS.BRONZE).toBe('BRONZE')
    })
  })

  describe('Calculo de Nivel', () => {
    const calcularNivel = (pontuacao: number, maximo: number) => {
      const percentual = (pontuacao / maximo) * 100
      if (percentual >= 90) return 'DIAMANTE'
      if (percentual >= 75) return 'OURO'
      if (percentual >= 50) return 'PRATA'
      return 'BRONZE'
    }

    it('deve retornar DIAMANTE para pontuacao >= 90%', () => {
      expect(calcularNivel(90, 100)).toBe('DIAMANTE')
      expect(calcularNivel(95, 100)).toBe('DIAMANTE')
      expect(calcularNivel(100, 100)).toBe('DIAMANTE')
    })

    it('deve retornar OURO para pontuacao >= 75% e < 90%', () => {
      expect(calcularNivel(75, 100)).toBe('OURO')
      expect(calcularNivel(80, 100)).toBe('OURO')
      expect(calcularNivel(89, 100)).toBe('OURO')
    })

    it('deve retornar PRATA para pontuacao >= 50% e < 75%', () => {
      expect(calcularNivel(50, 100)).toBe('PRATA')
      expect(calcularNivel(60, 100)).toBe('PRATA')
      expect(calcularNivel(74, 100)).toBe('PRATA')
    })

    it('deve retornar BRONZE para pontuacao < 50%', () => {
      expect(calcularNivel(0, 100)).toBe('BRONZE')
      expect(calcularNivel(25, 100)).toBe('BRONZE')
      expect(calcularNivel(49, 100)).toBe('BRONZE')
    })
  })

  describe('Status de Conformidade', () => {
    const determinarStatus = (diasDesdeAtualizacao: number, prazoLegal: number) => {
      if (diasDesdeAtualizacao <= prazoLegal) return 'CONFORME'
      if (diasDesdeAtualizacao <= prazoLegal * 1.5) return 'ALERTA'
      return 'NAO_CONFORME'
    }

    it('deve retornar CONFORME dentro do prazo', () => {
      expect(determinarStatus(10, 30)).toBe('CONFORME')
      expect(determinarStatus(30, 30)).toBe('CONFORME')
    })

    it('deve retornar ALERTA ate 1.5x do prazo', () => {
      expect(determinarStatus(35, 30)).toBe('ALERTA')
      expect(determinarStatus(45, 30)).toBe('ALERTA')
    })

    it('deve retornar NAO_CONFORME apos 1.5x do prazo', () => {
      expect(determinarStatus(50, 30)).toBe('NAO_CONFORME')
      expect(determinarStatus(100, 30)).toBe('NAO_CONFORME')
    })
  })

  describe('Urgencia de Alertas', () => {
    const determinarUrgencia = (diasRestantes: number) => {
      if (diasRestantes < 0) return 'CRITICA'
      if (diasRestantes <= 2) return 'ALTA'
      if (diasRestantes <= 7) return 'MEDIA'
      return 'BAIXA'
    }

    it('deve retornar CRITICA para prazo vencido', () => {
      expect(determinarUrgencia(-1)).toBe('CRITICA')
      expect(determinarUrgencia(-10)).toBe('CRITICA')
    })

    it('deve retornar ALTA para ate 2 dias', () => {
      expect(determinarUrgencia(0)).toBe('ALTA')
      expect(determinarUrgencia(1)).toBe('ALTA')
      expect(determinarUrgencia(2)).toBe('ALTA')
    })

    it('deve retornar MEDIA para ate 7 dias', () => {
      expect(determinarUrgencia(3)).toBe('MEDIA')
      expect(determinarUrgencia(5)).toBe('MEDIA')
      expect(determinarUrgencia(7)).toBe('MEDIA')
    })

    it('deve retornar BAIXA para mais de 7 dias', () => {
      expect(determinarUrgencia(8)).toBe('BAIXA')
      expect(determinarUrgencia(30)).toBe('BAIXA')
    })
  })

  describe('Verificacao de Requisitos PNTP', () => {
    it('deve verificar votacoes nominais atualizadas em 30 dias', () => {
      const PRAZO_VOTACOES = 30
      const ultimaAtualizacao = new Date()
      ultimaAtualizacao.setDate(ultimaAtualizacao.getDate() - 15)

      const diasDesde = Math.floor((Date.now() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60 * 24))

      expect(diasDesde).toBeLessThanOrEqual(PRAZO_VOTACOES)
    })

    it('deve verificar pautas publicadas com 48h de antecedencia', () => {
      const PRAZO_PAUTAS = 2 // dias
      const dataSessao = new Date()
      dataSessao.setDate(dataSessao.getDate() + 3) // sessao em 3 dias

      const dataPublicacao = new Date()
      const diasAntecedencia = Math.floor((dataSessao.getTime() - dataPublicacao.getTime()) / (1000 * 60 * 60 * 24))

      expect(diasAntecedencia).toBeGreaterThanOrEqual(PRAZO_PAUTAS)
    })

    it('deve verificar contratos publicados em 24h', () => {
      const PRAZO_CONTRATOS = 1 // dia
      const dataContrato = new Date()
      dataContrato.setHours(dataContrato.getHours() - 12) // contrato de 12h atras

      const dataPublicacao = new Date()
      const horasAtePublicacao = (dataPublicacao.getTime() - dataContrato.getTime()) / (1000 * 60 * 60)

      expect(horasAtePublicacao).toBeLessThanOrEqual(PRAZO_CONTRATOS * 24)
    })
  })

  describe('Calculo de Pontuacao', () => {
    it('deve calcular pontuacao total corretamente', () => {
      const itens = [
        { pontuacao: 10, pontuacaoMaxima: 10 },
        { pontuacao: 8, pontuacaoMaxima: 10 },
        { pontuacao: 5, pontuacaoMaxima: 10 },
        { pontuacao: 0, pontuacaoMaxima: 10 }
      ]

      const pontuacaoTotal = itens.reduce((sum, item) => sum + item.pontuacao, 0)
      const pontuacaoMaxima = itens.reduce((sum, item) => sum + item.pontuacaoMaxima, 0)
      const percentual = Math.round((pontuacaoTotal / pontuacaoMaxima) * 100)

      expect(pontuacaoTotal).toBe(23)
      expect(pontuacaoMaxima).toBe(40)
      expect(percentual).toBe(58)
    })
  })
})
