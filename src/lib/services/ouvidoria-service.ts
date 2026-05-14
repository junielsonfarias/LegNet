import { prisma } from '@/lib/prisma'
import type { TipoManifestacao, StatusManifestacao } from '@prisma/client'
import { encryptCpf, hashCpf, isValidCpfFormat, maskEncryptedCpf } from '@/lib/security/cpf-utils'

export interface OuvidoriaFilters {
  tipo?: TipoManifestacao
  status?: StatusManifestacao
  prioridade?: string
  ano?: number
  search?: string
}

const buildWhereClause = (filters: OuvidoriaFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.tipo) where.tipo = filters.tipo
  if (filters.status) where.status = filters.status
  if (filters.prioridade) where.prioridade = filters.prioridade
  if (filters.ano) where.ano = filters.ano
  if (filters.search) {
    where.OR = [
      { protocolo: { contains: filters.search, mode: 'insensitive' } },
      { assunto: { contains: filters.search, mode: 'insensitive' } },
      { descricao: { contains: filters.search, mode: 'insensitive' } },
      { nome: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  return where
}

export const ouvidoriaService = {
  async gerarProtocolo(ano: number) {
    const ultimo = await prisma.manifestacaoOuvidoria.findFirst({
      where: { ano },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    })
    const proximoNumero = (ultimo?.numero ?? 0) + 1
    const protocolo = `OUV-${ano}-${String(proximoNumero).padStart(5, '0')}`
    return { protocolo, numero: proximoNumero }
  },

  calcularPrazoResposta(tipo: TipoManifestacao): Date {
    const dias = tipo === 'ELOGIO' ? 15 : 30
    const prazo = new Date()
    prazo.setDate(prazo.getDate() + dias)
    return prazo
  },

  async list(filters: OuvidoriaFilters = {}) {
    return prisma.manifestacaoOuvidoria.findMany({
      where: buildWhereClause(filters),
      orderBy: { createdAt: 'desc' },
    })
  },

  async paginate(filters: OuvidoriaFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, data] = await Promise.all([
      prisma.manifestacaoOuvidoria.count({ where }),
      prisma.manifestacaoOuvidoria.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    }
  },

  async getById(id: string) {
    return prisma.manifestacaoOuvidoria.findUnique({
      where: { id },
      include: {
        anexos: true,
        historico: { orderBy: { data: 'desc' } },
      },
    })
  },

  /**
   * Versao mascarada para listagens/exibicao. CPF nunca volta em claro.
   * RN-166: decriptografia apenas via getByIdComCpf() com permissao explicita.
   */
  async getByIdMasked(id: string) {
    const m = await prisma.manifestacaoOuvidoria.findUnique({
      where: { id },
      include: {
        anexos: true,
        historico: { orderBy: { data: 'desc' } },
      },
    })
    if (!m) return null
    return { ...m, cpf: maskEncryptedCpf(m.cpf), cpfHash: undefined }
  },

  /**
   * Busca por CPF (nao reversivel) — usada quando cidadao consulta seus protocolos.
   * Retorna apenas dados minimos.
   */
  async listByCpfHash(cpf: string) {
    if (!isValidCpfFormat(cpf)) return []
    return prisma.manifestacaoOuvidoria.findMany({
      where: { cpfHash: hashCpf(cpf) },
      select: { id: true, protocolo: true, tipo: true, assunto: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getByProtocolo(protocolo: string) {
    const manifestacao = await prisma.manifestacaoOuvidoria.findUnique({
      where: { protocolo },
      include: {
        anexos: true,
        historico: { orderBy: { data: 'desc' } },
      },
    })

    if (!manifestacao) return null

    const { cpf: _cpf, cpfHash: _cpfHash, ...semCpf } = manifestacao
    if (manifestacao.anonimo) {
      return { ...semCpf, nome: null, email: null, telefone: null }
    }
    return semCpf
  },

  async create(data: {
    anonimo?: boolean
    nome?: string
    email?: string
    telefone?: string
    cpf?: string
    tipo: TipoManifestacao
    assunto: string
    descricao: string
    setor?: string
    prioridade?: string
  }) {
    const ano = new Date().getFullYear()
    const { protocolo, numero } = await ouvidoriaService.gerarProtocolo(ano)
    const prazoResposta = ouvidoriaService.calcularPrazoResposta(data.tipo)

    // RN-166 (LGPD): CPF criptografado em repouso + hash deterministico para busca
    const cpfNormalizado = data.cpf?.trim()
    const cpfStorage = cpfNormalizado && isValidCpfFormat(cpfNormalizado)
      ? { cpf: encryptCpf(cpfNormalizado), cpfHash: hashCpf(cpfNormalizado) }
      : { cpf: null, cpfHash: null }

    return prisma.manifestacaoOuvidoria.create({
      data: {
        protocolo,
        ano,
        numero,
        anonimo: data.anonimo ?? false,
        nome: data.nome ?? null,
        email: data.email ?? null,
        telefone: data.telefone ?? null,
        cpf: cpfStorage.cpf,
        cpfHash: cpfStorage.cpfHash,
        tipo: data.tipo,
        assunto: data.assunto,
        descricao: data.descricao,
        setor: data.setor ?? null,
        prioridade: data.prioridade ?? 'NORMAL',
        prazoResposta,
        historico: {
          create: {
            acao: 'REGISTRO',
            descricao: 'Manifestação registrada',
          },
        },
      },
      include: { historico: true },
    })
  },

  async responder(id: string, resposta: string, respondidoPor: string) {
    return prisma.manifestacaoOuvidoria.update({
      where: { id },
      data: {
        status: 'RESPONDIDA',
        resposta,
        respondidoPor,
        dataResposta: new Date(),
        historico: {
          create: {
            acao: 'RESPOSTA',
            descricao: 'Manifestação respondida',
            usuarioNome: respondidoPor,
          },
        },
      },
    })
  },

  async encaminhar(id: string, setor: string, usuarioNome: string) {
    return prisma.manifestacaoOuvidoria.update({
      where: { id },
      data: {
        status: 'ENCAMINHADA',
        setor,
        historico: {
          create: {
            acao: 'ENCAMINHAMENTO',
            descricao: `Encaminhada para o setor: ${setor}`,
            usuarioNome,
          },
        },
      },
    })
  },

  async concluir(id: string, usuarioNome: string) {
    return prisma.manifestacaoOuvidoria.update({
      where: { id },
      data: {
        status: 'CONCLUIDA',
        historico: {
          create: {
            acao: 'CONCLUSAO',
            descricao: 'Manifestação concluída',
            usuarioNome,
          },
        },
      },
    })
  },

  async avaliarSatisfacao(protocolo: string, nota: number) {
    return prisma.manifestacaoOuvidoria.update({
      where: { protocolo },
      data: { satisfacao: nota },
    })
  },

  async estatisticas() {
    const [porTipo, porStatus, total, respondidas] = await Promise.all([
      prisma.manifestacaoOuvidoria.groupBy({
        by: ['tipo'],
        _count: { _all: true },
      }),
      prisma.manifestacaoOuvidoria.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.manifestacaoOuvidoria.count(),
      prisma.manifestacaoOuvidoria.findMany({
        where: { dataResposta: { not: null } },
        select: { createdAt: true, dataResposta: true },
      }),
    ])

    const tempoMedio =
      respondidas.length > 0
        ? respondidas.reduce((acc, m) => {
            const diff = m.dataResposta!.getTime() - m.createdAt.getTime()
            return acc + diff
          }, 0) /
          respondidas.length /
          (1000 * 60 * 60 * 24)
        : 0

    return {
      total,
      porTipo: porTipo.map((t) => ({ tipo: t.tipo, quantidade: t._count._all })),
      porStatus: porStatus.map((s) => ({ status: s.status, quantidade: s._count._all })),
      tempoMedioRespostaDias: Math.round(tempoMedio * 10) / 10,
    }
  },
}
