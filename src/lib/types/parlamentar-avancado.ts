// Interfaces avançadas para parlamentares com histórico legislativo completo

export interface HistoricoLegislativo {
  id: string;
  parlamentarId: string;
  legislaturaId: string;
  periodo: string;
  cargo: string;
  partido: string;
  dataInicio: Date;
  dataFim?: Date;
  ativo: boolean;
  observacoes?: string;
}

export interface ProducaoLegislativa {
  id: string;
  parlamentarId: string;
  legislaturaId: string;
  ano: number;
  proposicoes: {
    projetosLei: number;
    projetosResolucao: number;
    projetosDecreto: number;
    indicacoes: number;
    requerimentos: number;
    moções: number;
    votosApreco: number;
    votosCondolencias: number;
    total: number;
  };
  participacao: {
    sessoesPresenciadas: number;
    sessoesTotal: number;
    percentualPresenca: number;
    comissoesParticipou: number;
    relatorias: number;
    presidenciasComissao: number;
  };
  votacoes: {
    sim: number;
    nao: number;
    abstencoes: number;
    ausencias: number;
    total: number;
  };
}

export interface ComissaoParlamentar {
  id: string;
  parlamentarId: string;
  comissaoId: string;
  cargo: 'presidente' | 'vice_presidente' | 'relator' | 'membro';
  dataInicio: Date;
  dataFim?: Date;
  ativo: boolean;
}

export interface FiliacaoPartidaria {
  id: string;
  parlamentarId: string;
  partido: string;
  dataInicio: Date;
  dataFim?: Date;
  ativo: boolean;
  observacoes?: string;
}

export interface AgendaParlamentar {
  id: string;
  parlamentarId: string;
  data: Date;
  hora: string;
  tipo: 'sessao' | 'comissao' | 'evento' | 'reuniao' | 'audiencia';
  titulo: string;
  descricao: string;
  local: string;
  status: 'agendada' | 'realizada' | 'cancelada';
  observacoes?: string;
}

export interface EstatisticasParlamentar {
  parlamentarId: string;
  legislaturaAtual: string;
  mandatos: number;
  anosExperiencia: number;
  produtividade: {
    proposicoesPorAno: number;
    proposicoesAprovadas: number;
    proposicoesRejeitadas: number;
    taxaAprovacao: number;
  };
  participacao: {
    presencaSessoes: number;
    presencaComissoes: number;
    participacaoDebates: number;
    relatorias: number;
  };
  influencia: {
    proposicoesCoautoria: number;
    proposicoesApoiadas: number;
    proposicoesApoiadasPor: number;
    indiceInfluencia: number;
  };
  redeSocial: {
    seguidoresFacebook: number;
    seguidoresInstagram: number;
    seguidoresTwitter: number;
    engajamentoMedio: number;
  };
  ultimaAtualizacao: Date;
}

export interface ParlamentarCompleto {
  // Dados básicos (herdados da interface original)
  id: string;
  nome: string;
  apelido: string;
  cargo: string;
  partido: string;
  legislatura: string;
  foto?: string;
  email?: string;
  telefone?: string;
  gabinete?: string;
  telefoneGabinete?: string;
  biografia?: string;
  redesSociais?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  ativo: boolean;
  
  // Dados avançados
  historicoLegislativo: HistoricoLegislativo[];
  producaoLegislativa: ProducaoLegislativa[];
  comissoes: ComissaoParlamentar[];
  filiacaoPartidaria: FiliacaoPartidaria[];
  agenda: AgendaParlamentar[];
  estatisticas: EstatisticasParlamentar;
  
  // Dados de tramitação
  proposicoes: {
    apresentadas: number;
    aprovadas: number;
    emTramitacao: number;
    rejeitadas: number;
    arquivadas: number;
  };
  
  // Dados de sessões
  presenca: {
    totalSessoes: number;
    presenciadas: number;
    ausencias: number;
    percentual: number;
  };
  
  // Dados de comissões
  participacaoComissoes: {
    totalComissoes: number;
    presidencias: number;
    relatorias: number;
    participacao: number;
  };
}

export interface RelatorioParlamentar {
  id: string;
  parlamentarId: string;
  periodo: {
    inicio: Date;
    fim: Date;
  };
  tipo: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'legislatura';
  dados: {
    proposicoes: ProducaoLegislativa;
    participacao: {
      sessoes: number;
      comissoes: number;
      eventos: number;
    };
    votacoes: {
      total: number;
      sim: number;
      nao: number;
      abstencoes: number;
      ausencias: number;
    };
    comissoes: ComissaoParlamentar[];
    agenda: AgendaParlamentar[];
  };
  geradoEm: Date;
  geradoPor: string;
}

export interface ComparativoParlamentares {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  parlamentares: {
    id: string;
    nome: string;
    partido: string;
    ranking: number;
    pontuacao: number;
    dados: {
      proposicoes: number;
      aprovacoes: number;
      presenca: number;
      participacao: number;
    };
  }[];
  metricas: {
    mediaProposicoes: number;
    mediaAprovacoes: number;
    mediaPresenca: number;
    mediaParticipacao: number;
  };
  geradoEm: Date;
}
