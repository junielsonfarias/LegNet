import { prisma } from '@/lib/prisma'
import type { CargoParlamentar, ParticipacaoTipo } from '@prisma/client'
import {
  calcularPresencaResumo,
  calcularVotacaoResumo
} from '@/lib/parlamentares/dashboard-utils'

export interface ParlamentarFilters {
  ativo?: boolean
  cargo?: string
  partido?: string
  search?: string
  legislaturaId?: string
}

export interface MandatoPayload {
  legislaturaId: string
  numeroVotos: number
  cargo: string
  dataInicio: string
  dataFim?: string
}

export interface FiliacaoPayload {
  partido: string
  dataInicio: string
  dataFim?: string
}

export interface ParlamentarPayload {
  nome: string
  apelido: string
  cargo: string
  partido?: string | null
  legislatura: string
  email?: string | null
  telefone?: string | null
  biografia?: string | null
  foto?: string | null
  gabinete?: string | null
  ativo?: boolean
  mandatos?: MandatoPayload[]
  filiacoes?: FiliacaoPayload[]
}

const buildWhereClause = (filters: ParlamentarFilters = {}) => {
  const where: any = {}

  if (filters.ativo !== undefined) where.ativo = filters.ativo
  if (filters.cargo) where.cargo = filters.cargo
  if (filters.partido) where.partido = { contains: filters.partido, mode: 'insensitive' }

  if (filters.search) {
    where.OR = [
      { nome: { contains: filters.search, mode: 'insensitive' } },
      { apelido: { contains: filters.search, mode: 'insensitive' } },
      { partido: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  if (filters.legislaturaId) {
    where.mandatos = { some: { legislaturaId: filters.legislaturaId } }
  }

  return where
}

const defaultInclude = {
  mandatos: {
    include: { legislatura: true },
    orderBy: { dataInicio: 'desc' as const }
  },
  filiacoes: {
    orderBy: { dataInicio: 'desc' as const }
  }
}

export const parlamentarDbService = {
  async list(filters: ParlamentarFilters = {}) {
    return prisma.parlamentar.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ cargo: 'asc' }, { nome: 'asc' }],
      include: defaultInclude
    })
  },

  async paginate(filters: ParlamentarFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 50))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, parlamentares, legislaturaAtual] = await Promise.all([
      prisma.parlamentar.count({ where }),
      prisma.parlamentar.findMany({
        where,
        orderBy: [{ cargo: 'asc' }, { nome: 'asc' }],
        skip,
        take: limit,
        include: {
          mandatos: {
            select: { id: true, ativo: true, dataInicio: true, dataFim: true, legislaturaId: true, legislatura: { select: { id: true, numero: true, anoInicio: true, anoFim: true, ativa: true } } },
            orderBy: { dataInicio: 'desc' as const }
          },
          filiacoes: {
            where: { ativa: true },
            select: { id: true, partido: true, dataInicio: true, ativa: true },
            orderBy: { dataInicio: 'desc' as const },
            take: 1
          }
        } as any
      }),
      prisma.legislatura.findFirst({
        where: { ativa: true },
        select: { id: true },
        orderBy: { anoInicio: 'desc' }
      })
    ])

    if (legislaturaAtual) {
      parlamentares.sort((a: any, b: any) => {
        const aAtual = a.mandatos?.some((m: any) => m.legislaturaId === legislaturaAtual.id && m.ativo) || false
        const bAtual = b.mandatos?.some((m: any) => m.legislaturaId === legislaturaAtual.id && m.ativo) || false
        if (aAtual && !bAtual) return -1
        if (!aAtual && bAtual) return 1
        return 0
      })
    }

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: parlamentares,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.parlamentar.findUnique({
      where: { id },
      include: {
        mandatos: {
          include: { legislatura: true },
          orderBy: { dataInicio: 'desc' as const }
        },
        filiacoes: {
          orderBy: { dataInicio: 'desc' as const }
        }
      }
    })
  },

  async checkDuplicate(nome: string, apelido: string, excludeId?: string) {
    const where: any = {
      OR: [{ nome }, { apelido }]
    }
    if (excludeId) {
      where.AND = [{ id: { not: excludeId } }]
    }
    return prisma.parlamentar.findFirst({ where })
  },

  async create(payload: ParlamentarPayload) {
    return prisma.parlamentar.create({
      data: {
        nome: payload.nome,
        apelido: payload.apelido,
        cargo: payload.cargo as CargoParlamentar,
        partido: payload.partido || null,
        legislatura: payload.legislatura,
        email: payload.email || null,
        telefone: payload.telefone || null,
        biografia: payload.biografia || null,
        foto: payload.foto || null,
        gabinete: payload.gabinete || null,
        ativo: payload.ativo ?? true,
        mandatos: payload.mandatos ? {
          create: payload.mandatos.map(m => ({
            legislaturaId: m.legislaturaId,
            numeroVotos: m.numeroVotos,
            cargo: m.cargo as CargoParlamentar,
            dataInicio: new Date(m.dataInicio),
            dataFim: m.dataFim ? new Date(m.dataFim) : null,
            ativo: true
          }))
        } : undefined,
        filiacoes: payload.filiacoes ? {
          create: payload.filiacoes.map(f => ({
            partido: f.partido,
            dataInicio: new Date(f.dataInicio),
            dataFim: f.dataFim ? new Date(f.dataFim) : null,
            ativa: true
          }))
        } : undefined
      } as any,
      include: {
        mandatos: { include: { legislatura: true } },
        filiacoes: true
      } as any
    })
  },

  async update(id: string, payload: Partial<ParlamentarPayload>) {
    const updateData: any = {}

    if (payload.nome !== undefined) updateData.nome = payload.nome
    if (payload.apelido !== undefined) updateData.apelido = payload.apelido
    if (payload.cargo !== undefined) updateData.cargo = payload.cargo
    if (payload.partido !== undefined) updateData.partido = payload.partido || null
    if (payload.legislatura !== undefined) updateData.legislatura = payload.legislatura
    if (payload.email !== undefined) updateData.email = payload.email || null
    if (payload.telefone !== undefined) updateData.telefone = payload.telefone || null
    if (payload.biografia !== undefined) updateData.biografia = payload.biografia || null
    if (payload.foto !== undefined) updateData.foto = payload.foto || null
    if (payload.gabinete !== undefined) updateData.gabinete = payload.gabinete || null
    if (payload.ativo !== undefined) updateData.ativo = payload.ativo

    // Substituir mandatos se fornecidos
    if (payload.mandatos) {
      await prisma.mandato.deleteMany({ where: { parlamentarId: id } })
      updateData.mandatos = {
        create: payload.mandatos.map(m => ({
          legislaturaId: m.legislaturaId,
          numeroVotos: m.numeroVotos,
          cargo: m.cargo,
          dataInicio: new Date(m.dataInicio),
          dataFim: m.dataFim ? new Date(m.dataFim) : null,
          ativo: true
        }))
      }
    }

    // Substituir filiações se fornecidas
    if (payload.filiacoes) {
      await prisma.filiacao.deleteMany({ where: { parlamentarId: id } })
      updateData.filiacoes = {
        create: payload.filiacoes.map(f => ({
          partido: f.partido,
          dataInicio: new Date(f.dataInicio),
          dataFim: f.dataFim ? new Date(f.dataFim) : null,
          ativa: true
        }))
      }
    }

    return prisma.parlamentar.update({
      where: { id },
      data: updateData,
      include: {
        mandatos: { include: { legislatura: true } },
        filiacoes: true
      }
    })
  },

  async remove(id: string) {
    await prisma.parlamentar.update({
      where: { id },
      data: { ativo: false }
    })
    return { success: true }
  },

  async hardDelete(id: string) {
    // Verificar se tem dados vinculados que impedem exclusao
    const [proposicoes, votacoes, presencas, emendas] = await Promise.all([
      prisma.proposicao.count({ where: { autorId: id } }),
      prisma.votacao.count({ where: { parlamentarId: id } }),
      prisma.presencaSessao.count({ where: { parlamentarId: id } }),
      prisma.emenda.count({ where: { autorId: id } }),
    ])

    const totalVinculos = proposicoes + votacoes + presencas + emendas

    if (totalVinculos > 0) {
      return {
        success: false,
        error: `Parlamentar possui ${totalVinculos} registro(s) vinculado(s) (${proposicoes} proposicoes, ${votacoes} votacoes, ${presencas} presencas, ${emendas} emendas). Use a opcao de desativar em vez de excluir.`
      }
    }

    // Excluir registros dependentes em cascata manual (que tem onDelete: Cascade)
    await prisma.$transaction([
      prisma.membroComissao.deleteMany({ where: { parlamentarId: id } }),
      prisma.membroMesaSessao.deleteMany({ where: { parlamentarId: id } }),
      prisma.oradorSessao.deleteMany({ where: { parlamentarId: id } }),
      prisma.presencaOrdemDia.deleteMany({ where: { parlamentarId: id } }),
      prisma.votoEmenda.deleteMany({ where: { parlamentarId: id } }),
      prisma.historicoParticipacao.deleteMany({ where: { parlamentarId: id } }),
      prisma.filiacao.deleteMany({ where: { parlamentarId: id } }),
      prisma.mandato.deleteMany({ where: { parlamentarId: id } }),
      // Desvincular User se existir
      prisma.user.updateMany({ where: { parlamentarId: id }, data: { parlamentarId: null } }),
      // Desvincular como relator de pautas
      prisma.pautaItem.updateMany({ where: { relatorId: id }, data: { relatorId: null } }),
      // Excluir o parlamentar
      prisma.parlamentar.delete({ where: { id } }),
    ])

    return { success: true }
  },

  async getPerfil(id: string) {
    // Buscar parlamentar com todos os relacionamentos
    const parlamentar = await prisma.parlamentar.findUnique({
      where: { id },
      include: {
        mandatos: {
          include: { legislatura: true },
          orderBy: { dataInicio: 'desc' as const }
        },
        filiacoes: {
          orderBy: { dataInicio: 'desc' as const }
        },
        comissoes: {
          include: { comissao: true },
          orderBy: { dataInicio: 'desc' as const }
        },
        proposicoes: {
          orderBy: { dataApresentacao: 'desc' as const },
          take: 10,
          include: { sessao: true }
        },
        presencas: {
          include: { sessao: true }
        },
        votacoes: {
          include: { proposicao: true },
          orderBy: { createdAt: 'desc' as const },
          take: 20
        }
      }
    })

    if (!parlamentar) return null

    // Calcular estatísticas
    const [totalSessoes, totalProposicoes, proposicoesPorTipo, proposicoesPorStatus] = await Promise.all([
      prisma.sessao.count({ where: { status: 'CONCLUIDA' } }),
      prisma.proposicao.count(),
      prisma.proposicao.groupBy({
        by: ['tipo'],
        where: { autorId: id },
        _count: { id: true }
      }),
      prisma.proposicao.groupBy({
        by: ['status'],
        where: { autorId: id },
        _count: { id: true }
      })
    ])

    const sessoesPresente = parlamentar.presencas.filter(p => p.presente).length
    const percentualPresenca = totalSessoes > 0
      ? Math.round((sessoesPresente / totalSessoes) * 100 * 100) / 100
      : 0

    const materiasAutor = parlamentar.proposicoes.length
    const percentualMaterias = totalProposicoes > 0
      ? Math.round((materiasAutor / totalProposicoes) * 100 * 100) / 100
      : 0

    const aprovadasCount = proposicoesPorStatus.find(p => p.status === 'APROVADA')?._count?.id || 0
    const emTramitacaoCount = proposicoesPorStatus.find(p => p.status === 'EM_TRAMITACAO')?._count?.id || 0

    return {
      // Dados básicos
      id: parlamentar.id,
      nome: parlamentar.nome,
      apelido: parlamentar.apelido,
      email: parlamentar.email,
      telefone: parlamentar.telefone,
      partido: parlamentar.partido,
      biografia: parlamentar.biografia,
      foto: parlamentar.foto,
      cargo: parlamentar.cargo,
      legislatura: parlamentar.legislatura,
      ativo: parlamentar.ativo,
      createdAt: parlamentar.createdAt,
      updatedAt: parlamentar.updatedAt,

      // Estatísticas calculadas
      estatisticas: {
        legislaturaAtual: {
          materias: materiasAutor,
          percentualMaterias,
          sessoes: sessoesPresente,
          totalSessoes,
          percentualPresenca,
          dataAtualizacao: new Date().toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        },
        exercicioAtual: {
          materias: materiasAutor,
          percentualMaterias,
          sessoes: sessoesPresente,
          percentualPresenca
        }
      },

      // Estatísticas de matérias
      estatisticasMaterias: {
        total: materiasAutor,
        aprovadas: aprovadasCount,
        emTramitacao: emTramitacaoCount,
        distribuicao: proposicoesPorTipo.map(p => ({
          tipo: p.tipo,
          quantidade: p._count.id,
          percentual: materiasAutor > 0
            ? Math.round((p._count.id / materiasAutor) * 100 * 10) / 10
            : 0
        }))
      },

      // Últimas matérias/proposições
      ultimasMaterias: parlamentar.proposicoes.map(p => ({
        id: p.id,
        numero: `${p.numero}/${p.ano}`,
        tipo: p.tipo,
        titulo: p.ementa,
        data: p.dataApresentacao ? new Date(p.dataApresentacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
        status: p.status,
        autor: parlamentar.nome
      })),

      // Comissões
      comissoes: parlamentar.comissoes.map((mc: any) => ({
        id: mc.comissao.id,
        nome: mc.comissao.nome,
        cargo: mc.cargo,
        dataInicio: mc.dataInicio ? new Date(mc.dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
        dataFim: mc.dataFim ? new Date(mc.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Atual'
      })),

      // Mandatos
      mandatos: parlamentar.mandatos.map(m => ({
        id: m.id,
        cargo: m.cargo,
        vinculo: m.cargo === 'VEREADOR' ? 'VEREADOR EM EXERCÍCIO' : 'MESA DIRETORA',
        legislatura: m.legislatura
          ? `${m.legislatura.numero}ª Legislatura (${m.legislatura.anoInicio} - ${m.legislatura.anoFim})`
          : parlamentar.legislatura,
        periodo: m.dataInicio
          ? `${new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(m.dataInicio))}${m.dataFim ? ` a ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(m.dataFim))}` : ''}`
          : 'Atual',
        numeroVotos: m.numeroVotos,
        ativo: m.ativo
      })),

      // Filiação partidária
      filiacaoPartidaria: parlamentar.filiacoes.map(f => ({
        id: f.id,
        partido: f.partido,
        dataInicio: f.dataInicio ? new Date(f.dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
        dataFim: f.dataFim ? new Date(f.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null,
        ativa: f.ativa
      })),

      // Votações recentes
      votacoesRecentes: parlamentar.votacoes.map(v => ({
        id: v.id,
        proposicaoId: v.proposicaoId,
        proposicaoNumero: v.proposicao ? `${v.proposicao.numero}/${v.proposicao.ano}` : '',
        proposicaoTitulo: v.proposicao?.ementa || '',
        voto: v.voto,
        data: v.createdAt ? new Date(v.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''
      })),

      // Presenças recentes
      presencasRecentes: parlamentar.presencas
        .filter(p => p.sessao)
        .slice(0, 10)
        .map(p => ({
          sessaoId: p.sessaoId,
          sessaoNumero: p.sessao?.numero,
          sessaoData: p.sessao?.data ? new Date(p.sessao.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
          presente: p.presente,
          justificativa: p.justificativa
        }))
    }
  },

  async getStats() {
    const [total, ativos, porCargo, porPartido] = await Promise.all([
      prisma.parlamentar.count(),
      prisma.parlamentar.count({ where: { ativo: true } }),
      prisma.parlamentar.groupBy({ by: ['cargo'], _count: { _all: true } }),
      prisma.parlamentar.groupBy({ by: ['partido'], _count: { _all: true }, where: { ativo: true } })
    ])

    return {
      total,
      ativos,
      porCargo: porCargo.reduce((acc, item) => {
        acc[item.cargo] = item._count._all
        return acc
      }, {} as Record<string, number>),
      porPartido: porPartido.reduce((acc, item) => {
        if (item.partido) acc[item.partido] = item._count._all
        return acc
      }, {} as Record<string, number>)
    }
  },

  async getDashboard(parlamentarId: string) {
    const parlamentarResult = await prisma.parlamentar.findUnique({
      where: { id: parlamentarId },
      include: {
        mandatos: {
          include: { legislatura: true },
          orderBy: { dataInicio: 'desc' as const }
        },
        filiacoes: {
          orderBy: { dataInicio: 'desc' as const }
        }
      }
    })

    if (!parlamentarResult) return null

    const parlamentar = parlamentarResult as any

    const [membrosComissao, membrosMesa, presencas, votacoes, sessoesAgendadas] = await Promise.all([
      prisma.membroComissao.findMany({
        where: { parlamentarId },
        include: { comissao: true }
      }),
      prisma.membroMesaDiretora.findMany({
        where: { parlamentarId },
        include: {
          mesaDiretora: {
            include: {
              periodo: {
                include: { legislatura: true }
              }
            }
          },
          cargo: true
        }
      }),
      prisma.presencaSessao.findMany({
        where: { parlamentarId }
      }),
      prisma.votacao.findMany({
        where: { parlamentarId }
      }),
      prisma.sessao.findMany({
        where: {
          presencas: { some: { parlamentarId } }
        },
        orderBy: { data: 'asc' as const },
        include: {
          legislatura: true,
          periodo: true,
          presencas: {
            where: { parlamentarId },
            select: { presente: true, justificativa: true }
          }
        },
        take: 6
      })
    ])

    const presencaResumo = calcularPresencaResumo(
      presencas.map(p => ({ presente: p.presente, justificativa: p.justificativa }))
    )

    const votacaoResumo = calcularVotacaoResumo(
      votacoes.map(v => ({ voto: v.voto }))
    )

    return {
      parlamentar,
      membrosComissao,
      membrosMesa,
      presencaResumo,
      votacaoResumo,
      sessoesAgendadas
    }
  },

  async getHistorico(parlamentarId: string) {
    const parlamentar = await prisma.parlamentar.findUnique({
      where: { id: parlamentarId },
      select: { id: true }
    })

    if (!parlamentar) return null

    const historico = await prisma.historicoParticipacao.findMany({
      where: { parlamentarId },
      orderBy: [{ dataInicio: 'desc' }, { createdAt: 'desc' }]
    })

    const ParticipacaoTipoValues = { MESA_DIRETORA: 'MESA_DIRETORA', COMISSAO: 'COMISSAO' } as const

    const mesaIds = Array.from(new Set(
      historico
        .filter(entry => entry.tipo === ParticipacaoTipoValues.MESA_DIRETORA)
        .map(entry => entry.referenciaId)
    ))

    const comissaoIds = Array.from(new Set(
      historico
        .filter(entry => entry.tipo === ParticipacaoTipoValues.COMISSAO)
        .map(entry => entry.referenciaId)
    ))

    const [mesas, comissoes] = await Promise.all([
      mesaIds.length
        ? prisma.mesaDiretora.findMany({
            where: { id: { in: mesaIds } },
            include: {
              periodo: {
                include: { legislatura: true }
              }
            }
          })
        : Promise.resolve([]),
      comissaoIds.length
        ? prisma.comissao.findMany({
            where: { id: { in: comissaoIds } }
          })
        : Promise.resolve([])
    ])

    return { historico, mesas, comissoes }
  },

  async getStatus(parlamentarId: string) {
    // Buscar sessao em andamento
    const sessaoEmAndamento = await prisma.sessao.findFirst({
      where: { status: 'EM_ANDAMENTO' },
      select: {
        id: true,
        numero: true,
        tipo: true,
        data: true,
        status: true
      }
    })

    if (!sessaoEmAndamento) {
      return {
        sessaoEmAndamento: false as const,
        presencaConfirmada: false,
        sessaoId: null,
        sessao: null,
        podeAcessarVotacao: false,
        podeAcessarDashboard: true,
        mensagem: 'Nenhuma sessão em andamento'
      }
    }

    // Verificar presenca do parlamentar na sessao
    const presenca = await prisma.presencaSessao.findFirst({
      where: {
        sessaoId: sessaoEmAndamento.id,
        parlamentarId,
        presente: true
      }
    })

    const presencaConfirmada = !!presenca
    const podeAcessarVotacao = presencaConfirmada
    const podeAcessarDashboard = false // Nao pode ver dashboard se ha sessao em andamento

    const mensagem = presencaConfirmada
      ? 'Sessão em andamento - acesso ao módulo de votação liberado'
      : 'Sessão em andamento - aguardando confirmação de presença pelo operador'

    return {
      sessaoEmAndamento: true as const,
      presencaConfirmada,
      sessaoId: sessaoEmAndamento.id,
      sessao: sessaoEmAndamento,
      podeAcessarVotacao,
      podeAcessarDashboard,
      mensagem
    }
  }
}
