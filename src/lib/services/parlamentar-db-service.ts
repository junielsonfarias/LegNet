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
  const where: Record<string, unknown> = {}

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

// ---------------------------------------------------------------------------
// Segmentação por mandato (ERR-069)
//
// Presença e Produção NÃO têm FK direta para Mandato/Legislatura, então a
// separação por mandato usa o ANO (ano de sessao.data / proposicao.ano) dentro
// da faixa anoInicio–anoFim da legislatura de cada mandato. Isso é robusto mesmo
// quando sessao.legislaturaId é nulo e resolve o "buraco" entre mandatos (um
// vereador com mandatos 2021-2024 e 2025-2028 não é mais medido contra o período
// inteiro somado).
// ---------------------------------------------------------------------------

const fmtDataUTC = (d: Date | string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(d))

// Rótulo tolerante a numero inválido (<=0) vindo da migração.
function formatLegislaturaLabel(
  leg?: { numero: number; anoInicio: number; anoFim: number } | null
): string {
  if (!leg) return 'Legislatura não informada'
  const anos = `${leg.anoInicio}–${leg.anoFim}`
  return leg.numero > 0 ? `${leg.numero}ª Legislatura (${anos})` : `Legislatura ${anos}`
}

interface MandatoComLegislatura {
  id: string
  cargo: CargoParlamentar | string
  numeroVotos: number
  dataInicio: Date | null
  dataFim: Date | null
  ativo: boolean
  legislaturaId: string
  legislatura: {
    id: string
    numero: number
    anoInicio: number
    anoFim: number
    ativa: boolean
  } | null
}

async function computeMandatosBreakdown(
  parlamentarId: string,
  nomeParlamentar: string,
  mandatos: MandatoComLegislatura[]
) {
  const [presencas, sessoesConcluidas, materias, totalPropsPorAnoRaw] = await Promise.all([
    prisma.presencaSessao.findMany({
      where: { parlamentarId },
      select: { presente: true, sessao: { select: { data: true } } }
    }),
    prisma.sessao.findMany({
      where: { status: 'CONCLUIDA' },
      select: { data: true }
    }),
    prisma.proposicao.findMany({
      where: { autorId: parlamentarId },
      select: {
        id: true, numero: true, ano: true, tipo: true,
        status: true, ementa: true, dataApresentacao: true
      },
      orderBy: { dataApresentacao: 'desc' as const }
    }),
    prisma.proposicao.groupBy({ by: ['ano'], _count: { _all: true } })
  ])

  const totalPropsPorAno = new Map<number, number>()
  for (const g of totalPropsPorAnoRaw) totalPropsPorAno.set(g.ano, g._count._all)

  const anoDe = (d: Date | string | null | undefined): number | null =>
    d ? new Date(d).getUTCFullYear() : null

  const detalhados = mandatos.map(m => {
    const leg = m.legislatura
    const ini = leg?.anoInicio ?? null
    const fim = leg?.anoFim ?? null
    const noPeriodo = (ano: number | null) =>
      ini != null && fim != null && ano != null && ano >= ini && ano <= fim

    // Presença (denominador e numerador bucketizados pelo MESMO critério de ano)
    const totalSessoes = ini != null && fim != null
      ? sessoesConcluidas.filter(s => noPeriodo(anoDe(s.data))).length
      : 0
    const sessoesPresente = presencas.filter(
      p => p.presente && noPeriodo(anoDe(p.sessao?.data ?? null))
    ).length
    const percentualPresenca = totalSessoes > 0
      ? Math.round((sessoesPresente / totalSessoes) * 10000) / 100
      : 0

    // Produção
    const materiasMandato = materias.filter(x => noPeriodo(x.ano))
    const totalMat = materiasMandato.length
    const aprovadas = materiasMandato.filter(x => x.status === 'APROVADA').length
    const emTramitacao = materiasMandato.filter(x => x.status === 'EM_TRAMITACAO').length
    const distMap = new Map<string, number>()
    for (const x of materiasMandato) distMap.set(x.tipo, (distMap.get(x.tipo) || 0) + 1)
    const distribuicao = Array.from(distMap.entries()).map(([tipo, quantidade]) => ({
      tipo,
      quantidade,
      percentual: totalMat > 0 ? Math.round((quantidade / totalMat) * 1000) / 10 : 0
    }))
    let totalSistemaPeriodo = 0
    if (ini != null && fim != null) {
      for (let a = ini; a <= fim; a++) totalSistemaPeriodo += totalPropsPorAno.get(a) || 0
    }
    const percentualMaterias = totalSistemaPeriodo > 0
      ? Math.round((totalMat / totalSistemaPeriodo) * 10000) / 100
      : 0

    return {
      id: m.id,
      legislaturaId: m.legislaturaId,
      legislaturaNumero: leg?.numero ?? null,
      legislaturaLabel: formatLegislaturaLabel(leg),
      anoInicio: ini,
      anoFim: fim,
      cargo: m.cargo,
      vinculo: m.cargo === 'VEREADOR' ? 'VEREADOR EM EXERCÍCIO' : 'MESA DIRETORA',
      periodo: m.dataInicio
        ? `${fmtDataUTC(m.dataInicio)}${m.dataFim ? ` a ${fmtDataUTC(m.dataFim)}` : ''}`
        : (ini != null ? `${ini} a ${fim}` : 'Atual'),
      numeroVotos: m.numeroVotos,
      ativo: m.ativo,
      legislaturaAtiva: !!leg?.ativa,
      presenca: { sessoesPresente, totalSessoes, percentual: percentualPresenca },
      producao: { total: totalMat, aprovadas, emTramitacao, percentualMaterias, distribuicao },
      materias: materiasMandato.map(x => ({
        id: x.id,
        numero: `${x.numero}/${x.ano}`,
        tipo: x.tipo,
        titulo: x.ementa,
        data: x.dataApresentacao ? fmtDataUTC(x.dataApresentacao) : '',
        status: x.status,
        autor: nomeParlamentar
      }))
    }
  })

  // Mandato ativo: prioriza legislatura.ativa; senão mandato.ativo; senão o 1º (mais recente).
  let ativoIndex = detalhados.findIndex(d => d.legislaturaAtiva)
  if (ativoIndex < 0) ativoIndex = detalhados.findIndex(d => d.ativo)
  if (ativoIndex < 0 && detalhados.length > 0) ativoIndex = 0

  return {
    detalhados,
    ativoIndex,
    ativo: ativoIndex >= 0 ? detalhados[ativoIndex] : null
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
      parlamentares.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aAtual = (a.mandatos as Array<Record<string, unknown>>)?.some((m: Record<string, unknown>) => m.legislaturaId === legislaturaAtual.id && m.ativo) || false
        const bAtual = (b.mandatos as Array<Record<string, unknown>>)?.some((m: Record<string, unknown>) => m.legislaturaId === legislaturaAtual.id && m.ativo) || false
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
    const where: Record<string, unknown> = {
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
    const updateData: Record<string, unknown> = {}

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

    // Presença e Produção SEPARADAS POR MANDATO (ERR-069). A estatística do topo
    // reflete APENAS a legislatura ativa; mandatos anteriores vêm em
    // `mandatosDetalhados` (cada um com sua frequência e produção próprias).
    const breakdown = await computeMandatosBreakdown(id, parlamentar.nome, parlamentar.mandatos)
    const ativo = breakdown.ativo

    // Estatística "atual" = mandato ativo (fallbacks já tratados no helper).
    const sessoesPresente = ativo?.presenca.sessoesPresente ?? 0
    const totalSessoes = ativo?.presenca.totalSessoes ?? 0
    const percentualPresenca = ativo?.presenca.percentual ?? 0
    const materiasAutor = ativo?.producao.total ?? 0
    const percentualMaterias = ativo?.producao.percentualMaterias ?? 0
    const aprovadasCount = ativo?.producao.aprovadas ?? 0
    const emTramitacaoCount = ativo?.producao.emTramitacao ?? 0
    const distribuicaoAtiva = ativo?.producao.distribuicao ?? []
    // Lista de matérias da legislatura ativa (substitui o antigo take:10 all-time).
    const ultimasMateriasAtivo = ativo?.materias ?? []

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

      // Estatísticas calculadas — SOMENTE a legislatura ativa (ERR-069).
      estatisticas: {
        legislaturaAtual: {
          materias: materiasAutor,
          percentualMaterias,
          sessoes: sessoesPresente,
          totalSessoes,
          percentualPresenca,
          legislaturaLabel: ativo?.legislaturaLabel ?? null,
          dataAtualizacao: new Date().toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        },
        exercicioAtual: {
          materias: materiasAutor,
          percentualMaterias,
          sessoes: sessoesPresente,
          percentualPresenca
        }
      },

      // Estatísticas de matérias — da legislatura ativa
      estatisticasMaterias: {
        total: materiasAutor,
        aprovadas: aprovadasCount,
        emTramitacao: emTramitacaoCount,
        distribuicao: distribuicaoAtiva
      },

      // Últimas matérias/proposições — da legislatura ativa
      ultimasMaterias: ultimasMateriasAtivo,

      // Comissões
      comissoes: parlamentar.comissoes.map((mc: { comissao: { id: string; nome: string }; cargo: string; dataInicio: Date | null; dataFim: Date | null }) => ({
        id: mc.comissao.id,
        nome: mc.comissao.nome,
        cargo: mc.cargo,
        dataInicio: mc.dataInicio ? new Date(mc.dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
        dataFim: mc.dataFim ? new Date(mc.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Atual'
      })),

      // Mandatos (lista simples — compatibilidade)
      mandatos: parlamentar.mandatos.map(m => ({
        id: m.id,
        cargo: m.cargo,
        vinculo: m.cargo === 'VEREADOR' ? 'VEREADOR EM EXERCÍCIO' : 'MESA DIRETORA',
        legislatura: m.legislatura
          ? formatLegislaturaLabel(m.legislatura)
          : parlamentar.legislatura,
        periodo: m.dataInicio
          ? `${new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(m.dataInicio))}${m.dataFim ? ` a ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(m.dataFim))}` : ''}`
          : 'Atual',
        numeroVotos: m.numeroVotos,
        ativo: m.ativo
      })),

      // Mandatos DETALHADOS — presença + produção SEPARADAS por mandato (ERR-069).
      // O mandato ativo é o primeiro com legislaturaAtiva=true; os demais são
      // "mandatos anteriores".
      mandatosDetalhados: breakdown.detalhados,

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
        where: { parlamentarId },
        select: { presente: true, justificativa: true, sessao: { select: { data: true } } }
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

    // Presença/produção SEPARADAS POR MANDATO (ERR-069): o resumo do topo reflete
    // APENAS a legislatura ativa; os demais mandatos vêm em `mandatosDetalhados`.
    const breakdown = await computeMandatosBreakdown(parlamentarId, parlamentar.nome, parlamentar.mandatos)
    const ativo = breakdown.ativo
    const ini = ativo?.anoInicio ?? null
    const fim = ativo?.anoFim ?? null
    const noPeriodoAtivo = (d: Date | string | null | undefined) => {
      if (ini == null || fim == null || !d) return false
      const ano = new Date(d).getUTCFullYear()
      return ano >= ini && ano <= fim
    }

    const presencaResumo = calcularPresencaResumo(
      presencas
        .filter(p => noPeriodoAtivo(p.sessao?.data ?? null))
        .map(p => ({ presente: p.presente, justificativa: p.justificativa })),
      ativo?.presenca.totalSessoes ?? 0
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
      sessoesAgendadas,
      // Produção da legislatura ativa + breakdown por mandato (ERR-069)
      producaoResumo: ativo?.producao ?? null,
      legislaturaAtivaLabel: ativo?.legislaturaLabel ?? null,
      mandatosDetalhados: breakdown.detalhados
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
