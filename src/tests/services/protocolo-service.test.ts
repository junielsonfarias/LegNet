import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { randomBytes } from 'crypto'

// Configura chave de encryption antes de carregar protocolo-utils
beforeAll(() => {
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex')
  }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    protocolo: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    protocoloAnexo: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    protocoloTramitacao: {
      create: vi.fn(),
    },
    proposicao: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((arr: unknown[]) => Promise.all(arr)),
  },
}))

vi.mock('@/lib/utils/secure-id', () => ({
  generateSecureCode: vi.fn(() => 'ABCD1234'),
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

import { prisma as _prisma } from '@/lib/prisma'
import { criarProtocolo } from '@/lib/services/protocolo-service'
import { isEncrypted } from '@/lib/security/encryption'

const prisma = _prisma as any

describe('criarProtocolo (P0-6 - CPF/CNPJ protegido)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.protocolo.findFirst.mockResolvedValue(null)
    prisma.protocolo.create.mockResolvedValue({
      id: 'p-1',
      numero: 1,
      ano: 2026,
      etiquetaCodigo: 'PROT2026000011ABCD1234',
    })
  })

  it('P0-6: PESSOA_FISICA com CPF -> stored criptografado + hash gerado', async () => {
    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Joao da Silva',
      cpfCnpjRemetente: '12345678909',
      tipoRemetente: 'PESSOA_FISICA',
      assunto: 'Solicitacao X',
    })

    expect(prisma.protocolo.create).toHaveBeenCalledTimes(1)
    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.tipoRemetente).toBe('PESSOA_FISICA')
    expect(callArgs.data.cpfCnpjRemetente).toBeTruthy()
    expect(isEncrypted(callArgs.data.cpfCnpjRemetente)).toBe(true) // criptografado
    expect(callArgs.data.cpfCnpjRemetente).not.toBe('12345678909')
    expect(callArgs.data.cpfCnpjRemetenteHash).toBeTruthy()
    expect(callArgs.data.cpfCnpjRemetenteHash).not.toBe('12345678909')
  })

  it('P0-6: PESSOA_JURIDICA com CNPJ -> stored texto plano + hash', async () => {
    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Empresa LTDA',
      cpfCnpjRemetente: '12345678000199',
      tipoRemetente: 'PESSOA_JURIDICA',
      assunto: 'Notificacao',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.tipoRemetente).toBe('PESSOA_JURIDICA')
    expect(callArgs.data.cpfCnpjRemetente).toBe('12345678000199') // texto plano
    expect(isEncrypted(callArgs.data.cpfCnpjRemetente)).toBe(false)
    expect(callArgs.data.cpfCnpjRemetenteHash).toBeTruthy()
  })

  it('CPF formatado: aceita "123.456.789-09" e normaliza para digitos antes', async () => {
    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Joao',
      cpfCnpjRemetente: '123.456.789-09',
      tipoRemetente: 'PESSOA_FISICA',
      assunto: 'Teste',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.cpfCnpjRemetente).toBeTruthy()
    expect(isEncrypted(callArgs.data.cpfCnpjRemetente)).toBe(true)
  })

  it('sem cpfCnpjRemetente: stored=null, hash=null', async () => {
    await criarProtocolo({
      tipo: 'INTERNO',
      nomeRemetente: 'Setor Interno',
      assunto: 'Comunicacao interna',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.cpfCnpjRemetente).toBeNull()
    expect(callArgs.data.cpfCnpjRemetenteHash).toBeNull()
  })

  it('default tipoRemetente = PESSOA_FISICA quando omitido', async () => {
    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Cidadao',
      assunto: 'Direito de peticao',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.tipoRemetente).toBe('PESSOA_FISICA')
  })

  it('numero sequencial: 1 no primeiro do ano', async () => {
    prisma.protocolo.findFirst.mockResolvedValue(null) // nenhum anterior

    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Teste',
      assunto: 'Primeiro do ano',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.numero).toBe(1)
  })

  it('numero sequencial: incrementa do ultimo do ano', async () => {
    prisma.protocolo.findFirst.mockResolvedValue({ numero: 42 })

    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Teste',
      assunto: 'Apos o 42',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.numero).toBe(43)
  })

  it('etiquetaCodigo inclui ano + numero zerado a 5 digitos', async () => {
    prisma.protocolo.findFirst.mockResolvedValue({ numero: 4 })

    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Teste',
      assunto: 'Codigo',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    // Formato: PROT + ano + numero(5) + timestamp + random
    expect(callArgs.data.etiquetaCodigo).toMatch(/^PROT\d{4}00005/)
  })

  it('situacao default = ABERTO', async () => {
    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Teste',
      assunto: 'Default',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.situacao).toBe('ABERTO')
  })

  it('prioridade default = NORMAL', async () => {
    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Teste',
      assunto: 'Default',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.prioridade).toBe('NORMAL')
  })

  it('prioridade customizada (URGENTE) respeitada', async () => {
    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Urgente',
      assunto: 'Prazo curto',
      prioridade: 'URGENTE',
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.prioridade).toBe('URGENTE')
  })

  it('sigiloso=true respeitado', async () => {
    await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Confidencial',
      assunto: 'Documento sigiloso',
      sigiloso: true,
    })

    const callArgs = prisma.protocolo.create.mock.calls[0][0]
    expect(callArgs.data.sigiloso).toBe(true)
  })

  it('retorna { id, numero, ano, etiquetaCodigo }', async () => {
    const result = await criarProtocolo({
      tipo: 'ENTRADA',
      nomeRemetente: 'Teste',
      assunto: 'Retorno',
    })

    expect(result).toMatchObject({
      id: 'p-1',
      numero: 1,
      ano: 2026,
      etiquetaCodigo: expect.stringMatching(/^PROT/),
    })
  })
})
