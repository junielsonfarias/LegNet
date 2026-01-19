import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  validateId
} from '@/lib/error-handler'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// GET - Buscar perfil completo do parlamentar
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Parlamentar')

  // Buscar parlamentar com todos os relacionamentos
  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id },
    include: {
      mandatos: {
        include: {
          legislatura: true
        },
        orderBy: {
          dataInicio: 'desc'
        }
      },
      filiacoes: {
        orderBy: {
          dataInicio: 'desc'
        }
      },
      comissoes: {
        include: {
          comissao: true
        },
        orderBy: {
          dataInicio: 'desc'
        }
      },
      proposicoes: {
        orderBy: {
          dataApresentacao: 'desc'
        },
        take: 10,
        include: {
          sessao: true
        }
      },
      presencas: {
        include: {
          sessao: true
        }
      },
      votacoes: {
        include: {
          proposicao: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      }
    }
  })

  if (!parlamentar) {
    throw new NotFoundError('Parlamentar')
  }

  // Calcular estatísticas
  const totalSessoes = await prisma.sessao.count({
    where: {
      status: 'CONCLUIDA'
    }
  })

  const totalProposicoes = await prisma.proposicao.count()

  const sessoesPresente = parlamentar.presencas.filter(p => p.presente).length
  const percentualPresenca = totalSessoes > 0
    ? Math.round((sessoesPresente / totalSessoes) * 100 * 100) / 100
    : 0

  const materiasAutor = parlamentar.proposicoes.length
  const percentualMaterias = totalProposicoes > 0
    ? Math.round((materiasAutor / totalProposicoes) * 100 * 100) / 100
    : 0

  // Contar proposições por tipo
  const proposicoesPorTipo = await prisma.proposicao.groupBy({
    by: ['tipo'],
    where: {
      autorId: id
    },
    _count: {
      id: true
    }
  })

  // Contar proposições por status
  const proposicoesPorStatus = await prisma.proposicao.groupBy({
    by: ['status'],
    where: {
      autorId: id
    },
    _count: {
      id: true
    }
  })

  const aprovadasCount = proposicoesPorStatus.find(p => p.status === 'APROVADA')?._count?.id || 0
  const emTramitacaoCount = proposicoesPorStatus.find(p => p.status === 'EM_TRAMITACAO')?._count?.id || 0

  // Formatar dados para resposta
  const perfilCompleto = {
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
        dataAtualizacao: new Date().toLocaleDateString('pt-BR')
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
      data: p.dataApresentacao ? new Date(p.dataApresentacao).toLocaleDateString('pt-BR') : '',
      status: p.status,
      autor: parlamentar.nome
    })),

    // Comissões
    comissoes: parlamentar.comissoes.map(mc => ({
      id: mc.comissao.id,
      nome: mc.comissao.nome,
      cargo: mc.cargo,
      dataInicio: mc.dataInicio ? new Date(mc.dataInicio).toLocaleDateString('pt-BR') : '',
      dataFim: mc.dataFim ? new Date(mc.dataFim).toLocaleDateString('pt-BR') : 'Atual'
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
        ? `${new Date(m.dataInicio).toLocaleDateString('pt-BR')}${m.dataFim ? ` a ${new Date(m.dataFim).toLocaleDateString('pt-BR')}` : ''}`
        : 'Atual',
      numeroVotos: m.numeroVotos,
      ativo: m.ativo
    })),

    // Filiação partidária
    filiacaoPartidaria: parlamentar.filiacoes.map(f => ({
      id: f.id,
      partido: f.partido,
      dataInicio: f.dataInicio ? new Date(f.dataInicio).toLocaleDateString('pt-BR') : '',
      dataFim: f.dataFim ? new Date(f.dataFim).toLocaleDateString('pt-BR') : null,
      ativa: f.ativa
    })),

    // Votações recentes
    votacoesRecentes: parlamentar.votacoes.map(v => ({
      id: v.id,
      proposicaoId: v.proposicaoId,
      proposicaoNumero: v.proposicao ? `${v.proposicao.numero}/${v.proposicao.ano}` : '',
      proposicaoTitulo: v.proposicao?.ementa || '',
      voto: v.voto,
      data: v.createdAt ? new Date(v.createdAt).toLocaleDateString('pt-BR') : ''
    })),

    // Presenças recentes
    presencasRecentes: parlamentar.presencas
      .filter(p => p.sessao)
      .slice(0, 10)
      .map(p => ({
        sessaoId: p.sessaoId,
        sessaoNumero: p.sessao?.numero,
        sessaoData: p.sessao?.data ? new Date(p.sessao.data).toLocaleDateString('pt-BR') : '',
        presente: p.presente,
        justificativa: p.justificativa
      }))
  }

  return createSuccessResponse(perfilCompleto, 'Perfil do parlamentar carregado com sucesso')
})
