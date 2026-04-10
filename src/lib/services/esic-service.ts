import { prisma } from '@/lib/prisma'
import type { StatusESIC } from '@prisma/client'

export interface ESICFilters {
  status?: StatusESIC
  ano?: number
  email?: string
  search?: string
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++
    }
  }
  return result
}

const buildWhereClause = (filters: ESICFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.status) where.status = filters.status
  if (filters.ano) where.ano = filters.ano
  if (filters.email) where.email = { contains: filters.email, mode: 'insensitive' }
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

export const esicService = {
  async gerarProtocolo(ano: number) {
    const ultimo = await prisma.solicitacaoESIC.findFirst({
      where: { ano },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    })
    const proximoNumero = (ultimo?.numero ?? 0) + 1
    const protocolo = `ESIC-${ano}-${String(proximoNumero).padStart(5, '0')}`
    return { protocolo, numero: proximoNumero }
  },

  calcularPrazoResposta(dataCriacao: Date): Date {
    return addBusinessDays(dataCriacao, 20)
  },

  async list(filters: ESICFilters = {}) {
    return prisma.solicitacaoESIC.findMany({
      where: buildWhereClause(filters),
      orderBy: { createdAt: 'desc' },
    })
  },

  async paginate(filters: ESICFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, data] = await Promise.all([
      prisma.solicitacaoESIC.count({ where }),
      prisma.solicitacaoESIC.findMany({
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
    return prisma.solicitacaoESIC.findUnique({
      where: { id },
      include: {
        anexos: true,
        recursos: { orderBy: { dataRecurso: 'desc' } },
        historico: { orderBy: { data: 'desc' } },
      },
    })
  },

  async getByProtocolo(protocolo: string) {
    const solicitacao = await prisma.solicitacaoESIC.findUnique({
      where: { protocolo },
      include: {
        anexos: true,
        recursos: { orderBy: { dataRecurso: 'desc' } },
        historico: { orderBy: { data: 'desc' } },
      },
    })

    if (!solicitacao) return null

    const { cpf, ...semCpf } = solicitacao
    return semCpf
  },

  async create(data: {
    nome: string
    email: string
    cpf?: string
    telefone?: string
    tipoSolicitante?: string
    assunto: string
    descricao: string
    orgao?: string
    formaResposta?: string
  }) {
    const ano = new Date().getFullYear()
    const { protocolo, numero } = await esicService.gerarProtocolo(ano)
    const prazoResposta = esicService.calcularPrazoResposta(new Date())

    return prisma.solicitacaoESIC.create({
      data: {
        protocolo,
        ano,
        numero,
        nome: data.nome,
        email: data.email,
        cpf: data.cpf ?? null,
        telefone: data.telefone ?? null,
        tipoSolicitante: data.tipoSolicitante ?? null,
        assunto: data.assunto,
        descricao: data.descricao,
        orgao: data.orgao ?? null,
        formaResposta: data.formaResposta ?? null,
        prazoResposta,
        status: 'ABERTO',
        historico: {
          create: {
            acao: 'CRIACAO',
            descricao: 'Solicitação registrada',
          },
        },
      },
      include: { historico: true },
    })
  },

  async responder(id: string, resposta: string, respondidoPor: string) {
    return prisma.solicitacaoESIC.update({
      where: { id },
      data: {
        status: 'RESPONDIDO',
        resposta,
        respondidoPor,
        dataResposta: new Date(),
        historico: {
          create: {
            acao: 'RESPOSTA',
            descricao: 'Solicitação respondida',
            usuarioNome: respondidoPor,
          },
        },
      },
    })
  },

  async prorrogar(id: string, motivo: string) {
    const solicitacao = await prisma.solicitacaoESIC.findUniqueOrThrow({ where: { id } })
    const novoPrazo = addBusinessDays(solicitacao.prazoResposta, 10)

    return prisma.solicitacaoESIC.update({
      where: { id },
      data: {
        status: 'PRORROGADO',
        dataProrrogacao: new Date(),
        motivoProrrogacao: motivo,
        prazoResposta: novoPrazo,
        historico: {
          create: {
            acao: 'PRORROGACAO',
            descricao: `Prazo prorrogado por 10 dias. Motivo: ${motivo}`,
          },
        },
      },
    })
  },

  async negar(id: string, motivo: string, respondidoPor: string) {
    return prisma.solicitacaoESIC.update({
      where: { id },
      data: {
        status: 'NEGADO',
        resposta: motivo,
        respondidoPor,
        dataResposta: new Date(),
        historico: {
          create: {
            acao: 'NEGACAO',
            descricao: `Solicitação negada. Motivo: ${motivo}`,
            usuarioNome: respondidoPor,
          },
        },
      },
    })
  },

  async criarRecurso(solicitacaoId: string, motivo: string, instancia: number) {
    const prazoResposta = addBusinessDays(new Date(), 20)

    const [recurso] = await prisma.$transaction([
      prisma.recursoESIC.create({
        data: {
          solicitacaoId,
          instancia,
          motivo,
          prazoResposta,
        },
      }),
      prisma.solicitacaoESIC.update({
        where: { id: solicitacaoId },
        data: {
          temRecurso: true,
          status: 'RECURSO',
          historico: {
            create: {
              acao: 'RECURSO',
              descricao: `Recurso de ${instancia}ª instância registrado`,
            },
          },
        },
      }),
    ])

    return recurso
  },

  async estatisticas() {
    const [porStatus, total, respondidas] = await Promise.all([
      prisma.solicitacaoESIC.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.solicitacaoESIC.count(),
      prisma.solicitacaoESIC.findMany({
        where: { dataResposta: { not: null } },
        select: { createdAt: true, dataResposta: true },
      }),
    ])

    const tempoMedio =
      respondidas.length > 0
        ? respondidas.reduce((acc, s) => {
            const diff = s.dataResposta!.getTime() - s.createdAt.getTime()
            return acc + diff
          }, 0) /
          respondidas.length /
          (1000 * 60 * 60 * 24)
        : 0

    const vencidas = await prisma.solicitacaoESIC.count({
      where: {
        status: { in: ['ABERTO', 'EM_ANALISE', 'PRORROGADO'] },
        prazoResposta: { lt: new Date() },
      },
    })

    return {
      total,
      porStatus: porStatus.map((s) => ({ status: s.status, quantidade: s._count._all })),
      tempoMedioRespostaDias: Math.round(tempoMedio * 10) / 10,
      vencidas,
    }
  },
}
