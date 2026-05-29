import { vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    proposicao: { findUnique: vi.fn() },
    comissao: { findFirst: vi.fn() },
    tramitacaoUnidade: { findFirst: vi.fn() }
  }
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}))

import {
  calcularPrazoParecer,
  REGRAS_TRAMITACAO,
  validarPassagemCLJ
} from '@/lib/services/tramitacao-service'

describe('tramitacao-service', () => {
  describe('calcularPrazoParecer', () => {
    const dataBase = new Date('2026-01-06') // segunda-feira

    it('retorna 15 dias uteis para regime NORMAL', () => {
      const result = calcularPrazoParecer('NORMAL', dataBase)
      expect(result.diasUteis).toBe(15)
      expect(result.prazo).toBeInstanceOf(Date)
      expect(result.prazo!.getTime()).toBeGreaterThan(dataBase.getTime())
    })

    it('retorna 10 dias uteis para regime PRIORIDADE', () => {
      const result = calcularPrazoParecer('PRIORIDADE', dataBase)
      expect(result.diasUteis).toBe(10)
      expect(result.prazo).toBeInstanceOf(Date)
    })

    it('retorna 5 dias uteis para regime URGENCIA', () => {
      const result = calcularPrazoParecer('URGENCIA', dataBase)
      expect(result.diasUteis).toBe(5)
      expect(result.prazo).toBeInstanceOf(Date)
    })

    it('retorna prazo null e 0 dias para URGENCIA_URGENTISSIMA (imediato)', () => {
      const result = calcularPrazoParecer('URGENCIA_URGENTISSIMA', dataBase)
      expect(result.diasUteis).toBe(0)
      expect(result.prazo).toBeNull()
    })

    it('prazo NORMAL > prazo PRIORIDADE > prazo URGENCIA', () => {
      const normal = calcularPrazoParecer('NORMAL', dataBase)
      const prioridade = calcularPrazoParecer('PRIORIDADE', dataBase)
      const urgencia = calcularPrazoParecer('URGENCIA', dataBase)

      expect(normal.prazo!.getTime()).toBeGreaterThan(prioridade.prazo!.getTime())
      expect(prioridade.prazo!.getTime()).toBeGreaterThan(urgencia.prazo!.getTime())
    })
  })

  describe('REGRAS_TRAMITACAO', () => {
    it('contem todas as regras RN-030 a RN-037', () => {
      expect(REGRAS_TRAMITACAO).toHaveProperty('RN-030')
      expect(REGRAS_TRAMITACAO).toHaveProperty('RN-031')
      expect(REGRAS_TRAMITACAO).toHaveProperty('RN-032')
      expect(REGRAS_TRAMITACAO).toHaveProperty('RN-033')
      expect(REGRAS_TRAMITACAO).toHaveProperty('RN-034')
      expect(REGRAS_TRAMITACAO).toHaveProperty('RN-035')
      expect(REGRAS_TRAMITACAO).toHaveProperty('RN-036')
      expect(REGRAS_TRAMITACAO).toHaveProperty('RN-037')
    })

    it('todas as regras sao strings nao vazias', () => {
      for (const [key, value] of Object.entries(REGRAS_TRAMITACAO)) {
        expect(typeof value).toBe('string')
        expect(value.length).toBeGreaterThan(0)
      }
    })

    it('RN-032 menciona os prazos corretos', () => {
      expect(REGRAS_TRAMITACAO['RN-032']).toContain('15d')
      expect(REGRAS_TRAMITACAO['RN-032']).toContain('10d')
      expect(REGRAS_TRAMITACAO['RN-032']).toContain('5d')
    })
  })

  describe('validarPassagemCLJ (RN-030)', () => {
    beforeEach(() => {
      mockPrisma.proposicao.findUnique.mockReset()
      mockPrisma.comissao.findFirst.mockReset()
      mockPrisma.tramitacaoUnidade.findFirst.mockReset()
    })

    const makeProposicao = (tipo: string, unidadesTramitacao: string[] = []) => ({
      id: 'prop-1',
      tipo,
      numero: '001',
      ano: 2026,
      tramitacoes: unidadesTramitacao.map(unidadeId => ({
        unidadeId,
        unidade: { id: unidadeId, nome: 'CLJ' }
      }))
    })

    it('PL sem passagem pela CLJ em modo enforce: valid=false (bloqueia)', async () => {
      mockPrisma.proposicao.findUnique.mockResolvedValue(makeProposicao('PROJETO_LEI', []))
      mockPrisma.comissao.findFirst.mockResolvedValue({ id: 'c1', nome: 'CLJ', ativa: true })
      mockPrisma.tramitacaoUnidade.findFirst.mockResolvedValue({ id: 'u-clj', nome: 'CLJ', ativo: true })

      const result = await validarPassagemCLJ('prop-1', 'enforce')

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toMatch(/CLJ/)
      expect(result.rule).toBe('RN-030')
    })

    it('PL sem passagem pela CLJ em modo warning: valid=true (apenas warning)', async () => {
      mockPrisma.proposicao.findUnique.mockResolvedValue(makeProposicao('PROJETO_LEI', []))
      mockPrisma.comissao.findFirst.mockResolvedValue({ id: 'c1', nome: 'CLJ', ativa: true })
      mockPrisma.tramitacaoUnidade.findFirst.mockResolvedValue({ id: 'u-clj', nome: 'CLJ', ativo: true })

      const result = await validarPassagemCLJ('prop-1', 'warning')

      expect(result.valid).toBe(true)
      expect(result.warnings[0]).toMatch(/CLJ/)
      expect(result.errors).toHaveLength(0)
    })

    it('REQUERIMENTO dispensa CLJ mesmo em enforce', async () => {
      mockPrisma.proposicao.findUnique.mockResolvedValue(makeProposicao('REQUERIMENTO', []))

      const result = await validarPassagemCLJ('prop-1', 'enforce')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('MOCAO/VOTO_PESAR/VOTO_APLAUSO/INDICACAO dispensam CLJ', async () => {
      for (const tipo of ['MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO', 'INDICACAO']) {
        mockPrisma.proposicao.findUnique.mockResolvedValue(makeProposicao(tipo, []))
        const result = await validarPassagemCLJ('prop-1', 'enforce')
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }
    })

    it('PL com tramitação registrada pela CLJ: valid=true', async () => {
      mockPrisma.proposicao.findUnique.mockResolvedValue(makeProposicao('PROJETO_LEI', ['u-clj']))
      mockPrisma.comissao.findFirst.mockResolvedValue({ id: 'c1', nome: 'CLJ', ativa: true })
      mockPrisma.tramitacaoUnidade.findFirst.mockResolvedValue({ id: 'u-clj', nome: 'CLJ', ativo: true })

      const result = await validarPassagemCLJ('prop-1', 'enforce')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('proposição inexistente: valid=false com erro', async () => {
      mockPrisma.proposicao.findUnique.mockResolvedValue(null)

      const result = await validarPassagemCLJ('inexistente', 'enforce')

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toMatch(/não encontrada/)
    })

    it('CLJ não cadastrada no sistema: valid=true com warning (não quebra setups novos)', async () => {
      mockPrisma.proposicao.findUnique.mockResolvedValue(makeProposicao('PROJETO_LEI', []))
      mockPrisma.comissao.findFirst.mockResolvedValue(null)

      const result = await validarPassagemCLJ('prop-1', 'enforce')

      expect(result.valid).toBe(true)
      expect(result.warnings[0]).toMatch(/não encontrada/)
    })
  })
})
