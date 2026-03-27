/**
 * Serviço de Dashboard
 * Centraliza a lógica de dados para estatísticas, atividades recentes e eventos
 */

import { prisma } from '@/lib/prisma'

// ============================================================
// Tipos
// ============================================================

export interface AtividadeRecente {
  id: string
  type: 'proposicao' | 'votacao' | 'sessao' | 'parecer' | 'usuario' | 'comissao'
  title: string
  description: string
  timestamp: Date
  status: 'success' | 'warning' | 'pending'
  user?: string
}

export interface ProximoEvento {
  id: string
  title: string
  type: 'sessao' | 'reuniao' | 'audiencia'
  date: Date
  time: string
  location?: string
  attendees?: number
}

// ============================================================
// Serviço
// ============================================================

export const dashboardService = {
  /**
   * Retorna todas as estatísticas do dashboard
   */
  async getStats(userRole: string, userId?: string) {
    // Buscar configuração institucional
    const configInstitucional = await prisma.configuracaoInstitucional.findFirst({
      where: { slug: 'principal' }
    })

    // Buscar legislatura ativa
    const legislaturaAtiva = await prisma.legislatura.findFirst({
      where: { ativa: true },
      include: {
        periodos: {
          where: {
            dataInicio: { lte: new Date() },
            OR: [
              { dataFim: null },
              { dataFim: { gte: new Date() } }
            ]
          },
          orderBy: { numero: 'desc' },
          take: 1
        }
      }
    })

    // Contagens básicas
    const [
      totalParlamentares,
      parlamentaresAtivos,
      totalSessoes,
      sessoesRealizadas,
      sessoesAgendadas,
      totalProposicoes,
      proposicoesAprovadas,
      proposicoesEmTramitacao,
      proposicoesPendentes,
      totalComissoes,
      comissoesAtivas,
      totalMembrosComissao,
      totalNoticias,
      totalUsuarios,
      votacoesHoje
    ] = await Promise.all([
      prisma.parlamentar.count(),
      prisma.parlamentar.count({ where: { ativo: true } }),
      prisma.sessao.count(),
      prisma.sessao.count({ where: { status: 'CONCLUIDA' } }),
      prisma.sessao.count({ where: { status: 'AGENDADA' } }),
      prisma.proposicao.count(),
      prisma.proposicao.count({ where: { status: 'APROVADA' } }),
      prisma.proposicao.count({ where: { status: 'EM_TRAMITACAO' } }),
      prisma.proposicao.count({
        where: {
          status: { in: ['APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA'] }
        }
      }),
      prisma.comissao.count(),
      prisma.comissao.count({ where: { ativa: true } }),
      prisma.membroComissao.count({ where: { ativo: true } }),
      prisma.noticia.count(),
      prisma.user.count(),
      // Votações de hoje
      prisma.votacao.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ])

    // Buscar próxima sessão agendada
    const proximaSessao = await prisma.sessao.findFirst({
      where: {
        status: 'AGENDADA',
        data: { gte: new Date() }
      },
      orderBy: { data: 'asc' },
      select: {
        id: true,
        numero: true,
        tipo: true,
        data: true,
        horario: true
      }
    })

    // Sessão em andamento (se houver)
    const sessaoEmAndamento = await prisma.sessao.findFirst({
      where: { status: 'EM_ANDAMENTO' },
      include: {
        presencas: true,
        pautaSessao: {
          include: {
            itens: true
          }
        }
      }
    })

    // Estatísticas específicas para PARLAMENTAR
    let estatisticasParlamentar: { minhasProposicoes: number; aprovadas: number; emTramitacao: number } | null = null
    if (userRole === 'PARLAMENTAR' && userId) {
      const parlamentar = await prisma.parlamentar.findFirst({
        where: {
          usuario: { id: userId }
        }
      })

      if (parlamentar) {
        const [minhasProposicoes, aprovadas, emTramitacao] = await Promise.all([
          prisma.proposicao.count({ where: { autorId: parlamentar.id } }),
          prisma.proposicao.count({ where: { autorId: parlamentar.id, status: 'APROVADA' } }),
          prisma.proposicao.count({ where: { autorId: parlamentar.id, status: 'EM_TRAMITACAO' } })
        ])

        estatisticasParlamentar = {
          minhasProposicoes,
          aprovadas,
          emTramitacao
        }
      }
    }

    // Calcular presença média (se houver sessões concluídas)
    let presencaMedia = 0
    if (sessoesRealizadas > 0) {
      const presencas = await prisma.presencaSessao.groupBy({
        by: ['presente'],
        _count: true
      })
      const totalPresencas = presencas.reduce((acc, p) => acc + p._count, 0)
      const presentes = presencas.find(p => p.presente === true)?._count || 0
      presencaMedia = totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : 0
    }

    // Contar logs de hoje (para estatísticas do sistema)
    let logsHoje = 0
    try {
      logsHoje = await prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    } catch {
      // AuditLog pode não existir ainda - esperado em setup inicial
      logsHoje = 0
    }

    // Montar resposta
    return {
      // Dados institucionais
      instituicao: {
        nome: configInstitucional?.nomeCasa || 'Câmara Municipal',
        sigla: configInstitucional?.sigla || null,
        cidade: configInstitucional?.enderecoCidade || null,
        estado: configInstitucional?.enderecoEstado || null,
        legislatura: legislaturaAtiva ? {
          id: legislaturaAtiva.id,
          numero: legislaturaAtiva.numero,
          descricao: `${legislaturaAtiva.anoInicio}/${legislaturaAtiva.anoFim}`,
          periodoAtual: legislaturaAtiva.periodos[0] ? {
            numero: legislaturaAtiva.periodos[0].numero,
            descricao: legislaturaAtiva.periodos[0].descricao
          } : null
        } : null
      },

      // Contagens gerais
      parlamentares: {
        total: totalParlamentares,
        ativos: parlamentaresAtivos,
        presencaMedia
      },
      sessoes: {
        total: totalSessoes,
        realizadas: sessoesRealizadas,
        agendadas: sessoesAgendadas,
        canceladas: totalSessoes - sessoesRealizadas - sessoesAgendadas
      },
      proposicoes: {
        total: totalProposicoes,
        aprovadas: proposicoesAprovadas,
        emTramitacao: proposicoesEmTramitacao,
        pendentes: proposicoesPendentes,
        rejeitadas: totalProposicoes - proposicoesAprovadas - proposicoesEmTramitacao - proposicoesPendentes
      },
      comissoes: {
        total: totalComissoes,
        ativas: comissoesAtivas,
        membros: totalMembrosComissao
      },
      noticias: {
        total: totalNoticias
      },

      // Estatísticas do dia
      hoje: {
        votacoes: votacoesHoje
      },

      // Sistema
      sistema: {
        usuarios: totalUsuarios,
        logsHoje,
        uptime: '99.9%' // TODO: Implementar monitoramento real
      },

      // Sessão atual/próxima
      sessaoAtual: sessaoEmAndamento ? {
        id: sessaoEmAndamento.id,
        numero: sessaoEmAndamento.numero,
        tipo: sessaoEmAndamento.tipo,
        presentes: sessaoEmAndamento.presencas.filter(p => p.presente).length,
        totalParlamentares: parlamentaresAtivos,
        itensNaPauta: sessaoEmAndamento.pautaSessao?.itens.length || 0
      } : null,

      proximaSessao: proximaSessao ? {
        id: proximaSessao.id,
        numero: proximaSessao.numero,
        tipo: proximaSessao.tipo,
        data: proximaSessao.data,
        horario: proximaSessao.horario
      } : null,

      // Estatísticas específicas do parlamentar (se aplicável)
      parlamentar: estatisticasParlamentar
    }
  },

  /**
   * Retorna atividades recentes do sistema
   */
  async getAtividades(limit: number = 10): Promise<AtividadeRecente[]> {
    const atividades: AtividadeRecente[] = []

    // Buscar proposições recentes
    const proposicoesRecentes = await prisma.proposicao.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        autor: {
          select: { nome: true, apelido: true }
        }
      }
    })

    proposicoesRecentes.forEach(p => {
      atividades.push({
        id: `prop-${p.id}`,
        type: 'proposicao',
        title: `${p.tipo} ${String(p.numero).padStart(3, '0')}/${p.ano} cadastrado`,
        description: p.titulo || p.ementa?.substring(0, 60) + '...' || 'Sem descrição',
        timestamp: p.createdAt,
        status: p.status === 'APROVADA' ? 'success' : p.status === 'REJEITADA' ? 'warning' : 'pending',
        user: p.autor?.apelido || p.autor?.nome
      })
    })

    // Buscar sessões recentes
    const sessoesRecentes = await prisma.sessao.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    sessoesRecentes.forEach(s => {
      const statusMap = {
        'CONCLUIDA': 'success' as const,
        'CANCELADA': 'warning' as const,
        'AGENDADA': 'pending' as const,
        'EM_ANDAMENTO': 'pending' as const
      }
      atividades.push({
        id: `sessao-${s.id}`,
        type: 'sessao',
        title: s.status === 'AGENDADA' ? 'Sessão agendada' : s.status === 'CONCLUIDA' ? 'Sessão concluída' : 'Sessão atualizada',
        description: `${s.tipo} ${String(s.numero).padStart(3, '0')} - ${new Date(s.data).toLocaleDateString('pt-BR')}`,
        timestamp: s.updatedAt,
        status: statusMap[s.status] || 'pending'
      })
    })

    // Buscar votações agrupadas recentes (com resultado)
    const votacoesRecentes = await prisma.votacaoAgrupada.findMany({
      where: { resultado: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Buscar proposições relacionadas
    const proposicaoIds = votacoesRecentes.map(v => v.proposicaoId)
    const proposicoes = await prisma.proposicao.findMany({
      where: { id: { in: proposicaoIds } },
      select: { id: true, numero: true, ano: true, tipo: true }
    })
    const proposicoesMap = new Map(proposicoes.map(p => [p.id, p]))

    votacoesRecentes.forEach(v => {
      const prop = proposicoesMap.get(v.proposicaoId)
      const resultadoTexto = v.resultado === 'APROVADA' ? 'aprovado' : v.resultado === 'REJEITADA' ? 'rejeitado' : 'votado'
      atividades.push({
        id: `votacao-${v.id}`,
        type: 'votacao',
        title: 'Votacao concluida',
        description: prop
          ? `${prop.tipo} ${String(prop.numero).padStart(3, '0')}/${prop.ano} ${resultadoTexto} (${v.votosSim || 0}x${v.votosNao || 0})`
          : `Votacao ${resultadoTexto}`,
        timestamp: v.createdAt,
        status: v.resultado === 'APROVADA' ? 'success' : v.resultado === 'REJEITADA' ? 'warning' : 'pending'
      })
    })

    // Buscar pareceres recentes
    const pareceresRecentes = await prisma.parecer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        comissao: { select: { sigla: true, nome: true } },
        relator: { select: { apelido: true, nome: true } },
        proposicao: { select: { numero: true, ano: true, tipo: true } }
      }
    })

    pareceresRecentes.forEach(p => {
      const tipoTexto = p.tipo === 'FAVORAVEL' ? 'Favorável' : p.tipo === 'CONTRARIO' ? 'Contrário' : p.tipo
      atividades.push({
        id: `parecer-${p.id}`,
        type: 'parecer',
        title: 'Parecer emitido',
        description: p.proposicao && p.comissao
          ? `${p.comissao.sigla || p.comissao.nome}: ${tipoTexto} ao ${p.proposicao.tipo} ${p.proposicao.numero}/${p.proposicao.ano}`
          : `Parecer ${tipoTexto}`,
        timestamp: p.createdAt,
        status: p.tipo === 'FAVORAVEL' ? 'success' : 'warning',
        user: p.relator?.apelido || p.relator?.nome
      })
    })

    // Buscar usuários criados recentemente
    const usuariosRecentes = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, name: true, role: true, createdAt: true }
    })

    usuariosRecentes.forEach(u => {
      atividades.push({
        id: `user-${u.id}`,
        type: 'usuario',
        title: 'Novo usuário cadastrado',
        description: `${u.name} (${u.role})`,
        timestamp: u.createdAt,
        status: 'success'
      })
    })

    // Ordenar por timestamp e limitar
    atividades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return atividades.slice(0, limit)
  },

  /**
   * Retorna próximos eventos (sessões, reuniões, audiências)
   */
  async getEventos(limit: number = 10): Promise<ProximoEvento[]> {
    const agora = new Date()
    const eventos: ProximoEvento[] = []

    // Buscar sessões agendadas
    const sessoesAgendadas = await prisma.sessao.findMany({
      where: {
        status: { in: ['AGENDADA', 'EM_ANDAMENTO'] },
        data: { gte: agora }
      },
      orderBy: { data: 'asc' },
      take: 10
    })

    // Buscar total de parlamentares ativos para número de participantes
    const totalParlamentaresAtivos = await prisma.parlamentar.count({ where: { ativo: true } })

    sessoesAgendadas.forEach(s => {
      const tipoFormatado = {
        'ORDINARIA': 'Ordinária',
        'EXTRAORDINARIA': 'Extraordinária',
        'SOLENE': 'Solene',
        'ESPECIAL': 'Especial'
      }[s.tipo] || s.tipo

      eventos.push({
        id: `sessao-${s.id}`,
        title: `Sessão ${tipoFormatado} ${String(s.numero).padStart(3, '0')}`,
        type: 'sessao',
        date: s.data,
        time: s.horario || '09:00',
        location: s.local || 'Plenário',
        attendees: totalParlamentaresAtivos
      })
    })

    // Buscar reuniões de comissão agendadas
    const reunioesAgendadas = await prisma.reuniaoComissao.findMany({
      where: {
        status: { in: ['AGENDADA', 'EM_ANDAMENTO'] },
        data: { gte: agora }
      },
      orderBy: { data: 'asc' },
      take: 10,
      include: {
        comissao: {
          include: {
            membros: {
              where: { ativo: true },
              select: { id: true }
            }
          }
        }
      }
    })

    reunioesAgendadas.forEach(r => {
      // Formatar hora a partir de horaInicio se disponível
      const horaFormatada = r.horaInicio
        ? `${r.horaInicio.getHours().toString().padStart(2, '0')}:${r.horaInicio.getMinutes().toString().padStart(2, '0')}`
        : '14:00'
      eventos.push({
        id: `reuniao-${r.id}`,
        title: `Reuniao ${r.comissao.sigla || r.comissao.nome}`,
        type: 'reuniao',
        date: r.data,
        time: horaFormatada,
        location: r.local || 'Sala de Comissoes',
        attendees: r.comissao.membros?.length || 0
      })
    })

    // TODO: Audiências públicas - modelo ainda não implementado

    // Ordenar por data e limitar
    eventos.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return eventos.slice(0, limit)
  }
}
