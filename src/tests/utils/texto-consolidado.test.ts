import { describe, it, expect } from 'vitest'
import {
  gerarReferenciaDispositivo,
  formatarTipoEmenda,
  gerarRelatorioAlteracoes,
  gerarDiffHtml,
  ordenarEmendasPorDispositivo,
  converterNumeroParaRomano,
  gerarTextoConsolidadoComEmendas,
  type EmendaParaConsolidacao
} from '@/lib/utils/texto-consolidado'

describe('gerarReferenciaDispositivo', () => {
  it('gera referencia completa', () => {
    const emenda: EmendaParaConsolidacao = {
      numero: '1', tipo: 'ADITIVA', textoNovo: '',
      artigo: '5', paragrafo: '2', inciso: 'III', alinea: 'a'
    }
    expect(gerarReferenciaDispositivo(emenda)).toBe('Art. 5, § 2, Inc. III, Alínea a')
  })

  it('gera referencia so com artigo', () => {
    const emenda: EmendaParaConsolidacao = { numero: '1', tipo: 'ADITIVA', textoNovo: '', artigo: '10' }
    expect(gerarReferenciaDispositivo(emenda)).toBe('Art. 10')
  })

  it('retorna Texto geral quando sem dispositivo', () => {
    const emenda: EmendaParaConsolidacao = { numero: '1', tipo: 'SUBSTITUTIVA', textoNovo: '' }
    expect(gerarReferenciaDispositivo(emenda)).toBe('Texto geral')
  })
})

describe('formatarTipoEmenda', () => {
  it('formata tipos conhecidos', () => {
    expect(formatarTipoEmenda('ADITIVA')).toBe('Aditiva')
    expect(formatarTipoEmenda('MODIFICATIVA')).toBe('Modificativa')
    expect(formatarTipoEmenda('SUPRESSIVA')).toBe('Supressiva')
    expect(formatarTipoEmenda('SUBSTITUTIVA')).toBe('Substitutiva')
    expect(formatarTipoEmenda('EMENDA_DE_REDACAO')).toBe('De Redação')
  })

  it('retorna tipo raw se desconhecido', () => {
    expect(formatarTipoEmenda('OUTRO')).toBe('OUTRO')
  })
})

describe('converterNumeroParaRomano', () => {
  it('converte numeros simples', () => {
    expect(converterNumeroParaRomano(1)).toBe('I')
    expect(converterNumeroParaRomano(5)).toBe('V')
    expect(converterNumeroParaRomano(10)).toBe('X')
  })

  it('converte numeros compostos', () => {
    expect(converterNumeroParaRomano(4)).toBe('IV')
    expect(converterNumeroParaRomano(9)).toBe('IX')
    expect(converterNumeroParaRomano(14)).toBe('XIV')
    expect(converterNumeroParaRomano(49)).toBe('XLIX')
  })

  it('converte numeros grandes', () => {
    expect(converterNumeroParaRomano(2024)).toBe('MMXXIV')
    expect(converterNumeroParaRomano(1999)).toBe('MCMXCIX')
  })

  it('retorna vazio para zero ou negativo', () => {
    expect(converterNumeroParaRomano(0)).toBe('')
    expect(converterNumeroParaRomano(-1)).toBe('')
  })
})

describe('gerarRelatorioAlteracoes', () => {
  it('retorna mensagem para lista vazia', () => {
    expect(gerarRelatorioAlteracoes([])).toBe('Nenhuma emenda aprovada.')
  })

  it('gera relatorio com emendas', () => {
    const emendas: EmendaParaConsolidacao[] = [
      { numero: '1', tipo: 'ADITIVA', artigo: '5', textoNovo: 'Novo paragrafo', textoOriginal: '' },
      { numero: '2', tipo: 'SUPRESSIVA', artigo: '10', textoNovo: '', textoOriginal: 'Texto suprimido' }
    ]
    const relatorio = gerarRelatorioAlteracoes(emendas)

    expect(relatorio).toContain('Total de emendas aprovadas: 2')
    expect(relatorio).toContain('Emenda 1 (Aditiva)')
    expect(relatorio).toContain('Emenda 2 (Supressiva)')
    expect(relatorio).toContain('Dispositivo suprimido.')
    expect(relatorio).toContain('Texto Novo:')
  })
})

describe('gerarDiffHtml', () => {
  it('marca texto adicionado quando original vazio', () => {
    const diff = gerarDiffHtml('', 'Novo texto')
    expect(diff).toContain('<ins')
    expect(diff).toContain('Novo texto')
  })

  it('marca texto removido quando novo vazio', () => {
    const diff = gerarDiffHtml('Texto antigo', '')
    expect(diff).toContain('<del')
    expect(diff).toContain('Texto antigo')
  })

  it('preserva palavras iguais', () => {
    const diff = gerarDiffHtml('A B C', 'A B C')
    expect(diff).not.toContain('<ins')
    expect(diff).not.toContain('<del')
    expect(diff.trim()).toBe('A B C')
  })
})

describe('ordenarEmendasPorDispositivo', () => {
  it('ordena por artigo crescente', () => {
    const emendas: EmendaParaConsolidacao[] = [
      { numero: '1', tipo: 'ADITIVA', artigo: '10', textoNovo: '' },
      { numero: '2', tipo: 'ADITIVA', artigo: '1', textoNovo: '' },
      { numero: '3', tipo: 'ADITIVA', artigo: '5', textoNovo: '' }
    ]
    const ordenadas = ordenarEmendasPorDispositivo(emendas)
    expect(ordenadas.map(e => e.artigo)).toEqual(['1', '5', '10'])
  })

  it('ordena por paragrafo dentro do mesmo artigo', () => {
    const emendas: EmendaParaConsolidacao[] = [
      { numero: '1', tipo: 'ADITIVA', artigo: '5', paragrafo: '3', textoNovo: '' },
      { numero: '2', tipo: 'ADITIVA', artigo: '5', paragrafo: '1', textoNovo: '' }
    ]
    const ordenadas = ordenarEmendasPorDispositivo(emendas)
    expect(ordenadas.map(e => e.paragrafo)).toEqual(['1', '3'])
  })

  it('ordena por inciso romano', () => {
    const emendas: EmendaParaConsolidacao[] = [
      { numero: '1', tipo: 'ADITIVA', artigo: '1', inciso: 'V', textoNovo: '' },
      { numero: '2', tipo: 'ADITIVA', artigo: '1', inciso: 'II', textoNovo: '' },
      { numero: '3', tipo: 'ADITIVA', artigo: '1', inciso: 'IX', textoNovo: '' }
    ]
    const ordenadas = ordenarEmendasPorDispositivo(emendas)
    expect(ordenadas.map(e => e.inciso)).toEqual(['II', 'V', 'IX'])
  })

  it('nao modifica array original', () => {
    const emendas: EmendaParaConsolidacao[] = [
      { numero: '1', tipo: 'ADITIVA', artigo: '10', textoNovo: '' },
      { numero: '2', tipo: 'ADITIVA', artigo: '1', textoNovo: '' }
    ]
    ordenarEmendasPorDispositivo(emendas)
    expect(emendas[0].artigo).toBe('10')
  })
})

describe('gerarTextoConsolidadoComEmendas', () => {
  const textoBase = 'Art. 1 - Texto original do artigo primeiro.\nArt. 2 - Texto do segundo artigo.'

  it('aplica emenda substitutiva (substitui tudo)', () => {
    const emendas: EmendaParaConsolidacao[] = [
      { numero: '1', tipo: 'SUBSTITUTIVA', textoNovo: 'Texto completamente novo.' }
    ]
    const result = gerarTextoConsolidadoComEmendas(textoBase, emendas)
    expect(result.textoConsolidado).toBe('Texto completamente novo.')
    expect(result.alteracoes).toHaveLength(1)
    expect(result.alteracoes[0].descricao).toBe('Texto integralmente substituído')
  })

  it('aplica emenda modificativa', () => {
    const emendas: EmendaParaConsolidacao[] = [
      {
        numero: '1', tipo: 'MODIFICATIVA', artigo: '1',
        textoOriginal: 'Texto original do artigo primeiro.',
        textoNovo: 'Texto MODIFICADO do artigo primeiro.'
      }
    ]
    const result = gerarTextoConsolidadoComEmendas(textoBase, emendas)
    expect(result.textoConsolidado).toContain('Texto MODIFICADO do artigo primeiro.')
    expect(result.textoConsolidado).not.toContain('Texto original do artigo primeiro.')
  })

  it('aplica emenda supressiva', () => {
    const emendas: EmendaParaConsolidacao[] = [
      {
        numero: '1', tipo: 'SUPRESSIVA', artigo: '2',
        textoOriginal: 'Art. 2 - Texto do segundo artigo.',
        textoNovo: ''
      }
    ]
    const result = gerarTextoConsolidadoComEmendas(textoBase, emendas)
    expect(result.textoConsolidado).not.toContain('Art. 2')
    expect(result.alteracoes[0].descricao).toBe('Dispositivo suprimido')
  })

  it('aplica emenda aditiva no local do texto referenciado', () => {
    const emendas: EmendaParaConsolidacao[] = [
      {
        numero: '1', tipo: 'ADITIVA', artigo: '1',
        textoOriginal: 'Texto original do artigo primeiro.',
        textoNovo: 'Paragrafo unico - Texto adicionado.'
      }
    ]
    const result = gerarTextoConsolidadoComEmendas(textoBase, emendas)
    expect(result.textoConsolidado).toContain('Paragrafo unico - Texto adicionado.')
    expect(result.alteracoes[0].descricao).toBe('Novo dispositivo adicionado')
  })

  it('aplica emenda aditiva ao final quando texto original nao encontrado', () => {
    const emendas: EmendaParaConsolidacao[] = [
      { numero: '1', tipo: 'ADITIVA', artigo: '99', textoNovo: 'Art. 99 - Novo artigo.' }
    ]
    const result = gerarTextoConsolidadoComEmendas(textoBase, emendas)
    expect(result.textoConsolidado).toContain('Art. 99 - Novo artigo.')
  })

  it('retorna texto inalterado quando emendas vazias', () => {
    const result = gerarTextoConsolidadoComEmendas(textoBase, [])
    expect(result.textoConsolidado).toBe(textoBase)
    expect(result.alteracoes).toHaveLength(0)
  })

  it('ignora outras emendas quando ha substitutiva', () => {
    const emendas: EmendaParaConsolidacao[] = [
      { numero: '1', tipo: 'SUBSTITUTIVA', textoNovo: 'Texto novo.' },
      { numero: '2', tipo: 'ADITIVA', artigo: '1', textoOriginal: 'x', textoNovo: 'Ignorada' }
    ]
    const result = gerarTextoConsolidadoComEmendas(textoBase, emendas)
    expect(result.textoConsolidado).toBe('Texto novo.')
    expect(result.alteracoes).toHaveLength(1)
  })
})
