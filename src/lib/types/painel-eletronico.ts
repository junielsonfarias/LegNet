// Interfaces para o Painel Eletrônico de Sessões

export interface PainelSessao {
  id: string;
  numeroSessao: string;
  tipo: 'ordinaria' | 'extraordinaria' | 'especial' | 'solene';
  data: Date;
  horarioInicio: string;
  horarioFim?: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  presidente: string;
  secretario: string;
  local: string;
  transmissao: {
    ativa: boolean;
    url?: string;
    plataforma?: 'youtube' | 'facebook' | 'zoom' | 'outro';
  };
  informacoes: {
    totalItens: number;
    itemAtual: number;
    tempoEstimado: number; // em minutos
    tempoRestante?: number;
  };
}

export interface PautaItem {
  id: string;
  ordem: number;
  tipo: 'projeto_lei' | 'projeto_resolucao' | 'projeto_decreto' | 'indicacao' | 'requerimento' | 'mocao' | 'voto_apreco' | 'voto_condolencias' | 'outro';
  titulo: string;
  descricao: string;
  autor: string;
  status: 'pendente' | 'em_discussao' | 'votacao' | 'aprovado' | 'rejeitado' | 'adiado';
  prioridade: 'alta' | 'media' | 'baixa';
  tempoEstimado: number; // em minutos
  tempoReal?: number;
  observacoes?: string;
  anexos?: string[];
}

export interface Votacao {
  id: string;
  pautaItemId: string;
  tipo: 'sim_nao' | 'aprovacao_rejeicao' | 'unanimidade' | 'maioria_simples' | 'maioria_absoluta';
  iniciadaEm: Date;
  finalizadaEm?: Date;
  duracao?: number; // em segundos
  resultado: {
    sim: number;
    nao: number;
    abstencoes: number;
    ausencias: number;
    total: number;
  };
  aprovado: boolean;
  votos: VotoIndividual[];
}

export interface VotoIndividual {
  parlamentarId: string;
  parlamentarNome: string;
  voto: 'sim' | 'nao' | 'abstencao' | 'ausente';
  timestamp: Date;
  dispositivo?: string; // tablet, smartphone, etc.
}

export interface Presenca {
  id: string;
  parlamentarId: string;
  parlamentarNome: string;
  parlamentarPartido: string;
  presente: boolean;
  ausente: boolean;
  justificada: boolean;
  horarioEntrada: Date | null;
  justificativa: string | null;
  horarioChegada?: Date;
  horarioSaida?: Date;
  dispositivo?: string;
}

export interface ControleTempo {
  itemId: string;
  tempoInicio: Date;
  tempoLimite: number; // em minutos
  tempoRestante: number; // em minutos
  alertas: {
    tempo: number; // minutos para alertar
    enviado: boolean;
  }[];
  extensoes: {
    solicitada: boolean;
    aprovada: boolean;
    tempoAdicional: number; // em minutos
  };
}

export interface ChatSessao {
  id: string;
  sessaoId: string;
  mensagens: MensagemChat[];
  moderacao: {
    ativa: boolean;
    moderadores: string[];
    palavrasProibidas: string[];
  };
}

export interface MensagemChat {
  id: string;
  autorId: string;
  autorNome: string;
  autorTipo: 'parlamentar' | 'publico' | 'moderador';
  mensagem: string;
  timestamp: Date;
  aprovada: boolean;
  moderada: boolean;
}

export interface PainelPublico {
  id: string;
  sessaoId: string;
  informacoes: {
    titulo: string;
    subtitulo: string;
    data: string;
    horario: string;
    local: string;
  };
  itemAtual?: {
    titulo: string;
    descricao: string;
    autor: string;
    status: string;
    tempoRestante?: number;
  };
  estatisticas: {
    totalItens: number;
    itemAtual: number;
    itensAprovados: number;
    itensRejeitados: number;
  };
  votacaoAtual?: {
    titulo: string;
    resultado: {
      sim: number;
      nao: number;
      abstencoes: number;
    };
    tempoRestante?: number;
  };
}

export interface DispositivoVotacao {
  id: string;
  parlamentarId: string;
  tipo: 'tablet' | 'smartphone' | 'desktop';
  conectado: boolean;
  ultimaAtividade: Date;
  versaoApp?: string;
  localizacao?: {
    latitude: number;
    longitude: number;
    precisao: number;
  };
}

export interface LogSessao {
  id: string;
  sessaoId: string;
  acao: string;
  detalhes: any;
  usuario: string;
  timestamp: Date;
  dispositivo?: string;
  ip?: string;
}

export interface ConfiguracaoPainel {
  id: string;
  tema: 'claro' | 'escuro' | 'auto';
  cores: {
    primaria: string;
    secundaria: string;
    sucesso: string;
    aviso: string;
    erro: string;
  };
  layout: {
    mostrarPresenca: boolean;
    mostrarVotacao: boolean;
    mostrarChat: boolean;
    mostrarTempo: boolean;
    autoRefresh: boolean;
    intervaloRefresh: number; // em segundos
  };
  notificacoes: {
    alertasTempo: boolean;
    notificacoesVotacao: boolean;
    somAlertas: boolean;
  };
  seguranca: {
    autenticacaoRequerida: boolean;
    logAtividades: boolean;
    backupAutomatico: boolean;
  };
}

export interface RelatorioSessao {
  id: string;
  sessaoId: string;
  geradoEm: Date;
  geradoPor: string;
  dados: {
    resumo: {
      duracaoTotal: number;
      totalItens: number;
      itensAprovados: number;
      itensRejeitados: number;
      itensAdiados: number;
    };
    presenca: {
      total: number;
      presentes: number;
      ausentes: number;
      percentualPresenca: number;
    };
    votacoes: Votacao[];
    tempoPorItem: {
      itemId: string;
      titulo: string;
      tempoEstimado: number;
      tempoReal: number;
      diferenca: number;
    }[];
    atividades: LogSessao[];
  };
}
