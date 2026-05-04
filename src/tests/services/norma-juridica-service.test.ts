import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    normaJuridica: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0)
    },
    versaoNorma: {
      create: vi.fn(),
      findFirst: vi.fn()
    }
  }
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

import { prisma as _prisma } from '@/lib/prisma'
import { criarNorma, buscarNormaPorIdentificacao } from '@/lib/services/norma-juridica-service'

const prisma = _prisma as any

describe('criarNorma (Sprint 6 - Normas Juridicas)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.normaJuridica.create.mockResolvedValue({ id: 'n1', tipo: 'LEI_ORGANICA', numero: 1, ano: 1990 })
    prisma.versaoNorma.create.mockResolvedValue({ id: 'v1', versao: 1 })
  })

  it('cria Lei Organica Municipal vigente com versao 1', async () => {
    await criarNorma({
      tipo: 'LEI_ORGANICA',
      numero: 1,
      ano: 1990,
      data: new Date('1990-04-05'),
      ementa: 'Lei Orgânica do Município',
      texto: 'Art. 1º - O Município...'
    })

    expect(prisma.normaJuridica.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'LEI_ORGANICA',
          numero: 1,
          ano: 1990,
          situacao: 'VIGENTE'
        })
      })
    )
    expect(prisma.versaoNorma.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ versao: 1, motivoAlteracao: 'Versão original' })
      })
    )
  })

  it('cria Codigo de Etica (novo tipo Sprint 6)', async () => {
    prisma.normaJuridica.create.mockResolvedValue({
      id: 'n2',
      tipo: 'CODIGO_ETICA',
      numero: 1,
      ano: 2020
    })

    const norma = await criarNorma({
      tipo: 'CODIGO_ETICA',
      numero: 1,
      ano: 2020,
      data: new Date('2020-06-15'),
      ementa: 'Código de Ética e Decoro Parlamentar',
      texto: 'Capítulo I - Dos princípios...'
    })

    expect(norma.tipo).toBe('CODIGO_ETICA')
    expect(prisma.normaJuridica.create).toHaveBeenCalled()
  })

  it('cria Regimento Interno', async () => {
    prisma.normaJuridica.create.mockResolvedValue({
      id: 'n3',
      tipo: 'REGIMENTO_INTERNO',
      numero: 1,
      ano: 2015
    })

    await criarNorma({
      tipo: 'REGIMENTO_INTERNO',
      numero: 1,
      ano: 2015,
      data: new Date('2015-03-10'),
      ementa: 'Regimento Interno da Câmara Municipal',
      texto: 'TÍTULO I - Disposições Preliminares...'
    })

    const chamada = prisma.normaJuridica.create.mock.calls[0][0]
    expect(chamada.data.tipo).toBe('REGIMENTO_INTERNO')
    expect(chamada.data.textoCompilado).toBe(chamada.data.texto)
  })
})

describe('buscarNormaPorIdentificacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('busca norma pela tupla (tipo, numero, ano)', async () => {
    prisma.normaJuridica.findUnique.mockResolvedValue({
      id: 'n1',
      tipo: 'LEI_ORGANICA',
      numero: 1,
      ano: 1990,
      artigos: []
    })

    const norma = await buscarNormaPorIdentificacao('LEI_ORGANICA', 1, 1990)

    expect(norma).toMatchObject({ tipo: 'LEI_ORGANICA', numero: 1, ano: 1990 })
    expect(prisma.normaJuridica.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tipo_numero_ano: { tipo: 'LEI_ORGANICA', numero: 1, ano: 1990 } }
      })
    )
  })

  it('retorna null quando norma nao existe', async () => {
    prisma.normaJuridica.findUnique.mockResolvedValue(null)
    const norma = await buscarNormaPorIdentificacao('CODIGO_ETICA', 99, 9999)
    expect(norma).toBeNull()
  })
})
