// Interfaces para configurações institucionais baseadas na análise do SAPL

export interface ConfiguracaoInstitucional {
  id: string;
  nome: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    complemento?: string;
  };
  contatos: {
    telefone: string;
    email: string;
    site: string;
    redesSociais: Record<string, string>;
  };
  logo: string;
  favicon: string;
  configuracoes: {
    tema: 'claro' | 'escuro' | 'auto';
    idioma: string;
    timezone: string;
    formatoData: string;
    formatoMoeda: string;
  };
  informacoesLegislativas: {
    numeroVereadores: number;
    duracaoLegislatura: number; // em anos
    periodoSessoes: string;
    horarioFuncionamento: string;
  };
  transparencia: {
    nivelAcesso: 'basico' | 'intermediario' | 'avancado';
    frequenciaAtualizacao: 'diaria' | 'semanal' | 'mensal';
    retencaoDocumentos: number; // em anos
  };
  auditoria: {
    logAcoes: boolean;
    retencaoLogs: number; // em meses
    alertasSeguranca: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfiguracaoUsuario {
  id: string;
  nome: string;
  email: string;
  role: 'administrador' | 'secretario' | 'parlamentar' | 'publico';
  permissoes: string[];
  ativo: boolean;
  ultimoAcesso?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfiguracaoTema {
  id: string;
  nome: string;
  cores: {
    primaria: string;
    secundaria: string;
    sucesso: string;
    aviso: string;
    erro: string;
    info: string;
  };
  tipografia: {
    fontePrincipal: string;
    fonteSecundaria: string;
    tamanhoBase: number;
  };
  layout: {
    larguraMaxima: string;
    espacamento: string;
    bordas: string;
  };
  ativo: boolean;
}

export interface ConfiguracaoEmail {
  id: string;
  servidor: string;
  porta: number;
  usuario: string;
  senha: string;
  ssl: boolean;
  templates: {
    boasVindas: string;
    notificacao: string;
    resetSenha: string;
  };
}

export interface ConfiguracaoBackup {
  id: string;
  frequencia: 'diario' | 'semanal' | 'mensal';
  destino: 'local' | 'cloud';
  retencao: number; // em dias
  criptografia: boolean;
  ultimoBackup?: Date;
}

export interface LogAuditoria {
  id: string;
  usuario: string;
  acao: string;
  entidade: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
  timestamp: Date;
  ip: string;
  userAgent: string;
  sucesso: boolean;
  erro?: string;
}
