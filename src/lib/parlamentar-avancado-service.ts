import {
  ParlamentarCompleto,
  HistoricoLegislativo,
  ProducaoLegislativa,
  ComissaoParlamentar,
  FiliacaoPartidaria,
  AgendaParlamentar,
  EstatisticasParlamentar,
  RelatorioParlamentar,
  ComparativoParlamentares
} from './types/parlamentar-avancado';
import { parlamentaresData, parlamentaresService } from './parlamentares-data';

// Dados mock para histórico legislativo
const historicoLegislativo: HistoricoLegislativo[] = [
  {
    id: '1',
    parlamentarId: '1',
    legislaturaId: '1',
    periodo: '2021-2024',
    cargo: 'Presidente',
    partido: 'MDB',
    dataInicio: new Date('2021-01-01'),
    ativo: true
  },
  {
    id: '2',
    parlamentarId: '1',
    legislaturaId: '2',
    periodo: '2017-2020',
    cargo: 'Vereador',
    partido: 'MDB',
    dataInicio: new Date('2017-01-01'),
    dataFim: new Date('2020-12-31'),
    ativo: false
  },
  {
    id: '3',
    parlamentarId: '2',
    legislaturaId: '1',
    periodo: '2021-2024',
    cargo: 'Vice-Presidente',
    partido: 'Partido B',
    dataInicio: new Date('2021-01-01'),
    ativo: true
  }
];

// Dados mock para produção legislativa
const producaoLegislativa: ProducaoLegislativa[] = [
  {
    id: '1',
    parlamentarId: '1',
    legislaturaId: '1',
    ano: 2024,
    proposicoes: {
      projetosLei: 8,
      projetosResolucao: 3,
      projetosDecreto: 1,
      indicacoes: 12,
      requerimentos: 15,
      moções: 2,
      votosApreco: 4,
      votosCondolencias: 3,
      total: 48
    },
    participacao: {
      sessoesPresenciadas: 45,
      sessoesTotal: 48,
      percentualPresenca: 93.75,
      comissoesParticipou: 3,
      relatorias: 5,
      presidenciasComissao: 1
    },
    votacoes: {
      sim: 42,
      nao: 3,
      abstencoes: 1,
      ausencias: 2,
      total: 48
    }
  },
  {
    id: '2',
    parlamentarId: '2',
    legislaturaId: '1',
    ano: 2024,
    proposicoes: {
      projetosLei: 5,
      projetosResolucao: 2,
      projetosDecreto: 0,
      indicacoes: 8,
      requerimentos: 12,
      moções: 1,
      votosApreco: 2,
      votosCondolencias: 2,
      total: 32
    },
    participacao: {
      sessoesPresenciadas: 46,
      sessoesTotal: 48,
      percentualPresenca: 95.83,
      comissoesParticipou: 4,
      relatorias: 3,
      presidenciasComissao: 0
    },
    votacoes: {
      sim: 44,
      nao: 2,
      abstencoes: 0,
      ausencias: 2,
      total: 48
    }
  }
];

// Dados mock para comissões
const comissoesParlamentares: ComissaoParlamentar[] = [
  {
    id: '1',
    parlamentarId: '1',
    comissaoId: '1',
    cargo: 'presidente',
    dataInicio: new Date('2021-01-01'),
    ativo: true
  },
  {
    id: '2',
    parlamentarId: '2',
    comissaoId: '2',
    cargo: 'membro',
    dataInicio: new Date('2021-01-01'),
    ativo: true
  }
];

// Dados mock para filiação partidária
const filiacaoPartidaria: FiliacaoPartidaria[] = [
  {
    id: '1',
    parlamentarId: '1',
    partido: 'MDB',
    dataInicio: new Date('2016-01-01'),
    ativo: true
  },
  {
    id: '2',
    parlamentarId: '2',
    partido: 'Partido B',
    dataInicio: new Date('2018-01-01'),
    ativo: true
  }
];

// Dados mock para agenda
const agendaParlamentar: AgendaParlamentar[] = [
  {
    id: '1',
    parlamentarId: '1',
    data: new Date('2025-01-25'),
    hora: '09:00',
    tipo: 'sessao',
    titulo: 'Sessão Ordinária',
    descricao: 'Sessão ordinária da Câmara Municipal',
    local: 'Plenário da Câmara',
    status: 'agendada'
  },
  {
    id: '2',
    parlamentarId: '1',
    data: new Date('2025-01-24'),
    hora: '14:00',
    tipo: 'comissao',
    titulo: 'Reunião da Comissão de Finanças',
    descricao: 'Análise de projetos de lei financeiros',
    local: 'Sala da Comissão',
    status: 'agendada'
  }
];

// Dados mock para estatísticas
const estatisticasParlamentares: EstatisticasParlamentar[] = [
  {
    parlamentarId: '1',
    legislaturaAtual: '19ª',
    mandatos: 2,
    anosExperiencia: 8,
    produtividade: {
      proposicoesPorAno: 12,
      proposicoesAprovadas: 35,
      proposicoesRejeitadas: 5,
      taxaAprovacao: 87.5
    },
    participacao: {
      presencaSessoes: 93.75,
      presencaComissoes: 95.0,
      participacaoDebates: 85.0,
      relatorias: 15
    },
    influencia: {
      proposicoesCoautoria: 25,
      proposicoesApoiadas: 40,
      proposicoesApoiadasPor: 30,
      indiceInfluencia: 8.5
    },
    redeSocial: {
      seguidoresFacebook: 2500,
      seguidoresInstagram: 1800,
      seguidoresTwitter: 900,
      engajamentoMedio: 4.2
    },
    ultimaAtualizacao: new Date()
  }
];

// Serviço avançado de parlamentares
export const parlamentarAvancadoService = {
  // Obter parlamentar completo com todos os dados
  getParlamentarCompleto: (id: string): ParlamentarCompleto | undefined => {
    const parlamentar = parlamentaresService.getById(id);
    if (!parlamentar) return undefined;

    const historico = historicoLegislativo.filter(h => h.parlamentarId === id);
    const producao = producaoLegislativa.filter(p => p.parlamentarId === id);
    const comissoes = comissoesParlamentares.filter(c => c.parlamentarId === id);
    const filiacao = filiacaoPartidaria.filter(f => f.parlamentarId === id);
    const agenda = agendaParlamentar.filter(a => a.parlamentarId === id);
    const estatisticas = estatisticasParlamentares.find(e => e.parlamentarId === id);

    return {
      ...parlamentar,
      cargo: 'Vereador',
      legislatura: '19ª Legislatura (2021-2024)',
      historicoLegislativo: historico,
      producaoLegislativa: producao,
      comissoes: comissoes,
      filiacaoPartidaria: filiacao,
      agenda: agenda,
      estatisticas: estatisticas || {
        parlamentarId: id,
        legislaturaAtual: '19ª',
        mandatos: 1,
        anosExperiencia: 4,
        produtividade: {
          proposicoesPorAno: 0,
          proposicoesAprovadas: 0,
          proposicoesRejeitadas: 0,
          taxaAprovacao: 0
        },
        participacao: {
          presencaSessoes: 0,
          presencaComissoes: 0,
          participacaoDebates: 0,
          relatorias: 0
        },
        influencia: {
          proposicoesCoautoria: 0,
          proposicoesApoiadas: 0,
          proposicoesApoiadasPor: 0,
          indiceInfluencia: 0
        },
        redeSocial: {
          seguidoresFacebook: 0,
          seguidoresInstagram: 0,
          seguidoresTwitter: 0,
          engajamentoMedio: 0
        },
        ultimaAtualizacao: new Date()
      },
      proposicoes: {
        apresentadas: producao.reduce((acc, p) => acc + p.proposicoes.total, 0),
        aprovadas: 35,
        emTramitacao: 8,
        rejeitadas: 5,
        arquivadas: 2
      },
      presenca: {
        totalSessoes: 48,
        presenciadas: 45,
        ausencias: 3,
        percentual: 93.75
      },
      participacaoComissoes: {
        totalComissoes: comissoes.length,
        presidencias: comissoes.filter(c => c.cargo === 'presidente').length,
        relatorias: 5,
        participacao: 85.0
      }
    };
  },

  // Obter todos os parlamentares com dados completos
  getAllParlamentaresCompletos: (): ParlamentarCompleto[] => {
    const parlamentares = parlamentaresService.getAll();
    return parlamentares.map(p => parlamentarAvancadoService.getParlamentarCompleto(p.id)!);
  },

  // Obter histórico legislativo de um parlamentar
  getHistoricoLegislativo: (parlamentarId: string): HistoricoLegislativo[] => {
    return historicoLegislativo.filter(h => h.parlamentarId === parlamentarId);
  },

  // Obter produção legislativa de um parlamentar
  getProducaoLegislativa: (parlamentarId: string, ano?: number): ProducaoLegislativa[] => {
    let producao = producaoLegislativa.filter(p => p.parlamentarId === parlamentarId);
    if (ano) {
      producao = producao.filter(p => p.ano === ano);
    }
    return producao;
  },

  // Obter comissões de um parlamentar
  getComissoesParlamentar: (parlamentarId: string): ComissaoParlamentar[] => {
    return comissoesParlamentares.filter(c => c.parlamentarId === parlamentarId);
  },

  // Obter filiação partidária de um parlamentar
  getFiliacaoPartidaria: (parlamentarId: string): FiliacaoPartidaria[] => {
    return filiacaoPartidaria.filter(f => f.parlamentarId === parlamentarId);
  },

  // Obter agenda de um parlamentar
  getAgendaParlamentar: (parlamentarId: string, dataInicio?: Date, dataFim?: Date): AgendaParlamentar[] => {
    let agenda = agendaParlamentar.filter(a => a.parlamentarId === parlamentarId);
    
    if (dataInicio) {
      agenda = agenda.filter(a => a.data >= dataInicio);
    }
    
    if (dataFim) {
      agenda = agenda.filter(a => a.data <= dataFim);
    }
    
    return agenda.sort((a, b) => a.data.getTime() - b.data.getTime());
  },

  // Obter estatísticas de um parlamentar
  getEstatisticasParlamentar: (parlamentarId: string): EstatisticasParlamentar | undefined => {
    return estatisticasParlamentares.find(e => e.parlamentarId === parlamentarId);
  },

  // Gerar relatório de parlamentar
  gerarRelatorioParlamentar: (parlamentarId: string, tipo: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'legislatura'): RelatorioParlamentar => {
    const parlamentar = parlamentaresService.getById(parlamentarId);
    if (!parlamentar) {
      throw new Error('Parlamentar não encontrado');
    }

    const dataInicio = new Date('2024-01-01');
    const dataFim = new Date('2024-12-31');

    const producao = parlamentarAvancadoService.getProducaoLegislativa(parlamentarId, 2024);
    const comissoes = parlamentarAvancadoService.getComissoesParlamentar(parlamentarId);
    const agenda = parlamentarAvancadoService.getAgendaParlamentar(parlamentarId, dataInicio, dataFim);

    return {
      id: `relatorio-${parlamentarId}-${Date.now()}`,
      parlamentarId,
      periodo: { inicio: dataInicio, fim: dataFim },
      tipo,
      dados: {
        proposicoes: producao[0] || {
          id: '1',
          parlamentarId,
          legislaturaId: '1',
          ano: 2024,
          proposicoes: {
            projetosLei: 0,
            projetosResolucao: 0,
            projetosDecreto: 0,
            indicacoes: 0,
            requerimentos: 0,
            moções: 0,
            votosApreco: 0,
            votosCondolencias: 0,
            total: 0
          },
          participacao: {
            sessoesPresenciadas: 0,
            sessoesTotal: 48,
            percentualPresenca: 0,
            comissoesParticipou: 0,
            relatorias: 0,
            presidenciasComissao: 0
          },
          votacoes: {
            sim: 0,
            nao: 0,
            abstencoes: 0,
            ausencias: 0,
            total: 0
          }
        },
        participacao: {
          sessoes: agenda.filter(a => a.tipo === 'sessao').length,
          comissoes: agenda.filter(a => a.tipo === 'comissao').length,
          eventos: agenda.filter(a => a.tipo === 'evento').length
        },
        votacoes: {
          total: 48,
          sim: 42,
          nao: 3,
          abstencoes: 1,
          ausencias: 2
        },
        comissoes,
        agenda
      },
      geradoEm: new Date(),
      geradoPor: 'Sistema'
    };
  },

  // Gerar comparativo entre parlamentares
  gerarComparativoParlamentares: (): ComparativoParlamentares => {
    const parlamentares = parlamentaresService.getAll();
    const dataInicio = new Date('2024-01-01');
    const dataFim = new Date('2024-12-31');

    const parlamentaresComDados = parlamentares.map((p, index) => {
      const estatisticas = estatisticasParlamentares.find(e => e.parlamentarId === p.id);
      const producao = producaoLegislativa.find(pr => pr.parlamentarId === p.id);

      const pontuacao = 
        (producao?.proposicoes.total || 0) * 2 +
        (estatisticas?.participacao.presencaSessoes || 0) * 1.5 +
        (estatisticas?.participacao.participacaoDebates || 0) * 1 +
        (estatisticas?.influencia.indiceInfluencia || 0) * 3;

      return {
        id: p.id,
        nome: p.nome,
        partido: p.partido,
        ranking: index + 1,
        pontuacao: Math.round(pontuacao),
        dados: {
          proposicoes: producao?.proposicoes.total || 0,
          aprovacoes: estatisticas?.produtividade.proposicoesAprovadas || 0,
          presenca: estatisticas?.participacao.presencaSessoes || 0,
          participacao: estatisticas?.participacao.participacaoDebates || 0
        }
      };
    }).sort((a, b) => b.pontuacao - a.pontuacao);

    // Atualizar rankings
    parlamentaresComDados.forEach((p, index) => {
      p.ranking = index + 1;
    });

    const metricas = {
      mediaProposicoes: parlamentaresComDados.reduce((acc, p) => acc + p.dados.proposicoes, 0) / parlamentaresComDados.length,
      mediaAprovacoes: parlamentaresComDados.reduce((acc, p) => acc + p.dados.aprovacoes, 0) / parlamentaresComDados.length,
      mediaPresenca: parlamentaresComDados.reduce((acc, p) => acc + p.dados.presenca, 0) / parlamentaresComDados.length,
      mediaParticipacao: parlamentaresComDados.reduce((acc, p) => acc + p.dados.participacao, 0) / parlamentaresComDados.length
    };

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      parlamentares: parlamentaresComDados,
      metricas,
      geradoEm: new Date()
    };
  },

  // Estatísticas gerais
  getEstatisticasGerais: () => {
    const parlamentares = parlamentaresService.getAll();
    const totalProposicoes = producaoLegislativa.reduce((acc, p) => acc + p.proposicoes.total, 0);
    const mediaPresenca = producaoLegislativa.reduce((acc, p) => acc + p.participacao.percentualPresenca, 0) / producaoLegislativa.length;
    const totalRelatorias = producaoLegislativa.reduce((acc, p) => acc + p.participacao.relatorias, 0);

    return {
      totalParlamentares: parlamentares.length,
      totalProposicoes,
      mediaPresenca: Math.round(mediaPresenca * 100) / 100,
      totalRelatorias,
      parlamentaresMaisProdutivos: parlamentaresCompletos
        .sort((a, b) => b.proposicoes.apresentadas - a.proposicoes.apresentadas)
        .slice(0, 5)
        .map(p => ({
          nome: p.nome,
          proposicoes: p.proposicoes.apresentadas
        })),
      parlamentaresComMaiorPresenca: parlamentaresCompletos
        .sort((a, b) => b.presenca.percentual - a.presenca.percentual)
        .slice(0, 5)
        .map(p => ({
          nome: p.nome,
          presenca: p.presenca.percentual
        }))
    };
  }
};

// Pré-carregar dados completos
const parlamentaresCompletos = parlamentarAvancadoService.getAllParlamentaresCompletos();
