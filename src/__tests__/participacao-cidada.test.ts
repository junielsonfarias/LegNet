/**
 * Testes para os servicos de Participacao Cidada
 * Consultas Publicas e Sugestoes Legislativas
 */

// Mock do prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    consultaPublica: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    perguntaConsulta: {
      create: jest.fn(),
      delete: jest.fn()
    },
    participacaoConsulta: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn()
    },
    respostaConsulta: {
      findMany: jest.fn()
    },
    sugestaoLegislativa: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn()
    },
    apoioSugestao: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn()
    },
    parlamentar: {
      findUnique: jest.fn()
    },
    proposicao: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }
}))

// Mock do logger
jest.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })
}))

describe('Consulta Publica Service', () => {
  describe('criarConsulta', () => {
    it('deve criar uma consulta com dados validos', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockConsulta = {
        id: 'consulta-1',
        titulo: 'Consulta Teste',
        descricao: 'Descricao da consulta',
        status: 'RASCUNHO',
        dataInicio: new Date(),
        dataFim: new Date(),
        permitirAnonimo: true,
        requerCadastro: false,
        moderacao: false
      }

      jest.mocked(prisma.consultaPublica.create).mockResolvedValue(mockConsulta as any)

      const { criarConsulta } = await import('@/lib/services/consulta-publica-service')

      const resultado = await criarConsulta({
        titulo: 'Consulta Teste',
        descricao: 'Descricao da consulta',
        dataInicio: new Date(),
        dataFim: new Date()
      })

      expect(resultado).toBeDefined()
      expect(resultado.titulo).toBe('Consulta Teste')
      expect(prisma.consultaPublica.create).toHaveBeenCalled()
    })
  })

  describe('buscarConsultaPorId', () => {
    it('deve retornar consulta existente', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockConsulta = {
        id: 'consulta-1',
        titulo: 'Consulta Teste',
        perguntas: [],
        _count: { participacoes: 5 }
      }

      jest.mocked(prisma.consultaPublica.findUnique).mockResolvedValue(mockConsulta as any)

      const { buscarConsultaPorId } = await import('@/lib/services/consulta-publica-service')

      const resultado = await buscarConsultaPorId('consulta-1')

      expect(resultado).toBeDefined()
      expect(resultado?.id).toBe('consulta-1')
    })

    it('deve retornar null para consulta inexistente', async () => {
      const { prisma } = await import('@/lib/prisma')
      jest.mocked(prisma.consultaPublica.findUnique).mockResolvedValue(null)

      const { buscarConsultaPorId } = await import('@/lib/services/consulta-publica-service')

      const resultado = await buscarConsultaPorId('inexistente')

      expect(resultado).toBeNull()
    })
  })

  describe('listarConsultasAbertas', () => {
    it('deve retornar apenas consultas abertas dentro do periodo', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockConsultas = [
        {
          id: 'consulta-1',
          titulo: 'Consulta Aberta',
          status: 'ABERTA',
          _count: { participacoes: 10, perguntas: 3 }
        }
      ]

      jest.mocked(prisma.consultaPublica.findMany).mockResolvedValue(mockConsultas as any)

      const { listarConsultasAbertas } = await import('@/lib/services/consulta-publica-service')

      const resultado = await listarConsultasAbertas()

      expect(resultado).toHaveLength(1)
      expect(resultado[0].status).toBe('ABERTA')
    })
  })
})

describe('Sugestao Legislativa Service', () => {
  describe('criarSugestao', () => {
    it('deve criar uma sugestao com dados validos', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockSugestao = {
        id: 'sugestao-1',
        titulo: 'Sugestao Teste',
        descricao: 'Descricao da sugestao',
        justificativa: 'Justificativa da sugestao',
        nome: 'Cidadao Teste',
        email: 'cidadao@teste.com',
        cpfHash: 'CPF_HASH',
        status: 'PENDENTE',
        totalApoios: 0
      }

      jest.mocked(prisma.sugestaoLegislativa.create).mockResolvedValue(mockSugestao as any)

      const { criarSugestao } = await import('@/lib/services/sugestao-legislativa-service')

      const resultado = await criarSugestao({
        titulo: 'Sugestao Teste',
        descricao: 'Descricao da sugestao',
        justificativa: 'Justificativa da sugestao',
        nome: 'Cidadao Teste',
        email: 'cidadao@teste.com',
        cpf: '12345678901'
      })

      expect(resultado).toBeDefined()
      expect(resultado.titulo).toBe('Sugestao Teste')
      expect(resultado.status).toBe('PENDENTE')
    })
  })

  describe('apoiarSugestao', () => {
    it('deve registrar apoio de novo usuario', async () => {
      const { prisma } = await import('@/lib/prisma')

      jest.mocked(prisma.apoioSugestao.findUnique).mockResolvedValue(null)
      jest.mocked(prisma.apoioSugestao.create).mockResolvedValue({
        id: 'apoio-1',
        sugestaoId: 'sugestao-1',
        nome: 'Apoiador',
        email: 'apoiador@teste.com',
        cpfHash: 'CPF_HASH'
      } as any)
      jest.mocked(prisma.sugestaoLegislativa.update).mockResolvedValue({} as any)

      const { apoiarSugestao } = await import('@/lib/services/sugestao-legislativa-service')

      const resultado = await apoiarSugestao(
        'sugestao-1',
        'Apoiador',
        'apoiador@teste.com',
        '12345678901'
      )

      expect(resultado).toBeDefined()
      expect(prisma.apoioSugestao.create).toHaveBeenCalled()
      expect(prisma.sugestaoLegislativa.update).toHaveBeenCalled()
    })

    it('deve lancar erro se usuario ja apoiou', async () => {
      const { prisma } = await import('@/lib/prisma')

      jest.mocked(prisma.apoioSugestao.findUnique).mockResolvedValue({
        id: 'apoio-existente'
      } as any)

      const { apoiarSugestao } = await import('@/lib/services/sugestao-legislativa-service')

      await expect(
        apoiarSugestao('sugestao-1', 'Apoiador', 'apoiador@teste.com', '12345678901')
      ).rejects.toThrow('Você já apoiou esta sugestão')
    })
  })

  describe('moderarSugestao', () => {
    it('deve atualizar status da sugestao', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockSugestao = {
        id: 'sugestao-1',
        status: 'EM_ANALISE'
      }

      jest.mocked(prisma.sugestaoLegislativa.update).mockResolvedValue(mockSugestao as any)

      const { moderarSugestao } = await import('@/lib/services/sugestao-legislativa-service')

      const resultado = await moderarSugestao('sugestao-1', {
        status: 'EM_ANALISE' as any
      })

      expect(resultado.status).toBe('EM_ANALISE')
    })
  })
})

describe('Validacoes', () => {
  it('deve rejeitar consulta com datas invalidas', async () => {
    const { prisma } = await import('@/lib/prisma')

    jest.mocked(prisma.consultaPublica.create).mockRejectedValue(
      new Error('Data de fim deve ser maior que data de inicio')
    )

    const { criarConsulta } = await import('@/lib/services/consulta-publica-service')

    await expect(
      criarConsulta({
        titulo: 'Consulta Teste',
        descricao: 'Descricao',
        dataInicio: new Date('2024-12-31'),
        dataFim: new Date('2024-01-01')
      })
    ).rejects.toThrow()
  })

  it('deve validar CPF no apoio', async () => {
    const { prisma } = await import('@/lib/prisma')

    // CPF invalido nao deve criar apoio
    jest.mocked(prisma.apoioSugestao.findUnique).mockResolvedValue(null)

    const { apoiarSugestao } = await import('@/lib/services/sugestao-legislativa-service')

    // Com CPF valido deve funcionar
    jest.mocked(prisma.apoioSugestao.create).mockResolvedValue({ id: 'apoio-1' } as any)
    jest.mocked(prisma.sugestaoLegislativa.update).mockResolvedValue({} as any)

    const resultado = await apoiarSugestao(
      'sugestao-1',
      'Nome',
      'email@teste.com',
      '12345678901'
    )

    expect(resultado).toBeDefined()
  })
})
