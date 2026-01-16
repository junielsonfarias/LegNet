// Interfaces para Ferramentas de Participação Cidadã

export interface ConsultaPublica {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'projeto_lei' | 'politica_publica' | 'orcamento' | 'plano_diretor' | 'outro';
  categoria: string;
  dataInicio: Date;
  dataFim: Date;
  status: 'agendada' | 'ativa' | 'finalizada' | 'cancelada';
  criadoPor: string;
  criadoEm: Date;
  participantes: {
    total: number;
    unicos: number;
    porDia: Record<string, number>;
  };
  resultado?: {
    totalContribuicoes: number;
    contribuicoesAprovadas: number;
    contribuicoesRejeitadas: number;
    contribuicoesEmAnalise: number;
    relatorioFinal?: string;
  };
  configuracoes: {
    permiteAnonimo: boolean;
    moderacao: boolean;
    limiteCaracteres: number;
    categoriasContribuicoes: string[];
    perguntasEspecificas: PerguntaEspecifica[];
  };
}

export interface PerguntaEspecifica {
  id: string;
  pergunta: string;
  tipo: 'texto_livre' | 'multipla_escolha' | 'escala' | 'sim_nao';
  obrigatoria: boolean;
  opcoes?: string[]; // Para múltipla escolha
  escala?: {
    minimo: number;
    maximo: number;
    labels: string[];
  };
}

export interface ContribuicaoConsulta {
  id: string;
  consultaId: string;
  autorId?: string; // null se anônima
  autorNome: string;
  autorEmail?: string;
  anonima: boolean;
  contribuicao: string;
  categoria: string;
  dataEnvio: Date;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'em_analise';
  moderada: boolean;
  moderadoPor?: string;
  moderadoEm?: Date;
  observacoesModeracao?: string;
  votos: {
    positivos: number;
    negativos: number;
    neutros: number;
  };
  respostasPerguntas: RespostaPergunta[];
  anexos?: string[];
}

export interface RespostaPergunta {
  perguntaId: string;
  resposta: string;
}

export interface SugestaoCidada {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'infraestrutura' | 'educacao' | 'saude' | 'transporte' | 'meio_ambiente' | 'cultura' | 'esporte' | 'outro';
  autorNome: string;
  autorEmail: string;
  autorTelefone?: string;
  autorEndereco?: string;
  dataEnvio: Date;
  status: 'pendente' | 'em_analise' | 'aceita' | 'rejeitada' | 'implementada';
  prioridade: 'baixa' | 'media' | 'alta';
  custoEstimado?: {
    minimo: number;
    maximo: number;
    moeda: string;
  };
  prazoEstimado?: string;
  impacto: {
    beneficiarios: number;
    area: string[];
    tipo: 'positivo' | 'negativo' | 'neutro';
  };
  analise?: {
    analisadoPor: string;
    analisadoEm: Date;
    viabilidade: 'alta' | 'media' | 'baixa';
    justificativa: string;
    recomendacoes: string[];
  };
  votos: {
    total: number;
    positivos: number;
    negativos: number;
  };
  comentarios: ComentarioSugestao[];
}

export interface ComentarioSugestao {
  id: string;
  sugestaoId: string;
  autorNome: string;
  autorEmail: string;
  comentario: string;
  dataEnvio: Date;
  moderado: boolean;
}

export interface EnquetePublica {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  dataInicio: Date;
  dataFim: Date;
  status: 'agendada' | 'ativa' | 'finalizada';
  criadoPor: string;
  configuracoes: {
    permiteAnonimo: boolean;
    permiteMultiplaEscolha: boolean;
    limiteRespostas?: number;
    verificaEmail: boolean;
  };
  perguntas: PerguntaEnquete[];
  resultados: {
    totalParticipantes: number;
    totalRespostas: number;
    porPergunta: ResultadoPergunta[];
  };
}

export interface PerguntaEnquete {
  id: string;
  pergunta: string;
  tipo: 'multipla_escolha' | 'escala' | 'sim_nao' | 'texto_livre';
  obrigatoria: boolean;
  opcoes?: string[];
  escala?: {
    minimo: number;
    maximo: number;
    labels: string[];
  };
}

export interface ResultadoPergunta {
  perguntaId: string;
  totalRespostas: number;
  opcoes?: {
    opcao: string;
    quantidade: number;
    percentual: number;
  }[];
  media?: number; // Para perguntas de escala
  distribuicao?: Record<string, number>; // Para texto livre
}

export interface ParticipacaoEnquete {
  id: string;
  enqueteId: string;
  participanteId?: string;
  participanteEmail: string;
  dataParticipacao: Date;
  respostas: RespostaEnquete[];
  ip?: string;
  userAgent?: string;
}

export interface RespostaEnquete {
  perguntaId: string;
  resposta: string;
  respostaTexto?: string;
}

export interface ForumDiscussao {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  dataCriacao: Date;
  criadoPor: string;
  status: 'ativo' | 'fechado' | 'arquivado';
  configuracoes: {
    moderacao: boolean;
    permiteAnonimo: boolean;
    limiteCaracteres: number;
    anexosPermitidos: string[];
  };
  estatisticas: {
    totalTopicos: number;
    totalPosts: number;
    totalParticipantes: number;
    atividadeRecente: Date;
  };
}

export interface TopicoForum {
  id: string;
  forumId: string;
  titulo: string;
  conteudo: string;
  autorNome: string;
  autorEmail: string;
  anonimo: boolean;
  dataCriacao: Date;
  status: 'ativo' | 'fechado' | 'arquivado';
  moderado: boolean;
  fixado: boolean;
  estatisticas: {
    totalPosts: number;
    totalVisualizacoes: number;
    ultimaAtividade: Date;
  };
  tags: string[];
}

export interface PostForum {
  id: string;
  topicoId: string;
  autorNome: string;
  autorEmail: string;
  anonimo: boolean;
  conteudo: string;
  dataEnvio: Date;
  moderado: boolean;
  citacao?: {
    postId: string;
    autor: string;
    conteudo: string;
  };
  anexos?: string[];
}

export interface ChatSessao {
  id: string;
  sessaoId: string;
  titulo: string;
  dataInicio: Date;
  dataFim?: Date;
  status: 'agendado' | 'ativo' | 'finalizado';
  moderadores: string[];
  configuracoes: {
    permiteAnonimo: boolean;
    moderacao: boolean;
    limiteMensagens: number;
    tempoResposta: number; // segundos
  };
  estatisticas: {
    totalMensagens: number;
    totalParticipantes: number;
    mensagensPorMinuto: number;
  };
}

export interface MensagemChat {
  id: string;
  chatId: string;
  autorNome: string;
  autorEmail?: string;
  anonimo: boolean;
  mensagem: string;
  dataEnvio: Date;
  moderada: boolean;
  aprovada: boolean;
  tipo: 'texto' | 'pergunta' | 'resposta' | 'sugestao';
  citacao?: {
    mensagemId: string;
    autor: string;
    conteudo: string;
  };
}

export interface RelatorioParticipacao {
  id: string;
  periodo: {
    inicio: Date;
    fim: Date;
  };
  tipo: 'mensal' | 'trimestral' | 'anual' | 'personalizado';
  geradoEm: Date;
  geradoPor: string;
  dados: {
    consultas: {
      total: number;
      ativas: number;
      finalizadas: number;
      totalParticipantes: number;
      totalContribuicoes: number;
    };
    sugestoes: {
      total: number;
      pendentes: number;
      aceitas: number;
      rejeitadas: number;
      implementadas: number;
    };
    enquetes: {
      total: number;
      ativas: number;
      totalParticipantes: number;
      totalRespostas: number;
    };
    forum: {
      totalTopicos: number;
      totalPosts: number;
      totalParticipantes: number;
    };
    chat: {
      totalSessoes: number;
      totalMensagens: number;
      totalParticipantes: number;
    };
    engajamento: {
      totalParticipantesUnicos: number;
      mediaParticipacoes: number;
      taxaRetorno: number;
    };
  };
}

export interface ConfiguracaoParticipacao {
  id: string;
  configuracoes: {
    consultas: {
      ativado: boolean;
      moderacaoObrigatoria: boolean;
      limiteContribuicoesPorUsuario: number;
      tempoMinimoEntreContribuicoes: number; // minutos
    };
    sugestoes: {
      ativado: boolean;
      categoriasPermitidas: string[];
      limiteCaracteres: number;
      anexosPermitidos: string[];
    };
    enquetes: {
      ativado: boolean;
      duracaoMaxima: number; // dias
      limitePerguntas: number;
    };
    forum: {
      ativado: boolean;
      moderacaoObrigatoria: boolean;
      limitePostsPorUsuario: number;
    };
    chat: {
      ativado: boolean;
      moderacaoObrigatoria: boolean;
      limiteMensagensPorUsuario: number;
    };
  };
  moderacao: {
    moderadores: string[];
    palavrasProibidas: string[];
    filtroSpam: boolean;
    notificacoesModeracao: boolean;
  };
  notificacoes: {
    emailContribuicoes: boolean;
    emailRespostas: boolean;
    emailLembretes: boolean;
    emailRelatorios: boolean;
  };
}
