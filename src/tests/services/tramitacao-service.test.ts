import { vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}))

import { calcularPrazoParecer, REGRAS_TRAMITACAO } from '@/lib/services/tramitacao-service'

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
})
