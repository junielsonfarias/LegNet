import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatNumber,
  formatCPF,
  formatCNPJ,
  formatCPFCNPJ,
  formatTelefone,
  formatCEP,
  formatNormaRef,
  formatProposicaoRef,
  formatResultadoVotacao,
  formatQuorum,
  formatNomeProprio,
  formatPlural,
  maskCPF,
  maskCNPJ,
  maskTelefone,
  maskCEP,
  unmask
} from '@/lib/utils/format-ptbr'

describe('formatCurrency', () => {
  it('formata valor positivo', () => {
    expect(formatCurrency(1234.56)).toContain('1.234,56')
    expect(formatCurrency(1234.56)).toMatch(/^R\$/)
  })

  it('formata zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$.*0,00/)
  })

  it('formata null/undefined como R$ 0,00', () => {
    expect(formatCurrency(null)).toMatch(/R\$.*0,00/)
    expect(formatCurrency(undefined)).toMatch(/R\$.*0,00/)
    expect(formatCurrency('')).toMatch(/R\$.*0,00/)
  })

  it('formata string numerica', () => {
    expect(formatCurrency('999.99')).toContain('999,99')
  })

  it('retorna R$ 0,00 para NaN', () => {
    expect(formatCurrency('abc')).toMatch(/R\$.*0,00/)
  })
})

describe('formatCurrencyCompact', () => {
  it('formata bilhoes', () => {
    expect(formatCurrencyCompact(2_500_000_000)).toBe('R$ 2,5B')
  })

  it('formata milhoes', () => {
    expect(formatCurrencyCompact(1_200_000)).toBe('R$ 1,2M')
  })

  it('formata milhares', () => {
    expect(formatCurrencyCompact(500_000)).toBe('R$ 500,0K')
  })

  it('formata valores pequenos como currency completo', () => {
    expect(formatCurrencyCompact(999)).toMatch(/R\$.*999,00/)
  })

  it('formata null como R$ 0', () => {
    expect(formatCurrencyCompact(null)).toBe('R$ 0')
  })
})

describe('formatPercent', () => {
  it('formata percentual com 1 decimal', () => {
    expect(formatPercent(45.67)).toBe('45,7%')
  })

  it('formata com decimais customizados', () => {
    expect(formatPercent(33.3333, 2)).toBe('33,33%')
  })

  it('formata null como 0%', () => {
    expect(formatPercent(null)).toBe('0%')
  })
})

describe('formatNumber', () => {
  it('formata com separador de milhar', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('formata null como 0', () => {
    expect(formatNumber(null)).toBe('0')
  })
})

describe('formatCPF', () => {
  it('formata CPF valido', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00')
  })

  it('retorna vazio para null', () => {
    expect(formatCPF(null)).toBe('')
  })

  it('retorna original se digitos insuficientes', () => {
    expect(formatCPF('1234')).toBe('1234')
  })
})

describe('formatCNPJ', () => {
  it('formata CNPJ valido', () => {
    expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90')
  })

  it('retorna vazio para null', () => {
    expect(formatCNPJ(null)).toBe('')
  })
})

describe('formatCPFCNPJ', () => {
  it('detecta CPF automaticamente', () => {
    expect(formatCPFCNPJ('12345678900')).toBe('123.456.789-00')
  })

  it('detecta CNPJ automaticamente', () => {
    expect(formatCPFCNPJ('12345678000190')).toBe('12.345.678/0001-90')
  })

  it('retorna vazio para null', () => {
    expect(formatCPFCNPJ(null)).toBe('')
  })
})

describe('formatTelefone', () => {
  it('formata celular (11 digitos)', () => {
    expect(formatTelefone('91999998888')).toBe('(91) 99999-8888')
  })

  it('formata fixo (10 digitos)', () => {
    expect(formatTelefone('9133221100')).toBe('(91) 3322-1100')
  })

  it('retorna original se digitos invalidos', () => {
    expect(formatTelefone('123')).toBe('123')
  })

  it('retorna vazio para null', () => {
    expect(formatTelefone(null)).toBe('')
  })
})

describe('formatCEP', () => {
  it('formata CEP valido', () => {
    expect(formatCEP('68290000')).toBe('68.290-000')
  })

  it('retorna vazio para null', () => {
    expect(formatCEP(null)).toBe('')
  })
})

describe('formatNormaRef', () => {
  it('formata lei ordinaria', () => {
    expect(formatNormaRef('LEI_ORDINARIA', 1234, 2026)).toBe('Lei Ordinária nº 1.234/2026')
  })

  it('formata resolucao', () => {
    expect(formatNormaRef('RESOLUCAO', '5', 2025)).toBe('Resolução nº 5/2025')
  })

  it('usa tipo raw se desconhecido', () => {
    expect(formatNormaRef('PORTARIA', '1', 2026)).toBe('PORTARIA nº 1/2026')
  })
})

describe('formatProposicaoRef', () => {
  it('formata PL', () => {
    expect(formatProposicaoRef('PROJETO_LEI', '001', 2026)).toBe('PL 001/2026')
  })

  it('formata indicacao', () => {
    expect(formatProposicaoRef('INDICACAO', '015', 2026)).toBe('IND 015/2026')
  })

  it('usa tipo raw se desconhecido', () => {
    expect(formatProposicaoRef('OUTRO', '1', 2026)).toBe('OUTRO 1/2026')
  })
})

describe('formatResultadoVotacao', () => {
  it('formata aprovado com abstencao', () => {
    expect(formatResultadoVotacao('APROVADO', 8, 3, 1)).toBe('Aprovado por 8 votos a 3 (1 abstenção)')
  })

  it('formata rejeitado sem abstencao', () => {
    expect(formatResultadoVotacao('REJEITADO', 3, 8)).toBe('Rejeitado por 3 votos a 8')
  })

  it('plural de abstencoes', () => {
    expect(formatResultadoVotacao('APROVADO', 7, 2, 3)).toContain('3 abstenções')
  })

  it('singular de voto', () => {
    expect(formatResultadoVotacao('APROVADO', 1, 0)).toBe('Aprovado por 1 voto a 0')
  })
})

describe('formatQuorum', () => {
  it('formata quorum com percentual', () => {
    expect(formatQuorum(9, 13)).toBe('9 de 13 vereadores presentes (69,2%)')
  })

  it('formata quorum 100%', () => {
    expect(formatQuorum(13, 13)).toBe('13 de 13 vereadores presentes (100,0%)')
  })

  it('formata quorum zero', () => {
    expect(formatQuorum(0, 0)).toBe('0 de 0 vereadores presentes (0%)')
  })
})

describe('formatNomeProprio', () => {
  it('capitaliza nome completo', () => {
    // toLowerCase nao converte acentos — funcao capitaliza mas nao acentua
    expect(formatNomeProprio('JOAO DA SILVA')).toBe('Joao da Silva')
  })

  it('mantem preposicoes minusculas', () => {
    expect(formatNomeProprio('MARIA DOS SANTOS')).toBe('Maria dos Santos')
  })

  it('retorna vazio para null', () => {
    expect(formatNomeProprio(null)).toBe('')
  })

  it('primeira palavra sempre capitalizada', () => {
    expect(formatNomeProprio('DA COSTA')).toBe('Da Costa')
  })
})

describe('formatPlural', () => {
  it('singular', () => {
    expect(formatPlural(1, 'vereador', 'vereadores')).toBe('1 vereador')
  })

  it('plural', () => {
    expect(formatPlural(5, 'vereador', 'vereadores')).toBe('5 vereadores')
  })

  it('zero e plural', () => {
    expect(formatPlural(0, 'vereador', 'vereadores')).toBe('0 vereadores')
  })
})

describe('maskCPF', () => {
  it('aplica mascara progressiva', () => {
    expect(maskCPF('123')).toBe('123')
    expect(maskCPF('1234')).toBe('123.4')
    expect(maskCPF('12345678900')).toBe('123.456.789-00')
  })

  it('limita a 11 digitos', () => {
    expect(maskCPF('123456789001234')).toBe('123.456.789-00')
  })
})

describe('maskCNPJ', () => {
  it('aplica mascara completa', () => {
    expect(maskCNPJ('12345678000190')).toBe('12.345.678/0001-90')
  })
})

describe('maskTelefone', () => {
  it('mascara fixo', () => {
    expect(maskTelefone('9133221100')).toBe('(91) 3322-1100')
  })

  it('mascara celular', () => {
    expect(maskTelefone('91999998888')).toBe('(91) 99999-8888')
  })
})

describe('maskCEP', () => {
  it('aplica mascara', () => {
    expect(maskCEP('68290000')).toBe('68.290-000')
  })
})

describe('unmask', () => {
  it('remove tudo exceto digitos', () => {
    expect(unmask('123.456.789-00')).toBe('12345678900')
    expect(unmask('(91) 99999-8888')).toBe('91999998888')
    expect(unmask('R$ 1.234,56')).toBe('123456')
  })
})
