import { vi } from "vitest"
/**
 * Testes do Servico de Sancao, Veto e Promulgacao
 * Testa funcoes puras: verificarPrazoSancao, calcularPrazoApreciacaoVeto,
 * validarApreciacaoVeto, validarPublicacao
 */

// Mocks devem vir ANTES dos imports
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}))

import {
  verificarPrazoSancao,
  calcularPrazoApreciacaoVeto,
  validarApreciacaoVeto,
  validarPublicacao
} from '@/lib/services/sancao-veto-service'

describe('sancao-veto-service', () => {
  // =========================================================
  // verificarPrazoSancao
  // =========================================================
  describe('verificarPrazoSancao', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-10T12:00:00').getTime())
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('deve retornar expirado=true quando a data de envio e muito antiga', () => {
      // 90 dias atras - prazo de 15 dias uteis ja passou
      const dataEnvio = new Date('2026-01-01')
      const resultado = verificarPrazoSancao(dataEnvio)

      expect(resultado.expirado).toBe(true)
      expect(resultado.diasRestantes).toBeLessThan(0)
      expect(resultado.prazoFinal).toBeInstanceOf(Date)
    })

    it('deve retornar expirado=false quando a data de envio e hoje', () => {
      const dataEnvio = new Date('2026-04-10')
      const resultado = verificarPrazoSancao(dataEnvio)

      expect(resultado.expirado).toBe(false)
      expect(resultado.diasRestantes).toBeGreaterThan(0)
      expect(resultado.prazoFinal).toBeInstanceOf(Date)
    })

    it('deve calcular prazoFinal adicionando 15 dias uteis a data de envio', () => {
      const dataEnvio = new Date('2026-04-06T12:00:00')
      const resultado = verificarPrazoSancao(dataEnvio)

      // prazoFinal deve ser uma data futura resultante de 15 dias uteis
      expect(resultado.prazoFinal.getMonth()).toBe(3) // abril
      // Verifica que prazoFinal e posterior a dataEnvio em pelo menos 19 dias
      // (15 uteis + pelo menos 4 dias de fim de semana)
      const diffMs = resultado.prazoFinal.getTime() - dataEnvio.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThanOrEqual(19)
      expect(diffDays).toBeLessThanOrEqual(23)
    })
  })

  // =========================================================
  // calcularPrazoApreciacaoVeto
  // =========================================================
  describe('calcularPrazoApreciacaoVeto', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-10T12:00:00').getTime())
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('deve retornar vencido=true quando o veto foi ha mais de 30 dias', () => {
      // 60 dias atras
      const dataVeto = new Date('2026-02-09')
      const resultado = calcularPrazoApreciacaoVeto(dataVeto)

      expect(resultado.vencido).toBe(true)
      expect(resultado.diasRestantes).toBeLessThan(0)
      expect(resultado.prazoFinal).toBeInstanceOf(Date)
    })

    it('deve retornar vencido=false e diasRestantes ~30 quando o veto e de hoje', () => {
      const dataVeto = new Date('2026-04-10T12:00:00')
      const resultado = calcularPrazoApreciacaoVeto(dataVeto)

      expect(resultado.vencido).toBe(false)
      // differenceInDays trunca, entao pode ser 29 ou 30 dependendo da hora
      expect(resultado.diasRestantes).toBeGreaterThanOrEqual(29)
      expect(resultado.diasRestantes).toBeLessThanOrEqual(30)
      expect(resultado.urgente).toBe(false)
    })

    it('deve retornar urgente=true quando restam 7 dias ou menos', () => {
      // 25 dias atras -> restam 5 dias
      const dataVeto = new Date('2026-03-16')
      const resultado = calcularPrazoApreciacaoVeto(dataVeto)

      // prazoFinal = 2026-04-15, diasRestantes = 5
      expect(resultado.urgente).toBe(true)
      expect(resultado.vencido).toBe(false)
      expect(resultado.diasRestantes).toBeLessThanOrEqual(7)
    })

    it('deve calcular prazoFinal como dataVeto + 30 dias corridos', () => {
      const dataVeto = new Date('2026-03-01T12:00:00')
      const resultado = calcularPrazoApreciacaoVeto(dataVeto)

      // setDate(1 + 30) = 31 de marco
      // Verifica que prazoFinal e exatamente 30 dias apos dataVeto
      const diffMs = resultado.prazoFinal.getTime() - dataVeto.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(30)
      expect(resultado.prazoFinal.getFullYear()).toBe(2026)
    })

    it('nao deve ser urgente quando restam mais de 7 dias', () => {
      // 10 dias atras -> restam 20 dias
      const dataVeto = new Date('2026-03-31')
      const resultado = calcularPrazoApreciacaoVeto(dataVeto)

      expect(resultado.urgente).toBe(false)
      expect(resultado.vencido).toBe(false)
    })
  })

  // =========================================================
  // validarApreciacaoVeto
  // =========================================================
  describe('validarApreciacaoVeto', () => {
    it('deve retornar valid=false quando votacao nao e fornecida', () => {
      const resultado = validarApreciacaoVeto('REJEITADO')

      expect(resultado.valid).toBe(false)
      expect(resultado.errors).toContain(
        'Dados da votação são obrigatórios para apreciação de veto.'
      )
    })

    it('deve retornar valid=false quando votos insuficientes para rejeitar veto', () => {
      // totalMembros=10, quorum = floor(10/2)+1 = 6
      const resultado = validarApreciacaoVeto('REJEITADO', {
        votosSim: 4,
        votosNao: 5,
        abstencoes: 1,
        totalMembros: 10
      })

      expect(resultado.valid).toBe(false)
      expect(resultado.errors.length).toBeGreaterThan(0)
      expect(resultado.errors[0]).toContain('maioria absoluta')
    })

    it('deve retornar valid=true quando votos suficientes para rejeitar veto', () => {
      // totalMembros=10, quorum = 6, votosSim = 7
      const resultado = validarApreciacaoVeto('REJEITADO', {
        votosSim: 7,
        votosNao: 2,
        abstencoes: 1,
        totalMembros: 10
      })

      expect(resultado.valid).toBe(true)
      expect(resultado.errors).toHaveLength(0)
      expect(resultado.warnings.length).toBeGreaterThan(0)
    })

    it('deve retornar valid=true quando resultado e MANTIDO (sempre valido)', () => {
      const resultado = validarApreciacaoVeto('MANTIDO', {
        votosSim: 3,
        votosNao: 7,
        abstencoes: 0,
        totalMembros: 10
      })

      expect(resultado.valid).toBe(true)
      expect(resultado.errors).toHaveLength(0)
      expect(resultado.warnings).toContain(
        'Veto mantido: o projeto será arquivado.'
      )
    })

    it('deve aceitar rejeicao quando votos atingem exatamente o quorum', () => {
      // totalMembros=9, quorum = floor(9/2)+1 = 5
      const resultado = validarApreciacaoVeto('REJEITADO', {
        votosSim: 5,
        votosNao: 3,
        abstencoes: 1,
        totalMembros: 9
      })

      expect(resultado.valid).toBe(true)
    })

    it('deve rejeitar quando votos sao um a menos que o quorum', () => {
      // totalMembros=9, quorum = 5, votosSim = 4
      const resultado = validarApreciacaoVeto('REJEITADO', {
        votosSim: 4,
        votosNao: 4,
        abstencoes: 1,
        totalMembros: 9
      })

      expect(resultado.valid).toBe(false)
    })
  })

  // =========================================================
  // validarPublicacao
  // =========================================================
  describe('validarPublicacao', () => {
    it('deve retornar errors quando diarioOficial nao e informado', () => {
      const resultado = validarPublicacao({
        diarioOficial: '',
        dataPublicacao: new Date('2026-04-10')
      })

      expect(resultado.valid).toBe(false)
      expect(resultado.errors).toContain('Nome do Diário Oficial é obrigatório.')
    })

    it('deve retornar errors quando dataPublicacao nao e informada', () => {
      const resultado = validarPublicacao({
        diarioOficial: 'Diario Oficial do Municipio',
        dataPublicacao: null as unknown as Date
      })

      expect(resultado.valid).toBe(false)
      expect(resultado.errors).toContain('Data de publicação é obrigatória.')
    })

    it('deve retornar errors quando ambos os campos estao ausentes', () => {
      const resultado = validarPublicacao({
        diarioOficial: '',
        dataPublicacao: null as unknown as Date
      })

      expect(resultado.valid).toBe(false)
      expect(resultado.errors).toHaveLength(2)
    })

    it('deve retornar valid=true com warnings sobre vigencia quando dados estao completos', () => {
      const resultado = validarPublicacao({
        diarioOficial: 'Diario Oficial do Municipio',
        dataPublicacao: new Date('2026-04-10'),
        pagina: '15',
        edicao: '1234'
      })

      expect(resultado.valid).toBe(true)
      expect(resultado.errors).toHaveLength(0)
      expect(resultado.warnings.length).toBeGreaterThan(0)
      expect(resultado.warnings[0]).toContain('vigência')
    })

    it('deve retornar valid=true mesmo sem campos opcionais (pagina, edicao)', () => {
      const resultado = validarPublicacao({
        diarioOficial: 'Diario Oficial do Municipio',
        dataPublicacao: new Date('2026-04-10')
      })

      expect(resultado.valid).toBe(true)
      expect(resultado.errors).toHaveLength(0)
    })
  })
})
