import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  UnauthorizedError,
  validateId
} from '@/lib/error-handler'
import { calcularPrazoRestante } from '@/lib/services/deadline-service'

export const dynamic = 'force-dynamic'

interface ProposicaoPendenteData {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  autorNome: string | null
  dataDistribuicao: Date | null
  prazo: {
    dias: number
    status: 'ok' | 'warning' | 'expired'
    mensagem: string
  }
}

// GET - Dados agregados para dashboard da comissao
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError()
  }

  const id = validateId(params.id, 'Comissao')

  // Verificar se comissao existe
  const comissao = await prisma.comissao.findUnique({
    where: { id },
    include: {
      membros: {
        where: { ativo: true },
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true
            }
          }
        },
        orderBy: { cargo: 'asc' }
      }
    }
  })

  if (!comissao) {
    throw new NotFoundError('Comissao')
  }

  const anoAtual = new Date().getFullYear()

  // Buscar proposicoes pendentes (tramitadas para esta comissao sem parecer)
  const tramitacoesPendentes = await prisma.tramitacao.findMany({
    where: {
      status: 'EM_ANDAMENTO',
      OR: [
        { unidade: { nome: { contains: comissao.nome } } },
        ...(comissao.sigla ? [{ unidade: { nome: { contains: comissao.sigla } } }] : [])
      ]
    },
    include: {
      proposicao: {
        include: {
          autor: true,
          pareceres: {
            where: { comissaoId: id }
          }
        }
      }
    },
    orderBy: { dataEntrada: 'asc' }
  })

  // Filtrar proposicoes sem parecer
  const proposicoesPendentes: ProposicaoPendenteData[] = tramitacoesPendentes
    .filter(t => t.proposicao.pareceres.length === 0)
    .map(t => {
      const prazoResult = t.dataEntrada
        ? calcularPrazoRestante(t.dataEntrada)
        : { dias: 15, status: 'ok' as const, mensagem: 'Sem data de distribuicao' }

      return {
        id: t.proposicao.id,
        tipo: t.proposicao.tipo,
        numero: t.proposicao.numero,
        ano: t.proposicao.ano,
        ementa: t.proposicao.ementa,
        autorNome: t.proposicao.autor?.nome || null,
        dataDistribuicao: t.dataEntrada,
        prazo: {
          dias: prazoResult.dias,
          status: prazoResult.status,
          mensagem: prazoResult.mensagem
        }
      }
    })

  // Contagens por status de prazo
  const prazosContagem = {
    expiradas: proposicoesPendentes.filter(p => p.prazo.status === 'expired').length,
    alertas: proposicoesPendentes.filter(p => p.prazo.status === 'warning').length,
    ok: proposicoesPendentes.filter(p => p.prazo.status === 'ok').length
  }

  // Proximas reunioes
  const proximasReunioes = await prisma.reuniaoComissao.findMany({
    where: {
      comissaoId: id,
      status: { in: ['AGENDADA', 'CONVOCADA'] },
      data: { gte: new Date() }
    },
    orderBy: { data: 'asc' },
    take: 5,
    include: {
      _count: {
        select: { itens: true }
      }
    }
  })

  // Pareceres em andamento (ainda nao votados)
  const pareceresEmAndamento = await prisma.parecer.findMany({
    where: {
      comissaoId: id,
      status: { in: ['RASCUNHO', 'AGUARDANDO_VOTACAO'] }
    },
    include: {
      proposicao: {
        select: {
          id: true,
          tipo: true,
          numero: true,
          ano: true
        }
      },
      relator: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Estatisticas do ano
  const estatisticas = await Promise.all([
    // Total de reunioes realizadas
    prisma.reuniaoComissao.count({
      where: { comissaoId: id, ano: anoAtual, status: 'CONCLUIDA' }
    }),
    // Total de pareceres emitidos
    prisma.parecer.count({
      where: {
        comissaoId: id,
        status: { in: ['EMITIDO', 'APROVADO_COMISSAO', 'REJEITADO_COMISSAO'] },
        dataEmissao: {
          gte: new Date(anoAtual, 0, 1),
          lte: new Date(anoAtual, 11, 31)
        }
      }
    }),
    // Total de proposicoes analisadas (com parecer)
    prisma.parecer.count({
      where: { comissaoId: id, createdAt: { gte: new Date(anoAtual, 0, 1) } }
    })
  ])

  const [reunioesRealizadas, pareceresEmitidos, proposicoesAnalisadas] = estatisticas

  // Ultima reuniao realizada
  const ultimaReuniao = await prisma.reuniaoComissao.findFirst({
    where: {
      comissaoId: id,
      status: 'CONCLUIDA'
    },
    orderBy: { data: 'desc' }
  })

  return createSuccessResponse({
    comissao: {
      id: comissao.id,
      nome: comissao.nome,
      sigla: comissao.sigla,
      tipo: comissao.tipo,
      ativa: comissao.ativa,
      membros: comissao.membros.map(m => ({
        id: m.id,
        cargo: m.cargo,
        parlamentarId: m.parlamentarId,
        nome: m.parlamentar.apelido || m.parlamentar.nome
      }))
    },
    proposicoesPendentes,
    prazosContagem,
    proximasReunioes: proximasReunioes.map(r => ({
      id: r.id,
      numero: r.numero,
      ano: r.ano,
      tipo: r.tipo,
      status: r.status,
      data: r.data,
      horaInicio: r.horaInicio,
      local: r.local,
      totalItens: r._count.itens
    })),
    pareceresEmAndamento: pareceresEmAndamento.map(p => ({
      id: p.id,
      numero: p.numero,
      tipo: p.tipo,
      status: p.status,
      proposicao: p.proposicao,
      relatorNome: p.relator?.apelido || p.relator?.nome || 'Nao designado'
    })),
    estatisticas: {
      ano: anoAtual,
      reunioesRealizadas,
      pareceresEmitidos,
      proposicoesAnalisadas,
      proposicoesPendentes: proposicoesPendentes.length
    },
    ultimaReuniao: ultimaReuniao ? {
      id: ultimaReuniao.id,
      numero: ultimaReuniao.numero,
      data: ultimaReuniao.data
    } : null
  }, 'Dashboard carregado com sucesso')
})
