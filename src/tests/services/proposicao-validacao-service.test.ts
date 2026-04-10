/**
 * Testes unitarios para proposicao-validacao-service
 * Testa funcoes puras: validarRequisitosMinimos, validarTransicaoStatus, determinarTipoAcaoPauta
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    proposicao: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0)
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

import {
  validarRequisitosMinimos,
  validarTransicaoStatus,
  determinarTipoAcaoPauta
} from '@/lib/services/proposicao-validacao-service'

// ============================================================
// validarRequisitosMinimos
// ============================================================

describe('validarRequisitosMinimos', () => {
  const baseInput = {
    tipo: 'INDICACAO',
    ementa: 'Indicacao para pavimentacao da rua principal do bairro centro',
    justificativa: 'Esta indicacao se justifica pela necessidade urgente de melhorias na infraestrutura viaria do municipio',
    autorId: 'autor-123',
    autorTipo: 'PARLAMENTAR' as const
  }

  it('deve retornar valid=true quando todos os campos obrigatorios estao preenchidos (tipo simples)', () => {
    const resultado = validarRequisitosMinimos(baseInput)

    expect(resultado.valid).toBe(true)
    expect(resultado.errors).toHaveLength(0)
    expect(resultado.rule).toBe('RN-022')
  })

  it('deve retornar erro quando ementa esta ausente', () => {
    const resultado = validarRequisitosMinimos({
      ...baseInput,
      ementa: undefined
    })

    expect(resultado.valid).toBe(false)
    expect(resultado.errors.length).toBeGreaterThan(0)
    expect(resultado.errors[0]).toContain('Ementa')
  })

  it('deve retornar erro quando ementa tem menos de 10 caracteres', () => {
    const resultado = validarRequisitosMinimos({
      ...baseInput,
      ementa: 'Curta'
    })

    expect(resultado.valid).toBe(false)
    expect(resultado.errors.some(e => e.includes('10 caracteres'))).toBe(true)
  })

  it('deve retornar erro quando autorId esta ausente', () => {
    const resultado = validarRequisitosMinimos({
      ...baseInput,
      autorId: ''
    })

    expect(resultado.valid).toBe(false)
    expect(resultado.errors.some(e => e.includes('autor'))).toBe(true)
  })

  it('deve exigir justificativa com pelo menos 50 caracteres para PROJETO_LEI', () => {
    const resultado = validarRequisitosMinimos({
      ...baseInput,
      tipo: 'PROJETO_LEI',
      justificativa: 'Justificativa curta'
    })

    expect(resultado.valid).toBe(false)
    expect(resultado.errors.some(e => e.includes('Justificativa') && e.includes('50 caracteres'))).toBe(true)
  })

  it('deve exigir texto articulado para PROJETO_LEI', () => {
    const resultado = validarRequisitosMinimos({
      ...baseInput,
      tipo: 'PROJETO_LEI',
      justificativa: 'Esta justificativa tem mais de cinquenta caracteres para atender ao requisito minimo exigido pela regra de negocio',
      texto: undefined
    })

    expect(resultado.valid).toBe(false)
    expect(resultado.errors.some(e => e.includes('Texto articulado'))).toBe(true)
  })

  it('deve retornar valid=true para PROJETO_LEI com todos os campos preenchidos corretamente', () => {
    const textoArticulado = 'Art. 1o - Fica instituido o programa de pavimentacao das vias publicas do municipio. ' +
      'Art. 2o - O programa sera executado em etapas conforme disponibilidade orcamentaria. ' +
      'Art. 3o - Esta lei entra em vigor na data de sua publicacao.'

    const resultado = validarRequisitosMinimos({
      ...baseInput,
      tipo: 'PROJETO_LEI',
      justificativa: 'Esta justificativa tem mais de cinquenta caracteres para atender ao requisito minimo exigido pela regra de negocio',
      texto: textoArticulado
    })

    expect(resultado.valid).toBe(true)
    expect(resultado.errors).toHaveLength(0)
  })

  it('deve gerar warning quando texto de projeto nao contem artigos', () => {
    const resultado = validarRequisitosMinimos({
      ...baseInput,
      tipo: 'PROJETO_LEI',
      justificativa: 'Esta justificativa tem mais de cinquenta caracteres para atender ao requisito minimo exigido pela regra de negocio',
      texto: 'Este texto nao possui estrutura legislativa adequada mas tem mais de cem caracteres para passar na validacao de tamanho minimo exigido pelo sistema de validacao'
    })

    expect(resultado.warnings.some(w => w.includes('artigos'))).toBe(true)
  })

  it('nao deve exigir justificativa longa para INDICACAO', () => {
    const resultado = validarRequisitosMinimos({
      ...baseInput,
      tipo: 'INDICACAO',
      justificativa: 'Breve'
    })

    // INDICACAO nao esta em tiposComJustificativa, entao nao exige 50 chars
    expect(resultado.errors.some(e => e.includes('Justificativa'))).toBe(false)
  })
})

// ============================================================
// validarTransicaoStatus
// ============================================================

describe('validarTransicaoStatus', () => {
  it('deve permitir transicao APRESENTADA -> EM_TRAMITACAO', () => {
    const resultado = validarTransicaoStatus('APRESENTADA', 'EM_TRAMITACAO')

    expect(resultado.valid).toBe(true)
    expect(resultado.errors).toHaveLength(0)
    expect(resultado.rule).toBe('TRANSICAO_STATUS')
  })

  it('deve permitir transicao EM_TRAMITACAO -> AGUARDANDO_PAUTA', () => {
    const resultado = validarTransicaoStatus('EM_TRAMITACAO', 'AGUARDANDO_PAUTA')

    expect(resultado.valid).toBe(true)
    expect(resultado.errors).toHaveLength(0)
  })

  it('deve permitir transicao EM_VOTACAO -> APROVADA', () => {
    const resultado = validarTransicaoStatus('EM_VOTACAO', 'APROVADA')

    expect(resultado.valid).toBe(true)
  })

  it('deve permitir transicao EM_VOTACAO -> REJEITADA', () => {
    const resultado = validarTransicaoStatus('EM_VOTACAO', 'REJEITADA')

    expect(resultado.valid).toBe(true)
  })

  it('deve rejeitar transicao APRESENTADA -> APROVADA (pula etapas)', () => {
    const resultado = validarTransicaoStatus('APRESENTADA', 'APROVADA')

    expect(resultado.valid).toBe(false)
    expect(resultado.errors.length).toBeGreaterThan(0)
    expect(resultado.errors[0]).toContain('inválida')
  })

  it('deve rejeitar transicao REJEITADA -> APROVADA', () => {
    const resultado = validarTransicaoStatus('REJEITADA', 'APROVADA')

    expect(resultado.valid).toBe(false)
  })

  it('deve rejeitar qualquer transicao a partir de PROMULGADA (estado final)', () => {
    const resultado = validarTransicaoStatus('PROMULGADA', 'ARQUIVADA')

    expect(resultado.valid).toBe(false)
    expect(resultado.errors[0]).toContain('nenhuma')
  })

  it('deve rejeitar qualquer transicao a partir de ARQUIVADA (estado final)', () => {
    const resultado = validarTransicaoStatus('ARQUIVADA', 'APRESENTADA')

    expect(resultado.valid).toBe(false)
  })

  it('deve permitir transicao VETADA -> APROVADA (derrubada de veto)', () => {
    const resultado = validarTransicaoStatus('VETADA', 'APROVADA')

    expect(resultado.valid).toBe(true)
  })

  it('deve permitir transicao APROVADA -> SANCIONADA', () => {
    const resultado = validarTransicaoStatus('APROVADA', 'SANCIONADA')

    expect(resultado.valid).toBe(true)
  })

  it('deve listar transicoes permitidas na mensagem de erro', () => {
    const resultado = validarTransicaoStatus('APRESENTADA', 'PROMULGADA')

    expect(resultado.valid).toBe(false)
    expect(resultado.errors[0]).toContain('EM_TRAMITACAO')
    expect(resultado.errors[0]).toContain('AGUARDANDO_PAUTA')
    expect(resultado.errors[0]).toContain('ARQUIVADA')
  })
})

// ============================================================
// determinarTipoAcaoPauta
// ============================================================

describe('determinarTipoAcaoPauta', () => {
  it('deve retornar VOTACAO para PROJETO_LEI na ORDEM_DO_DIA', () => {
    const resultado = determinarTipoAcaoPauta('PROJETO_LEI', 'ORDEM_DO_DIA')

    expect(resultado).toBe('VOTACAO')
  })

  it('deve retornar LEITURA para PROJETO_LEI no EXPEDIENTE', () => {
    const resultado = determinarTipoAcaoPauta('PROJETO_LEI', 'EXPEDIENTE')

    expect(resultado).toBe('LEITURA')
  })

  it('deve retornar HOMENAGEM para VOTO_PESAR', () => {
    const resultado = determinarTipoAcaoPauta('VOTO_PESAR', 'HONRAS')

    expect(resultado).toBe('HOMENAGEM')
  })

  it('deve retornar HOMENAGEM para VOTO_APLAUSO', () => {
    const resultado = determinarTipoAcaoPauta('VOTO_APLAUSO', 'HONRAS')

    expect(resultado).toBe('HOMENAGEM')
  })

  it('deve retornar LEITURA para INDICACAO no EXPEDIENTE', () => {
    const resultado = determinarTipoAcaoPauta('INDICACAO', 'EXPEDIENTE')

    expect(resultado).toBe('LEITURA')
  })

  it('deve retornar COMUNICADO para INDICACAO fora do EXPEDIENTE', () => {
    const resultado = determinarTipoAcaoPauta('INDICACAO', 'ORDEM_DO_DIA')

    expect(resultado).toBe('COMUNICADO')
  })

  it('deve retornar LEITURA quando isPrimeiraLeitura=true e secao=EXPEDIENTE', () => {
    const resultado = determinarTipoAcaoPauta('PROJETO_LEI', 'EXPEDIENTE', true)

    expect(resultado).toBe('LEITURA')
  })

  it('deve retornar VOTACAO para REQUERIMENTO na ORDEM_DO_DIA', () => {
    const resultado = determinarTipoAcaoPauta('REQUERIMENTO', 'ORDEM_DO_DIA')

    expect(resultado).toBe('VOTACAO')
  })

  it('deve retornar VOTACAO para MOCAO na ORDEM_DO_DIA', () => {
    const resultado = determinarTipoAcaoPauta('MOCAO', 'ORDEM_DO_DIA')

    expect(resultado).toBe('VOTACAO')
  })

  it('deve retornar LEITURA para tipo desconhecido', () => {
    const resultado = determinarTipoAcaoPauta('TIPO_INEXISTENTE', 'ORDEM_DO_DIA')

    expect(resultado).toBe('LEITURA')
  })
})
