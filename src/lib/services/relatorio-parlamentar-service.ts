import { prisma } from '@/lib/prisma'

export const relatorioParlamentarService = {
  async gerarRelatorio(parlamentarId: string, ano?: number) {
    const anoFilter = ano ? { ano } : {}
    const dateFilter = ano
      ? {
          createdAt: {
            gte: new Date(`${ano}-01-01`),
            lt: new Date(`${ano + 1}-01-01`),
          },
        }
      : {}

    const [
      parlamentar,
      presencas,
      proposicoes,
      comissoes,
      discursos,
      diarias,
      verbas,
    ] = await Promise.all([
      prisma.parlamentar.findUniqueOrThrow({
        where: { id: parlamentarId },
        include: {
          mandatos: { orderBy: { dataInicio: 'desc' }, take: 1 },
        },
      }),

      prisma.presencaSessao.count({
        where: {
          parlamentarId,
          presente: true,
          ...(ano
            ? {
                sessao: {
                  data: {
                    gte: new Date(`${ano}-01-01`),
                    lt: new Date(`${ano + 1}-01-01`),
                  },
                },
              }
            : {}),
        },
      }),

      prisma.proposicao.count({
        where: {
          autorId: parlamentarId,
          ...anoFilter,
        },
      }),

      prisma.membroComissao.findMany({
        where: {
          parlamentarId,
          ativo: true,
        },
        include: {
          comissao: { select: { id: true, nome: true, sigla: true, tipo: true } },
        },
      }),

      prisma.oradorSessao.count({
        where: {
          parlamentarId,
          ...(ano
            ? {
                sessao: {
                  data: {
                    gte: new Date(`${ano}-01-01`),
                    lt: new Date(`${ano + 1}-01-01`),
                  },
                },
              }
            : {}),
        },
      }),

      prisma.diaria.aggregate({
        where: {
          parlamentarId,
          ...anoFilter,
        },
        _sum: { valorTotal: true },
        _count: { _all: true },
      }),

      prisma.verbaIndenizatoria.aggregate({
        where: {
          parlamentarId,
          ...anoFilter,
        },
        _sum: { valor: true },
        _count: { _all: true },
      }),
    ])

    const totalSessoes = await prisma.presencaSessao.count({
      where: {
        parlamentarId,
        ...(ano
          ? {
              sessao: {
                data: {
                  gte: new Date(`${ano}-01-01`),
                  lt: new Date(`${ano + 1}-01-01`),
                },
              },
            }
          : {}),
      },
    })

    return {
      parlamentar: {
        id: parlamentar.id,
        nome: parlamentar.nome,
        partido: parlamentar.partido,
        foto: parlamentar.foto,
        email: parlamentar.email,
        mandatoAtual: parlamentar.mandatos[0] ?? null,
      },
      ano: ano ?? null,
      presenca: {
        total: totalSessoes,
        presentes: presencas,
        percentual: totalSessoes > 0 ? Math.round((presencas / totalSessoes) * 100 * 10) / 10 : 0,
      },
      proposicoes: {
        total: proposicoes,
      },
      comissoes: comissoes.map((m) => ({
        comissaoId: m.comissao.id,
        nome: m.comissao.nome,
        sigla: m.comissao.sigla,
        tipo: m.comissao.tipo,
        cargo: m.cargo,
      })),
      discursos: {
        total: discursos,
      },
      diarias: {
        total: diarias._sum.valorTotal ?? 0,
        quantidade: diarias._count._all,
      },
      verbas: {
        total: verbas._sum.valor ?? 0,
        quantidade: verbas._count._all,
      },
    }
  },
}
