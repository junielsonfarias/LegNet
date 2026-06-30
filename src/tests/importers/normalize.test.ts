import { describe, expect, it } from 'vitest'

import {
  clean,
  toBool,
  parseBubbleDate,
  parseDecimal,
  normalizeName,
  parseLegislatura,
  extractYear,
  extractOrdinal,
  splitNumeroAno,
  isPlaceholderDeclaracao,
  splitMulti,
  parseBubbleRichText,
} from '../../../prisma/importers/lib/normalize'
import { parseCsvString } from '../../../prisma/importers/lib/csv'

// Cobre os casos-limite reais encontrados na migração do backup CR2/WordPress.
describe('importers/normalize', () => {
  describe('clean', () => {
    it('trata vazios, asteriscos e traços como null', () => {
      expect(clean('')).toBeNull()
      expect(clean('   ')).toBeNull()
      expect(clean('***')).toBeNull()
      expect(clean('*****')).toBeNull() // placeholder mascarado da CR2
      expect(clean('---')).toBeNull()
      expect(clean(null)).toBeNull()
      expect(clean('  texto  ')).toBe('texto')
    })
  })

  describe('toBool', () => {
    it('mapeia sim/true/1 → true', () => {
      expect(toBool('sim')).toBe(true)
      expect(toBool('Sim')).toBe(true)
      expect(toBool('true')).toBe(true)
      expect(toBool('1')).toBe(true)
      expect(toBool('não')).toBe(false)
      expect(toBool('')).toBe(false)
      expect(toBool(undefined)).toBe(false)
    })
  })

  describe('parseBubbleDate', () => {
    it('parseia o formato Bubble en-US', () => {
      const d = parseBubbleDate('Jan 28, 2025 1:24 pm')
      expect(d).not.toBeNull()
      expect(d!.getFullYear()).toBe(2025)
      expect(d!.getMonth()).toBe(0)
      expect(d!.getDate()).toBe(28)
    })
    it('parseia só data (sem hora)', () => {
      const d = parseBubbleDate('Dec 29, 2021')
      expect(d!.getFullYear()).toBe(2021)
      expect(d!.getMonth()).toBe(11)
    })
    it('retorna null para inválido/vazio', () => {
      expect(parseBubbleDate('')).toBeNull()
      expect(parseBubbleDate('data qualquer')).toBeNull()
      expect(parseBubbleDate('***')).toBeNull()
    })
  })

  describe('parseDecimal', () => {
    it('aceita inteiro simples', () => {
      expect(parseDecimal('216000')).toBe(216000)
    })
    it('aceita formato BR (ponto milhar, vírgula decimal)', () => {
      expect(parseDecimal('1.320,50')).toBe(1320.5)
    })
    it('aceita vírgula decimal', () => {
      expect(parseDecimal('264,00')).toBe(264)
    })
    it('remove símbolos de moeda', () => {
      expect(parseDecimal('R$ 1.000,00')).toBe(1000)
    })
    it('retorna null para vazio', () => {
      expect(parseDecimal('')).toBeNull()
      expect(parseDecimal('***')).toBeNull()
    })
  })

  describe('splitNumeroAno (bug de número concatenado)', () => {
    it('separa "437/2025" em 437 e 2025 (não "4372025")', () => {
      expect(splitNumeroAno('437/2025')).toEqual({ numero: '437', ano: 2025 })
    })
    it('aceita hífen e underscore', () => {
      expect(splitNumeroAno('003-2025')).toEqual({ numero: '003', ano: 2025 })
      expect(splitNumeroAno('62025').numero).toBe('62025') // sem separador → número cru
    })
    it('extrai de nome de arquivo', () => {
      expect(splitNumeroAno('REQUERIMENTO-001-2017.pdf')).toEqual({ numero: '001', ano: 2017 })
    })
    it('retorna null para vazio', () => {
      expect(splitNumeroAno('')).toEqual({ numero: null, ano: null })
    })
  })

  describe('isPlaceholderDeclaracao', () => {
    it('detecta declarações de ausência', () => {
      expect(isPlaceholderDeclaracao('Declaração: Não houve Decreto em Janeiro')).toBe(true)
      expect(isPlaceholderDeclaracao('Declaramos que não houveram novos Projetos de Lei')).toBe(true)
      expect(isPlaceholderDeclaracao('Não houve registros')).toBe(true)
    })
    it('não marca conteúdo real', () => {
      expect(isPlaceholderDeclaracao('Requer aquisição de ambulância')).toBe(false)
      expect(isPlaceholderDeclaracao('')).toBe(false)
    })
  })

  describe('normalizeName', () => {
    it('remove acentos e normaliza caixa/espaços', () => {
      expect(normalizeName('José Orlando  Pinho')).toBe('jose orlando pinho')
      expect(normalizeName('MARIA RAIMUNDA')).toBe('maria raimunda')
    })
  })

  describe('parseLegislatura', () => {
    it('extrai anos de "(2025 - 2028)"', () => {
      expect(parseLegislatura('(2025 - 2028)')).toEqual({ anoInicio: 2025, anoFim: 2028 })
    })
    it('retorna null sem padrão', () => {
      expect(parseLegislatura('Trajetória Política')).toBeNull()
    })
  })

  describe('extractYear / extractOrdinal', () => {
    it('extractYear pega o ano', () => {
      expect(extractYear('LEI Nº 001/1977')).toBe(1977)
      expect(extractYear('sem ano')).toBeNull()
    })
    it('extractOrdinal pega o número ordinal da sessão', () => {
      expect(extractOrdinal('1ª Sessão Extraordinária')).toBe(1)
      expect(extractOrdinal('40ª Sessão Ordinária')).toBe(40)
    })
  })

  describe('splitMulti', () => {
    it('separa por " , " e quebras de linha', () => {
      expect(splitMulti('Ana , Bruno , Carlos')).toEqual(['Ana', 'Bruno', 'Carlos'])
      expect(splitMulti('')).toEqual([])
    })
  })

  describe('parseBubbleRichText (BBCode)', () => {
    it('extrai links e texto', () => {
      const r = parseBubbleRichText('[ml][ul][li][url=https://x.com/a.pdf]Clique aqui[/url][/li][/ul][/ml]')
      expect(r.links).toContain('https://x.com/a.pdf')
      expect(r.texto).toContain('Clique aqui')
    })
  })
})

describe('importers/csv', () => {
  it('parseia células com aspas, vírgulas e quebras de linha embutidas', () => {
    const csv = 'a,b\n"linha 1, com vírgula","texto\ncom quebra"\n"x","y"'
    const rows = parseCsvString(csv)
    expect(rows.length).toBe(3) // header + 2 registros
    expect(rows[1][0]).toBe('linha 1, com vírgula')
    expect(rows[1][1]).toBe('texto\ncom quebra')
    expect(rows[2]).toEqual(['x', 'y'])
  })

  it('trata aspas duplas escapadas', () => {
    const rows = parseCsvString('h\n"diz ""olá"" aqui"')
    expect(rows[1][0]).toBe('diz "olá" aqui')
  })
})
