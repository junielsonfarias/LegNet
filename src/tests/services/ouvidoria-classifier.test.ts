import { describe, it, expect } from 'vitest'
import { classificarManifestacao } from '@/lib/services/ouvidoria-classifier'

describe('classificarManifestacao', () => {
  it('classifica reclamacao com palavras-chave fortes', () => {
    const r = classificarManifestacao(
      'Pessima qualidade do servico',
      'O servico foi pessimo, nao funciona, atendimento horrivel'
    )
    expect(r.tipo).toBe('RECLAMACAO')
    expect(r.confianca).toBeGreaterThanOrEqual(0.4)
  })

  it('classifica elogio', () => {
    const r = classificarManifestacao(
      'Parabens pelo atendimento',
      'Atendimento excelente, profissionais gentis. Agradeco a equipe.'
    )
    expect(r.tipo).toBe('ELOGIO')
    expect(r.confianca).toBeGreaterThanOrEqual(0.4)
  })

  it('classifica denuncia', () => {
    const r = classificarManifestacao(
      'Denuncia de irregularidade',
      'Suspeita de corrupcao e desvio de recursos no setor X'
    )
    expect(r.tipo).toBe('DENUNCIA')
    expect(r.confianca).toBeGreaterThanOrEqual(0.4)
  })

  it('classifica sugestao', () => {
    const r = classificarManifestacao(
      'Sugestao para melhoria',
      'Sugiro que voces deveriam implementar um novo sistema. Seria interessante melhorar o servico.'
    )
    expect(r.tipo).toBe('SUGESTAO')
    expect(r.confianca).toBeGreaterThanOrEqual(0.4)
  })

  it('default SOLICITACAO quando texto nao matcha', () => {
    const r = classificarManifestacao('Pergunta', 'xyz abc')
    expect(r.tipo).toBe('SOLICITACAO')
    expect(r.confianca).toBeLessThan(0.5)
  })

  it('classifica solicitacao', () => {
    const r = classificarManifestacao(
      'Pedido de informacao',
      'Gostaria de receber informacoes sobre o procedimento. Como faco para solicitar acesso?'
    )
    expect(r.tipo).toBe('SOLICITACAO')
  })
})
