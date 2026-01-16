// Interfaces para sistema de automação de tramitação

export interface RegraTramitacao {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  prioridade: number; // 1 = alta, 2 = média, 3 = baixa
  condicoes: {
    tipoProposicao: string[];
    valorLimite?: number;
    prazoDias: number;
    unidadeOrigem?: string;
    statusOrigem: string[];
  };
  acoes: {
    proximaUnidade: string;
    statusDestino: string;
    notificacoes: {
      email: boolean;
      sms: boolean;
      sistema: boolean;
      usuarios: string[];
    };
    alertas: {
      diasAntes: number[];
      mensagem: string;
      tipo: 'info' | 'warning' | 'error';
    }[];
    camposAutomaticos?: {
      [key: string]: any;
    };
  };
  excecoes?: RegraExcecao[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RegraExcecao {
  id: string;
  condicao: {
    campo: string;
    operador: 'equals' | 'contains' | 'greater' | 'less' | 'in';
    valor: any;
  };
  acao: 'pular' | 'alterar' | 'parar';
  valorAlternativo?: any;
}

export interface WorkflowTramitacao {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  regras: RegraTramitacao[];
  ordem: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecucaoRegra {
  id: string;
  regraId: string;
  proposicaoId: string;
  status: 'pendente' | 'executando' | 'sucesso' | 'erro' | 'pulada';
  dadosEntrada: any;
  dadosSaida?: any;
  erro?: string;
  iniciadoEm: Date;
  finalizadoEm?: Date;
  duracao?: number; // em milissegundos
}

export interface HistoricoTramitacao {
  id: string;
  proposicaoId: string;
  acao: string;
  unidadeOrigem: string;
  unidadeDestino: string;
  statusAnterior: string;
  statusNovo: string;
  observacoes?: string;
  executadoPor: string;
  executadoEm: Date;
  automatico: boolean;
  regraId?: string;
}

export interface ConfiguracaoAutomatizacao {
  id: string;
  ativa: boolean;
  frequenciaExecucao: 'imediata' | 'hora' | 'dia' | 'semana';
  horarioExecucao?: string; // HH:MM
  diasExecucao?: number[]; // 0-6 (domingo-sábado)
  timeoutSegundos: number;
  maxTentativas: number;
  notificacoes: {
    sucesso: boolean;
    erro: boolean;
    resumo: boolean;
  };
  logDetalhado: boolean;
  ultimaExecucao?: Date;
  proximaExecucao?: Date;
}

export interface RelatorioAutomatizacao {
  id: string;
  periodo: {
    inicio: Date;
    fim: Date;
  };
  estatisticas: {
    totalRegras: number;
    regrasExecutadas: number;
    sucessos: number;
    erros: number;
    tempoMedioExecucao: number;
  };
  detalhes: {
    regraId: string;
    regraNome: string;
    execucoes: number;
    sucessos: number;
    erros: number;
    tempoMedio: number;
  }[];
  geradoEm: Date;
  geradoPor: string;
}
