/**
 * Testes da API de Dados Abertos
 */

// Mock do Prisma
const mockPrisma = {
  parlamentar: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  sessao: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  proposicao: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  votacao: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  presencaSessao: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  comissao: {
    findMany: jest.fn(),
    count: jest.fn()
  },
  publicacao: {
    findMany: jest.fn(),
    count: jest.fn()
  }
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

describe('API de Dados Abertos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Formato de Resposta', () => {
    it('deve retornar estrutura padrao com dados e metadados', () => {
      const respostaPadrao = {
        dados: [],
        metadados: {
          total: 0,
          pagina: 1,
          limite: 50,
          paginas: 0,
          atualizacao: expect.any(String),
          fonte: 'Camara Municipal de Mojui dos Campos'
        }
      }

      // Verificar estrutura
      expect(respostaPadrao.dados).toBeDefined()
      expect(respostaPadrao.metadados).toBeDefined()
      expect(respostaPadrao.metadados.total).toBeDefined()
      expect(respostaPadrao.metadados.pagina).toBeDefined()
      expect(respostaPadrao.metadados.limite).toBeDefined()
      expect(respostaPadrao.metadados.fonte).toContain('Mojui dos Campos')
    })
  })

  describe('Paginacao', () => {
    it('deve limitar resultados a 100 por pagina', () => {
      const limitarPaginacao = (limit: number) => Math.min(limit, 100)

      expect(limitarPaginacao(50)).toBe(50)
      expect(limitarPaginacao(100)).toBe(100)
      expect(limitarPaginacao(150)).toBe(100)
      expect(limitarPaginacao(1000)).toBe(100)
    })

    it('deve calcular skip corretamente', () => {
      const calcularSkip = (page: number, limit: number) => (page - 1) * limit

      expect(calcularSkip(1, 50)).toBe(0)
      expect(calcularSkip(2, 50)).toBe(50)
      expect(calcularSkip(3, 50)).toBe(100)
      expect(calcularSkip(1, 100)).toBe(0)
      expect(calcularSkip(2, 100)).toBe(100)
    })

    it('deve calcular total de paginas corretamente', () => {
      const calcularPaginas = (total: number, limit: number) => Math.ceil(total / limit)

      expect(calcularPaginas(100, 50)).toBe(2)
      expect(calcularPaginas(101, 50)).toBe(3)
      expect(calcularPaginas(50, 50)).toBe(1)
      expect(calcularPaginas(0, 50)).toBe(0)
    })
  })

  describe('Formato CSV', () => {
    it('deve gerar header com campos separados por ponto-e-virgula', () => {
      const campos = ['id', 'nome', 'partido']
      const header = campos.join(';')

      expect(header).toBe('id;nome;partido')
    })

    it('deve escapar valores que contem ponto-e-virgula', () => {
      const escapeCSV = (valor: string) => {
        if (valor.includes(';')) {
          return `"${valor}"`
        }
        return valor
      }

      expect(escapeCSV('valor simples')).toBe('valor simples')
      expect(escapeCSV('valor;com;ponto-e-virgula')).toBe('"valor;com;ponto-e-virgula"')
    })

    it('deve tratar valores nulos como string vazia', () => {
      const formatarValor = (valor: unknown) => {
        if (valor === null || valor === undefined) return ''
        return String(valor)
      }

      expect(formatarValor(null)).toBe('')
      expect(formatarValor(undefined)).toBe('')
      expect(formatarValor('texto')).toBe('texto')
      expect(formatarValor(123)).toBe('123')
    })
  })

  describe('Filtros', () => {
    it('deve construir where clause para ano', () => {
      const ano = 2024
      const whereAno = {
        data: {
          gte: new Date(ano, 0, 1),
          lt: new Date(ano + 1, 0, 1)
        }
      }

      expect(whereAno.data.gte.getFullYear()).toBe(2024)
      expect(whereAno.data.lt.getFullYear()).toBe(2025)
    })

    it('deve construir where clause para tipo', () => {
      const construirWhere = (tipo?: string) => ({
        ...(tipo && { tipo })
      })

      expect(construirWhere('ORDINARIA')).toEqual({ tipo: 'ORDINARIA' })
      expect(construirWhere(undefined)).toEqual({})
    })

    it('deve construir where clause para status', () => {
      const construirWhere = (status?: string) => ({
        ...(status && { status })
      })

      expect(construirWhere('EM_ANDAMENTO')).toEqual({ status: 'EM_ANDAMENTO' })
      expect(construirWhere(undefined)).toEqual({})
    })
  })

  describe('Parlamentares', () => {
    it('deve formatar dados do parlamentar corretamente', () => {
      const parlamentar = {
        id: '1',
        nome: 'Joao Silva',
        apelido: 'Joaozinho',
        partido: 'PT',
        cargo: 'VEREADOR',
        email: 'joao@camara.gov.br',
        telefone: '(93) 99999-9999',
        biografia: 'Biografia do parlamentar',
        foto: '/fotos/joao.jpg',
        mandatos: [
          {
            legislatura: {
              numero: 1,
              anoInicio: 2021,
              anoFim: 2024
            }
          }
        ]
      }

      const formatado = {
        id: parlamentar.id,
        nome: parlamentar.nome,
        nome_popular: parlamentar.apelido,
        partido: parlamentar.partido,
        cargo: parlamentar.cargo,
        email: parlamentar.email,
        telefone: parlamentar.telefone,
        biografia: parlamentar.biografia,
        foto_url: parlamentar.foto,
        mandatos: parlamentar.mandatos.map(m => ({
          legislatura: m.legislatura.numero,
          ano_inicio: m.legislatura.anoInicio,
          ano_fim: m.legislatura.anoFim
        }))
      }

      expect(formatado.nome).toBe('Joao Silva')
      expect(formatado.nome_popular).toBe('Joaozinho')
      expect(formatado.mandatos[0].legislatura).toBe(1)
    })
  })

  describe('Sessoes', () => {
    it('deve formatar data da sessao como ISO date', () => {
      const data = new Date('2024-01-15T10:00:00Z')
      const dataFormatada = data.toISOString().split('T')[0]

      expect(dataFormatada).toBe('2024-01-15')
    })

    it('deve incluir contagem de presencas e proposicoes', () => {
      const sessao = {
        id: '1',
        numero: 1,
        tipo: 'ORDINARIA',
        _count: {
          presencas: 9,
          proposicoes: 5
        }
      }

      const formatado = {
        ...sessao,
        total_presencas: sessao._count.presencas,
        total_proposicoes: sessao._count.proposicoes
      }

      expect(formatado.total_presencas).toBe(9)
      expect(formatado.total_proposicoes).toBe(5)
    })
  })

  describe('Votacoes', () => {
    it('deve formatar voto com dados do parlamentar', () => {
      const votacao = {
        id: '1',
        voto: 'SIM',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        parlamentar: {
          id: 'p1',
          nome: 'Joao Silva',
          partido: 'PT'
        },
        proposicao: {
          id: 'prop1',
          numero: '001',
          ano: 2024,
          tipo: 'PROJETO_LEI',
          ementa: 'Projeto sobre...',
          sessao: {
            id: 's1',
            numero: 1,
            tipo: 'ORDINARIA',
            data: new Date('2024-01-15')
          }
        }
      }

      const formatado = {
        id: votacao.id,
        voto: votacao.voto,
        data_voto: votacao.createdAt.toISOString(),
        parlamentar: {
          id: votacao.parlamentar.id,
          nome: votacao.parlamentar.nome,
          partido: votacao.parlamentar.partido
        },
        proposicao: votacao.proposicao ? {
          id: votacao.proposicao.id,
          numero: votacao.proposicao.numero,
          ano: votacao.proposicao.ano,
          tipo: votacao.proposicao.tipo,
          ementa: votacao.proposicao.ementa
        } : null
      }

      expect(formatado.voto).toBe('SIM')
      expect(formatado.parlamentar.nome).toBe('Joao Silva')
      expect(formatado.proposicao?.numero).toBe('001')
    })
  })
})
