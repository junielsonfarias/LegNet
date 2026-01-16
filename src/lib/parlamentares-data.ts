// @ts-nocheck
// Sistema de dados compartilhado entre admin e portal público
// Em produção, isso seria substituído por chamadas à API ou banco de dados

// Dados das legislaturas
export const legislaturas: Legislatura[] = [
  {
    id: '1',
    numero: '19ª',
    periodoInicio: '2021-01-01',
    periodoFim: '2024-12-31',
    ano: '2021-2024',
    ativa: true,
    periodosMesa: 2 // 2 períodos de mesa diretora
  },
  {
    id: '2',
    numero: '18ª',
    periodoInicio: '2017-01-01',
    periodoFim: '2020-12-31',
    ano: '2017-2020',
    ativa: false,
    periodosMesa: 2
  },
  {
    id: '3',
    numero: '17ª',
    periodoInicio: '2013-01-01',
    periodoFim: '2016-12-31',
    ano: '2013-2016',
    ativa: false,
    periodosMesa: 4 // 4 períodos de mesa diretora
  }
]

// Dados da Mesa Diretora
export const mesaDiretoraData: MesaDiretora[] = [
  {
    id: '1',
    legislaturaId: '1',
    periodo: 1,
    dataInicio: '2021-01-01',
    dataFim: '2022-12-31',
    ativa: false,
    membros: {
      presidente: '1', // Francisco Pereira Pantoja
      vicePresidente: '2', // Diego Oliveira da Silva
      primeiroSecretario: '3', // Mickael Christyan Alves de Aguiar
      segundoSecretario: '4' // Jesanias da Silva Pessoa
    }
  },
  {
    id: '2',
    legislaturaId: '1',
    periodo: 2,
    dataInicio: '2023-01-01',
    ativa: true,
    membros: {
      presidente: '1', // Francisco Pereira Pantoja
      vicePresidente: '2', // Diego Oliveira da Silva
      primeiroSecretario: '3', // Mickael Christyan Alves de Aguiar
      segundoSecretario: '4' // Jesanias da Silva Pessoa
    }
  },
  {
    id: '3',
    legislaturaId: '2',
    periodo: 1,
    dataInicio: '2017-01-01',
    dataFim: '2018-12-31',
    ativa: false,
    membros: {
      presidente: '1',
      vicePresidente: '2',
      primeiroSecretario: '3',
      segundoSecretario: '4'
    }
  },
  {
    id: '4',
    legislaturaId: '2',
    periodo: 2,
    dataInicio: '2019-01-01',
    dataFim: '2020-12-31',
    ativa: false,
    membros: {
      presidente: '2',
      vicePresidente: '1',
      primeiroSecretario: '4',
      segundoSecretario: '3'
    }
  }
]

export interface Legislatura {
  id: string
  numero: string
  periodoInicio: string
  periodoFim: string
  ano: string
  ativa: boolean
  periodosMesa: number // Quantidade de períodos de mesa diretora (2 ou 4)
}

export interface Mandato {
  id: string
  legislaturaId: string
  numeroVotos: number
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR'
  dataInicio: string
  dataFim?: string
  ativo: boolean
}

export interface MesaDiretora {
  id: string
  legislaturaId: string
  periodo: number // 1, 2, 3, 4 (dependendo da legislatura)
  dataInicio: string
  dataFim?: string
  ativa: boolean
  membros: {
    presidente?: string // ID do parlamentar
    vicePresidente?: string
    primeiroSecretario?: string
    segundoSecretario?: string
  }
}

export interface Parlamentar {
  id: string
  nome: string
  apelido: string
  partido: string
  biografia: string
  email: string
  telefone: string
  gabinete?: string
  telefoneGabinete?: string
  foto?: string
  ativo: boolean
  mandatos: Mandato[]
  legislaturaAtual?: string
  // Dados adicionais para o portal
  redesSociais?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  // Estatísticas legislativas
  estatisticas?: {
    legislaturaAtual: {
      materias: number
      percentualMaterias: number
      sessoes: number
      percentualPresenca: number
      dataAtualizacao: string
    }
    exercicioAtual: {
      materias: number
      percentualMaterias: number
      sessoes: number
      percentualPresenca: number
    }
  }
  // Dados legislativos
  ultimasMaterias?: Array<{
    id: number
    numero: string
    tipo: string
    titulo: string
    data: string
    status: string
    autor: string
  }>
  comissoes?: Array<{
    id: string
    nome: string
    cargo: string
    dataInicio: string
    dataFim?: string
  }>
  mandatosAnteriores?: Array<{
    legislatura: string
    cargo: string
    periodo: string
    votos: number
  }>
  filiacaoPartidaria?: Array<{
    partido: string
    dataInicio: string
    dataFim?: string
  }>
  ultimasAgendas?: Array<{
    data: string
    atividade: string
    local: string
  }>
  estatisticasMaterias?: {
    total: number
    aprovadas: number
    emTramitacao: number
    rejeitadas: number
  }
}

// Interface para Pautas das Sessões
export interface PautaSessao {
  id: string
  sessaoId: string
  data: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL' | 'SOLENE'
  status: 'RASCUNHO' | 'PUBLICADA' | 'APROVADA' | 'EM_ANDAMENTO' | 'CONCLUIDA'
  titulo: string
  descricao?: string
  expediente: PautaItem[]
  ordemDoDia: PautaItem[]
  observacoes?: string
  publicadaEm?: string
  aprovadaEm?: string
  criadaEm: string
  atualizadaEm: string
}

// Interface para Itens da Pauta
export interface PautaItem {
  id: string
  tipo: 'EXPEDIENTE' | 'ORDEM_DO_DIA'
  categoria: 'COMUNICACAO' | 'REQUERIMENTO' | 'INDICACAO' | 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'VOTO_APLAUSO' | 'VOTO_PESAR' | 'OUTROS'
  numero?: string
  titulo: string
  descricao?: string
  autor?: string
  parlamentarId?: string
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA'
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'ADIADO'
  tempoEstimado?: number // em minutos
  ordem: number
  votacao?: {
    aprovado: boolean
    votosFavoraveis: number
    votosContrarios: number
    abstencao: number
    resultado?: string
  }
  anexos?: {
    nome: string
    url: string
    tipo: string
  }[]
}

// Interface para Audiências Públicas
export interface AudienciaPublica {
  id: string
  numero: string // Número sequencial da audiência (ex: AP-001/2025)
  titulo: string
  descricao: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL'
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | 'ADIADA'
  dataHora: string
  local: string
  endereco?: string
  responsavel: string
  parlamentarId?: string
  comissaoId?: string
  objetivo: string
  publicoAlvo: string
  // Campos melhorados inspirados no SAPL
  materiaLegislativaId?: string // Vinculação com proposição
  documentos?: {
    nome: string
    url: string
    tipo: string
    data: string
    tamanho?: number
    descricao?: string
  }[]
  participantes: ParticipanteAudiencia[]
  atas?: {
    id: string
    titulo: string
    conteudo: string
    data: string
    assinatura?: string
  }[]
  transcricoes?: {
    id: string
    titulo: string
    conteudo: string
    data: string
  }[]
  links?: {
    nome: string
    url: string
    tipo: 'TRANSMISSAO' | 'DOCUMENTO' | 'OUTROS'
  }[]
  // Novos campos para funcionalidades avançadas
  transmissaoAoVivo?: {
    ativa: boolean
    url?: string
    plataforma?: string
    status?: 'ATIVA' | 'INATIVA' | 'AGENDADA'
  }
  inscricoesPublicas?: {
    ativa: boolean
    dataLimite?: string
    linkInscricao?: string
    totalInscritos: number
    formularioInscricao?: {
      campos: Array<{
        nome: string
        tipo: 'TEXTO' | 'EMAIL' | 'TELEFONE' | 'SELECT' | 'TEXTAREA'
        obrigatorio: boolean
        opcoes?: string[]
      }>
    }
  }
  publicacaoPublica?: {
    ativa: boolean
    dataPublicacao?: string
    visivelPortal: boolean
    destaque?: boolean
  }
  cronograma?: {
    inicio: string
    fim: string
    pausas?: { inicio: string; fim: string; descricao: string }[]
    blocos?: Array<{
      titulo: string
      inicio: string
      fim: string
      descricao: string
    }>
  }
  observacoes?: string
  criadaEm: string
  atualizadaEm: string
}

// Interface para Participantes de Audiência
export interface ParticipanteAudiencia {
  id: string
  nome: string
  cargo?: string
  instituicao?: string
  tipo: 'PARLAMENTAR' | 'CONVIDADO' | 'CIDADAO' | 'ORGAO_PUBLICO' | 'ENTIDADE' | 'ESPECIALISTA'
  confirmado: boolean
  presenca?: boolean
  intervencoes?: {
    id: string
    horario: string
    duracao: number
    assunto: string
    resumo?: string
  }[]
}

// Interface para Tipos de Tramitação
export interface TipoTramitacao {
  id: string
  nome: string
  descricao: string
  ordem: number
  ativo: boolean
  cor: string
  prazoDias?: number
  obrigatorio: boolean
}

// Interface para Unidades de Tramitação
export interface UnidadeTramitacao {
  id: string
  nome: string
  sigla: string
  tipo: 'COMISSAO' | 'MESA_DIRETORA' | 'PLENARIO' | 'EXECUTIVO' | 'OUTROS'
  descricao: string
  ativo: boolean
  ordem: number
}

// Interface para Tramitação de Proposições
export interface Tramitacao {
  id: string
  proposicaoId: string
  tipoTramitacaoId: string
  unidadeTramitacaoId: string
  dataEntrada: string
  dataSaida?: string
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'RETORNADA' | 'ARQUIVADA'
  observacoes?: string
  responsavel?: string
  prazo?: string
  documentos?: {
    nome: string
    url: string
    tipo: string
    data: string
  }[]
  ordem: number
  criadaEm: string
  atualizadaEm: string
}

// Interface para Sessões Legislativas (unificada com pautas)
export interface SessaoLegislativa {
  id: string
  numero: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL' | 'SOLENE'
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | 'SUSPENSA'
  dataHora: string
  local: string
  presidenteId: string
  vicePresidenteId?: string
  secretario1Id?: string
  secretario2Id?: string
  quorumMinimo: number
  quorumPresente?: number
  titulo: string
  descricao?: string
  
  // Pauta integrada
  pauta: {
    expediente: PautaItem[]
    ordemDoDia: PautaItem[]
    observacoes?: string
    publicadaEm?: string
  }
  
  // Presença dos parlamentares
  presenca: {
    parlamentarId: string
    presente: boolean
    justificativa?: string
    chegada?: string
    saida?: string
  }[]
  
  // Documentos da sessão
  documentos?: {
    nome: string
    url: string
    tipo: string
    data: string
  }[]
  
  // Ata da sessão
  ata?: {
    conteudo: string
    aprovada: boolean
    dataAprovacao?: string
  }
  
  criadaEm: string
  atualizadaEm: string
}

// Interface para Proposições com tramitação
export interface Proposicao {
  id: string
  numero: string
  ano: number
  tipo: 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'INDICACAO' | 'REQUERIMENTO' | 'MOÇÃO' | 'VOTO_APLAUSO' | 'VOTO_PESAR'
  titulo: string
  ementa: string
  textoCompleto?: string
  autorId: string
  coautores?: string[]
  status: 'APRESENTADA' | 'EM_TRAMITACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA' | 'SANCIONADA'
  
  // Tramitação
  tramitacoes: Tramitacao[]
  
  // Informações da proposição
  dataApresentacao: string
  dataPublicacao?: string
  dataVotacao?: string
  resultadoVotacao?: {
    votosFavoraveis: number
    votosContrarios: number
    abstencao: number
    ausentes: number
  }
  
  // Documentos anexos
  anexos?: {
    nome: string
    url: string
    tipo: string
    data: string
  }[]
  
  // Assuntos/tags
  assuntos?: string[]
  
  criadaEm: string
  atualizadaEm: string
}

// Dados centralizados dos parlamentares
export const parlamentaresData: Parlamentar[] = [
  {
    id: '1',
    nome: 'Francisco Pereira Pantoja',
    apelido: 'Pantoja do Cartório',
    partido: 'MDB',
    biografia: 'Francisco Pereira Pantoja, popularmente conhecido como "Pantoja do Cartório", nascido em 19 de novembro de 1945, filho de Nery da Costa Pantoja e Tertuliana Dias Pereira; casado, pai e avô; residente no município de Mojuí dos Campos há 48 anos. Tem como formação acadêmica o Bacharelado em Administração de Empresas e Bacharelado em Direito, pela FIT (Faculdades Integradas do Tapajós), hoje UNAMA (Universidade da Amazônia). É oficial Titular do Cartório de Registro Civil das Pessoas Naturais e Notas, de Mojuí dos Campos; e Vereador (2021 -2024). Seu entusiasmo pela carreira política começou quando, o mesmo, fez parte da comissão de Emancipação de Mojuí dos Campos, como Vice-presidente, onde logrou êxito. Disputou, como candidato a vereador, as eleições de 2021 e conseguiu eleger-se com mais de 452 votos; hoje eleito, vem potencializando os trabalhos voltados ao bem-estar da população, além de compartilhar com todos o conhecimento que conquistou ao longo de toda vida trabalhando na área jurídica.',
    email: 'cartoriopantoja@gmail.com',
    telefone: '(98) 8038-898',
    gabinete: 'Sala 101 - 1º Andar',
    telefoneGabinete: '(93) 3333-1001',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    ativo: true,
    legislaturaAtual: '1',
    mandatos: [
      {
        id: '1-1',
        legislaturaId: '1',
        numeroVotos: 452,
        cargo: 'PRESIDENTE',
        dataInicio: '2021-01-01',
        ativo: true
      },
      {
        id: '1-2',
        legislaturaId: '2',
        numeroVotos: 398,
        cargo: 'VEREADOR',
        dataInicio: '2017-01-01',
        dataFim: '2020-12-31',
        ativo: false
      }
    ],
    redesSociais: {
      facebook: 'https://facebook.com/pantoja',
      instagram: 'https://instagram.com/pantoja',
      twitter: 'https://twitter.com/pantoja'
    },
    estatisticas: {
      legislaturaAtual: {
        materias: 14,
        percentualMaterias: 4.23,
        sessoes: 24,
        percentualPresenca: 88.89,
        dataAtualizacao: '10/09/2025'
      },
      exercicioAtual: {
        materias: 14,
        percentualMaterias: 4.23,
        sessoes: 24,
        percentualPresenca: 88.89
      }
    },
    ultimasMaterias: [
      {
        id: 1,
        numero: '200/2025',
        tipo: 'REQUERIMENTO - PARA O EXECUTIVO',
        titulo: 'SOLICITA A CONSTRUÇÃO DE UMA ESCOLA DE ENSINO FUNDAMENTAL NA COMUNIDADE BICA 1, HAJA VISTA QUE AS CRIANÇAS DAQUELA COMUNIDADE E ADJACENTES SE RESSENTEM DA FALTA DE UMA ESCOLA QUE AS ABRIGUEM',
        data: '11/06/2025',
        status: 'Cadastrado',
        autor: 'VEREADOR FRANCISCO PEREIRA PANTOJA'
      }
    ],
    comissoes: [
      {
        id: '1',
        nome: 'Comissão de Educação',
        cargo: 'Presidente',
        dataInicio: '2021-01-01'
      }
    ]
  },
  {
    id: '2',
    nome: 'Diego Oliveira da Silva',
    apelido: 'Diego do Zé Neto',
    partido: 'Partido B',
    biografia: 'Vice-presidente da Câmara Municipal, atuando em conjunto com o presidente na condução dos trabalhos legislativos.',
    email: 'diego@camaramojui.com',
    telefone: '(93) 99999-0002',
    gabinete: 'Sala 102 - 1º Andar',
    telefoneGabinete: '(93) 3333-1002',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
    ativo: true,
    legislaturaAtual: '1',
    mandatos: [
      {
        id: '2-1',
        legislaturaId: '1',
        numeroVotos: 387,
        cargo: 'VICE_PRESIDENTE',
        dataInicio: '2021-01-01',
        ativo: true
      }
    ]
  }
]

// Dados mock para Pautas das Sessões
export const pautasSessoesData: PautaSessao[] = [
  {
    id: '1',
    sessaoId: '1',
    data: '2025-01-15',
    tipo: 'ORDINARIA',
    status: 'PUBLICADA',
    titulo: 'Pauta da Sessão Ordinária - 15/01/2025',
    descricao: 'Sessão ordinária para apreciação de proposições legislativas',
    expediente: [
      {
        id: '1-1',
        tipo: 'EXPEDIENTE',
        categoria: 'COMUNICACAO',
        titulo: 'Leitura de Comunicações',
        descricao: 'Leitura de comunicações recebidas',
        prioridade: 'MEDIA',
        status: 'PENDENTE',
        ordem: 1,
        tempoEstimado: 15
      },
      {
        id: '1-2',
        tipo: 'EXPEDIENTE',
        categoria: 'REQUERIMENTO',
        numero: '001/2025',
        titulo: 'Requerimento de Informações - Obras Públicas',
        descricao: 'Solicitação de informações sobre andamento das obras públicas municipais',
        autor: 'Vereador Francisco Pantoja',
        parlamentarId: '1',
        prioridade: 'ALTA',
        status: 'PENDENTE',
        ordem: 2,
        tempoEstimado: 20
      }
    ],
    ordemDoDia: [
      {
        id: '1-3',
        tipo: 'ORDEM_DO_DIA',
        categoria: 'PROJETO_LEI',
        numero: 'PL 001/2025',
        titulo: 'Projeto de Lei - Criação do Conselho Municipal de Educação',
        descricao: 'Institui o Conselho Municipal de Educação de Mojuí dos Campos',
        autor: 'Vereador Diego Silva',
        parlamentarId: '2',
        prioridade: 'ALTA',
        status: 'PENDENTE',
        ordem: 1,
        tempoEstimado: 45,
        anexos: [
          {
            nome: 'PL_001_2025_Conselho_Educacao.pdf',
            url: '/documentos/pl_001_2025.pdf',
            tipo: 'PDF'
          }
        ]
      },
      {
        id: '1-4',
        tipo: 'ORDEM_DO_DIA',
        categoria: 'PROJETO_RESOLUCAO',
        numero: 'PR 002/2025',
        titulo: 'Projeto de Resolução - Regulamentação de Sessões Virtuais',
        descricao: 'Regulamenta a realização de sessões legislativas em formato virtual',
        autor: 'Vereador Mickael Aguiar',
        parlamentarId: '3',
        prioridade: 'MEDIA',
        status: 'PENDENTE',
        ordem: 2,
        tempoEstimado: 30
      }
    ],
    observacoes: 'Sessão com transmissão ao vivo pelo canal oficial da Câmara',
    publicadaEm: '2025-01-10T10:00:00Z',
    criadaEm: '2025-01-08T14:30:00Z',
    atualizadaEm: '2025-01-10T10:00:00Z'
  },
  {
    id: '2',
    sessaoId: '2',
    data: '2025-01-22',
    tipo: 'EXTRAORDINARIA',
    status: 'RASCUNHO',
    titulo: 'Pauta da Sessão Extraordinária - 22/01/2025',
    descricao: 'Sessão extraordinária para apreciação de matéria de urgência',
    expediente: [],
    ordemDoDia: [
      {
        id: '2-1',
        tipo: 'ORDEM_DO_DIA',
        categoria: 'PROJETO_LEI',
        numero: 'PL 003/2025',
        titulo: 'Projeto de Lei - Lei de Diretrizes Orçamentárias 2025',
        descricao: 'Estabelece as diretrizes orçamentárias para o exercício de 2025',
        autor: 'Prefeitura Municipal',
        prioridade: 'ALTA',
        status: 'PENDENTE',
        ordem: 1,
        tempoEstimado: 60
      }
    ],
    criadaEm: '2025-01-20T09:00:00Z',
    atualizadaEm: '2025-01-20T09:00:00Z'
  }
]

// Dados mock para Audiências Públicas
export const audienciasPublicasData: AudienciaPublica[] = [
  {
    id: '1',
    numero: 'AP-001/2025',
    titulo: 'Audiência Pública - Plano Municipal de Educação 2025-2035',
    descricao: 'Discussão sobre o Plano Municipal de Educação para o período 2025-2035',
    tipo: 'ESPECIAL',
    status: 'AGENDADA',
    dataHora: '2025-02-15T14:00:00',
    local: 'Câmara Municipal de Mojuí dos Campos',
    endereco: 'Av. Principal, 123 - Centro',
    responsavel: 'Comissão de Educação',
    materiaLegislativaId: '1', // Vinculada à proposição 001/2025
    transmissaoAoVivo: {
      ativa: true,
      url: 'https://youtube.com/live/camaramojui',
      plataforma: 'YouTube',
      status: 'AGENDADA'
    },
    inscricoesPublicas: {
      ativa: true,
      dataLimite: '2025-02-10T23:59:59',
      linkInscricao: '/inscricoes/audiencia/1',
      totalInscritos: 45,
      formularioInscricao: {
        campos: [
          { nome: 'Nome Completo', tipo: 'TEXTO', obrigatorio: true },
          { nome: 'Email', tipo: 'EMAIL', obrigatorio: true },
          { nome: 'Telefone', tipo: 'TELEFONE', obrigatorio: false },
          { nome: 'Instituição', tipo: 'TEXTO', obrigatorio: false },
          { nome: 'Observações', tipo: 'TEXTAREA', obrigatorio: false }
        ]
      }
    },
    publicacaoPublica: {
      ativa: true,
      dataPublicacao: '2025-01-15T10:00:00',
      visivelPortal: true,
      destaque: true
    },
    cronograma: {
      inicio: '2025-02-15T14:00:00',
      fim: '2025-02-15T18:00:00',
      pausas: [
        { inicio: '2025-02-15T15:30:00', fim: '2025-02-15T16:00:00', descricao: 'Intervalo' }
      ],
      blocos: [
        { titulo: 'Abertura', inicio: '2025-02-15T14:00:00', fim: '2025-02-15T14:30:00', descricao: 'Abertura oficial e apresentação dos objetivos' },
        { titulo: 'Apresentação do Plano', inicio: '2025-02-15T14:30:00', fim: '2025-02-15T15:30:00', descricao: 'Apresentação detalhada do Plano Municipal de Educação' },
        { titulo: 'Debate Público', inicio: '2025-02-15T16:00:00', fim: '2025-02-15T17:30:00', descricao: 'Participação do público e debates' },
        { titulo: 'Encerramento', inicio: '2025-02-15T17:30:00', fim: '2025-02-15T18:00:00', descricao: 'Considerações finais e próximos passos' }
      ]
    },
    comissaoId: '1',
    objetivo: 'Debater e receber contribuições da sociedade civil para o Plano Municipal de Educação',
    publicoAlvo: 'Educadores, gestores escolares, estudantes, pais, comunidade em geral',
    documentos: [
      {
        nome: 'Plano_Municipal_Educacao_2025_2035.pdf',
        url: '/documentos/plano_educacao.pdf',
        tipo: 'PDF',
        data: '2025-01-10'
      }
    ],
    participantes: [
      {
        id: '1',
        nome: 'Maria Silva Santos',
        cargo: 'Secretária de Educação',
        instituicao: 'Secretaria Municipal de Educação',
        tipo: 'ORGAO_PUBLICO',
        confirmado: true,
        presenca: false,
        intervencoes: []
      },
      {
        id: '2',
        nome: 'João Carlos Lima',
        cargo: 'Diretor',
        instituicao: 'Escola Municipal João Batista',
        tipo: 'ESPECIALISTA',
        confirmado: true,
        presenca: false,
        intervencoes: []
      },
      {
        id: '3',
        nome: 'Ana Paula Costa',
        cargo: 'Presidente',
        instituicao: 'Sindicato dos Professores',
        tipo: 'ENTIDADE',
        confirmado: false,
        presenca: false,
        intervencoes: []
      }
    ],
    links: [
      {
        nome: 'Transmissão ao Vivo',
        url: 'https://youtube.com/camaramojui',
        tipo: 'TRANSMISSAO'
      }
    ],
    observacoes: 'Audiência será transmitida ao vivo e gravada para posterior consulta',
    criadaEm: '2025-01-15T10:00:00Z',
    atualizadaEm: '2025-01-15T10:00:00Z'
  },
  {
    id: '2',
    titulo: 'Audiência Pública - Política de Habitação Popular',
    descricao: 'Discussão sobre políticas públicas de habitação para famílias de baixa renda',
    tipo: 'ORDINARIA',
    status: 'CONCLUIDA',
    dataHora: '2025-01-08T19:00:00',
    local: 'Centro Comunitário do Bairro São José',
    endereco: 'Rua das Flores, 456 - Bairro São José',
    responsavel: 'Vereador Francisco Pantoja',
    parlamentarId: '1',
    objetivo: 'Debater propostas para melhoria das políticas de habitação popular no município',
    publicoAlvo: 'Moradores, lideranças comunitárias, entidades sociais',
    participantes: [
      {
        id: '4',
        nome: 'Roberto Alves',
        cargo: 'Presidente',
        instituicao: 'Associação dos Moradores do Bairro São José',
        tipo: 'ENTIDADE',
        confirmado: true,
        presenca: true,
        intervencoes: [
          {
            id: '1',
            horario: '19:15',
            duracao: 10,
            assunto: 'Demandas do bairro',
            resumo: 'Apresentou as principais demandas habitacionais do bairro'
          }
        ]
      }
    ],
    atas: [
      {
        id: '1',
        titulo: 'Ata da Audiência Pública - Habitação Popular',
        conteudo: 'Ata detalhada da audiência pública sobre habitação popular...',
        data: '2025-01-08',
        assinatura: 'Francisco Pantoja - Presidente da Sessão'
      }
    ],
    criadaEm: '2025-01-05T14:00:00Z',
    atualizadaEm: '2025-01-09T09:00:00Z'
  }
]

// Funções para gerenciar os dados
export const parlamentaresService = {
  // Buscar todos os parlamentares ativos
  getAll: (): Parlamentar[] => {
    return parlamentaresData.filter(p => p.ativo)
  },

  // Buscar parlamentar por ID
  getById: (id: string): Parlamentar | undefined => {
    return parlamentaresData.find(p => p.id === id)
  },

  // Buscar parlamentar por slug (apelido)
  getBySlug: (slug: string): Parlamentar | undefined => {
    return parlamentaresData.find(p => 
      p.apelido.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[áàâãä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòôõö]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ç]/g, 'c') === slug
    )
  },

  // Buscar parlamentares por cargo
  getByCargo: (cargo: string): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.mandatos?.some(m => m.ativo && m.cargo === cargo) && p.ativo
    )
  },

  // Buscar parlamentares da mesa diretora
  getMesaDiretora: (): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.mandatos?.some(m => m.ativo && m.cargo !== 'VEREADOR') && p.ativo
    )
  },

  // Buscar apenas vereadores
  getVereadores: (): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.mandatos?.some(m => m.ativo && m.cargo === 'VEREADOR') && p.ativo
    )
  },

  // Buscar parlamentares por partido
  getByPartido: (partido: string): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.partido === partido && p.ativo
    )
  },

  // Buscar parlamentares elegíveis para mesa diretora (todos os ativos)
  getParlamentaresElegiveis: (): Parlamentar[] => {
    return parlamentaresData.filter(p => p.ativo)
  },

  // Buscar parlamentares por termo
  search: (termo: string): Parlamentar[] => {
    const termoLower = termo.toLowerCase()
    return parlamentaresData.filter(p => 
      p.ativo && (
        p.nome.toLowerCase().includes(termoLower) ||
        p.apelido.toLowerCase().includes(termoLower) ||
        p.partido.toLowerCase().includes(termoLower)
      )
    )
  },

  // Buscar parlamentares por legislatura
  getByLegislatura: (legislaturaId: string): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.ativo && p.mandatos?.some(m => m.legislaturaId === legislaturaId)
    )
  },

  // Buscar parlamentares por ano
  getByAno: (ano: string): Parlamentar[] => {
    const legislatura = legislaturas.find(l => l.ano.includes(ano))
    if (!legislatura) return []
    return parlamentaresData.filter(p => 
      p.ativo && p.mandatos?.some(m => m.legislaturaId === legislatura.id)
    )
  },

  // Buscar parlamentares com filtros avançados
  searchAdvanced: (filtros: {
    termo?: string
    partido?: string
    legislatura?: string
    ano?: string
  }): Parlamentar[] => {
    return parlamentaresData.filter(p => {
      if (!p.ativo) return false

      // Filtro por termo (nome, apelido)
      if (filtros.termo) {
        const termoLower = filtros.termo.toLowerCase()
        const matchesTermo = p.nome.toLowerCase().includes(termoLower) ||
                           p.apelido.toLowerCase().includes(termoLower)
        if (!matchesTermo) return false
      }

      // Filtro por partido
      if (filtros.partido && filtros.partido !== 'Todos') {
        if (p.partido !== filtros.partido) return false
      }

      // Filtro por legislatura
      if (filtros.legislatura && filtros.legislatura !== 'Todas') {
        const hasLegislatura = p.mandatos?.some(m => m.legislaturaId === filtros.legislatura)
        if (!hasLegislatura) return false
      }

      // Filtro por ano
      if (filtros.ano && filtros.ano !== 'Todos') {
        const legislatura = legislaturas.find(l => l.ano.includes(filtros.ano!))
        if (!legislatura) return false
        const hasAno = p.mandatos?.some(m => m.legislaturaId === legislatura.id)
        if (!hasAno) return false
      }

      return true
    })
  },

  // Estatísticas gerais
  getStats: () => {
    const ativos = parlamentaresData.filter(p => p.ativo)
    return {
      total: ativos.length,
      mesaDiretora: ativos.filter(p => p.mandatos?.some(m => m.ativo && m.cargo !== 'VEREADOR')).length,
      vereadores: ativos.filter(p => p.mandatos?.some(m => m.ativo && m.cargo === 'VEREADOR')).length,
      partidos: Array.from(new Set(ativos.map(p => p.partido))).length
    }
  }
}

// Serviços para gerenciar legislaturas
export const legislaturasService = {
  // Buscar todas as legislaturas
  getAll: (): Legislatura[] => {
    return legislaturas
  },

  // Buscar legislatura por ID
  getById: (id: string): Legislatura | undefined => {
    return legislaturas.find(l => l.id === id)
  },

  // Buscar legislatura ativa
  getAtiva: (): Legislatura | undefined => {
    return legislaturas.find(l => l.ativa)
  },

  // Buscar legislaturas por ano
  getByAno: (ano: string): Legislatura[] => {
    return legislaturas.filter(l => l.ano.includes(ano))
  },

  // Adicionar nova legislatura
  add: (legislatura: Omit<Legislatura, 'id'>): Legislatura => {
    const novaLegislatura: Legislatura = {
      ...legislatura,
      id: (legislaturas.length + 1).toString()
    }
    legislaturas.push(novaLegislatura)
    return novaLegislatura
  },

  // Atualizar legislatura
  update: (id: string, dados: Partial<Legislatura>): Legislatura | undefined => {
    const index = legislaturas.findIndex(l => l.id === id)
    if (index === -1) return undefined
    
    legislaturas[index] = { ...legislaturas[index], ...dados }
    return legislaturas[index]
  },

  // Desativar legislatura
  deactivate: (id: string): boolean => {
    const legislatura = legislaturas.find(l => l.id === id)
    if (!legislatura) return false
    
    legislatura.ativa = false
    return true
  }
}

// Serviços para gerenciar Mesa Diretora
export const mesaDiretoraService = {
  // Buscar todas as composições
  getAll: (): MesaDiretora[] => {
    return mesaDiretoraData
  },

  // Buscar por legislatura
  getByLegislatura: (legislaturaId: string): MesaDiretora[] => {
    return mesaDiretoraData.filter(m => m.legislaturaId === legislaturaId)
  },

  // Buscar por período específico
  getByPeriodo: (legislaturaId: string, periodo: number): MesaDiretora | undefined => {
    return mesaDiretoraData.find(m => m.legislaturaId === legislaturaId && m.periodo === periodo)
  },

  // Buscar composição ativa
  getAtiva: (legislaturaId: string): MesaDiretora | undefined => {
    return mesaDiretoraData.find(m => m.legislaturaId === legislaturaId && m.ativa)
  },

  // Buscar membros completos (com dados dos parlamentares)
  getMembrosCompletos: (mesaId: string) => {
    const mesa = mesaDiretoraData.find(m => m.id === mesaId)
    if (!mesa) return null
    
    return {
      ...mesa,
      membrosCompletos: {
        presidente: mesa.membros.presidente ? parlamentaresData.find(p => p.id === mesa.membros.presidente) : null,
        vicePresidente: mesa.membros.vicePresidente ? parlamentaresData.find(p => p.id === mesa.membros.vicePresidente) : null,
        primeiroSecretario: mesa.membros.primeiroSecretario ? parlamentaresData.find(p => p.id === mesa.membros.primeiroSecretario) : null,
        segundoSecretario: mesa.membros.segundoSecretario ? parlamentaresData.find(p => p.id === mesa.membros.segundoSecretario) : null,
      }
    }
  }
}

// Dados mock para Tipos de Tramitação
export const tiposTramitacaoData: TipoTramitacao[] = [
  {
    id: '1',
    nome: 'Recebimento',
    descricao: 'Recebimento da proposição na unidade',
    ordem: 1,
    ativo: true,
    cor: 'bg-blue-100 text-blue-800',
    prazoDias: 1,
    obrigatorio: true
  },
  {
    id: '2',
    nome: 'Análise',
    descricao: 'Análise técnica da proposição',
    ordem: 2,
    ativo: true,
    cor: 'bg-yellow-100 text-yellow-800',
    prazoDias: 5,
    obrigatorio: true
  },
  {
    id: '3',
    nome: 'Parecer',
    descricao: 'Elaboração de parecer',
    ordem: 3,
    ativo: true,
    cor: 'bg-green-100 text-green-800',
    prazoDias: 10,
    obrigatorio: true
  },
  {
    id: '4',
    nome: 'Aprovação',
    descricao: 'Aprovação da proposição',
    ordem: 4,
    ativo: true,
    cor: 'bg-green-100 text-green-800',
    obrigatorio: true
  },
  {
    id: '5',
    nome: 'Rejeição',
    descricao: 'Rejeição da proposição',
    ordem: 5,
    ativo: true,
    cor: 'bg-red-100 text-red-800',
    obrigatorio: false
  },
  {
    id: '6',
    nome: 'Arquivamento',
    descricao: 'Arquivamento da proposição',
    ordem: 6,
    ativo: true,
    cor: 'bg-gray-100 text-gray-800',
    obrigatorio: false
  }
]

// Dados mock para Unidades de Tramitação
export const unidadesTramitacaoData: UnidadeTramitacao[] = [
  {
    id: '1',
    nome: 'Comissão de Constituição e Justiça',
    sigla: 'CCJ',
    tipo: 'COMISSAO',
    descricao: 'Análise de constitucionalidade e juridicidade',
    ativo: true,
    ordem: 1
  },
  {
    id: '2',
    nome: 'Comissão de Finanças e Orçamento',
    sigla: 'CFO',
    tipo: 'COMISSAO',
    descricao: 'Análise de impacto financeiro e orçamentário',
    ativo: true,
    ordem: 2
  },
  {
    id: '3',
    nome: 'Comissão de Educação e Cultura',
    sigla: 'CEC',
    tipo: 'COMISSAO',
    descricao: 'Análise de matérias educacionais e culturais',
    ativo: true,
    ordem: 3
  },
  {
    id: '4',
    nome: 'Mesa Diretora',
    sigla: 'MESA',
    tipo: 'MESA_DIRETORA',
    descricao: 'Direção dos trabalhos legislativos',
    ativo: true,
    ordem: 4
  },
  {
    id: '5',
    nome: 'Plenário',
    sigla: 'PLEN',
    tipo: 'PLENARIO',
    descricao: 'Votação em plenário',
    ativo: true,
    ordem: 5
  },
  {
    id: '6',
    nome: 'Prefeitura Municipal',
    sigla: 'PREFEITURA',
    tipo: 'EXECUTIVO',
    descricao: 'Análise do Poder Executivo',
    ativo: true,
    ordem: 6
  }
]

// Dados mock para Proposições
export const proposicoesData: Proposicao[] = [
  {
    id: '1',
    numero: '001',
    ano: 2025,
    tipo: 'PROJETO_LEI',
    titulo: 'Projeto de Lei - Criação do Conselho Municipal de Educação',
    ementa: 'Institui o Conselho Municipal de Educação de Mojuí dos Campos e dá outras providências.',
    textoCompleto: 'Art. 1º Fica instituído o Conselho Municipal de Educação de Mojuí dos Campos, órgão colegiado de natureza consultiva, deliberativa e fiscalizadora...',
    autorId: '2',
    coautores: ['3', '4'],
    status: 'EM_TRAMITACAO',
    dataApresentacao: '2025-01-15T10:00:00Z',
    dataPublicacao: '2025-01-16T08:00:00Z',
    anexos: [
      {
        nome: 'PL_001_2025_Conselho_Educacao.pdf',
        url: '/documentos/pl_001_2025.pdf',
        tipo: 'PDF',
        data: '2025-01-15'
      }
    ],
    assuntos: ['Educação', 'Conselho Municipal', 'Política Pública'],
    tramitacoes: [
      {
        id: '1',
        proposicaoId: '1',
        tipoTramitacaoId: '1',
        unidadeTramitacaoId: '1',
        dataEntrada: '2025-01-16T08:00:00Z',
        status: 'CONCLUIDA',
        observacoes: 'Proposição recebida e protocolada',
        responsavel: 'Secretário da CCJ',
        ordem: 1,
        criadaEm: '2025-01-16T08:00:00Z',
        atualizadaEm: '2025-01-16T08:00:00Z'
      },
      {
        id: '2',
        proposicaoId: '1',
        tipoTramitacaoId: '2',
        unidadeTramitacaoId: '1',
        dataEntrada: '2025-01-16T08:00:00Z',
        dataSaida: '2025-01-21T17:00:00Z',
        status: 'CONCLUIDA',
        observacoes: 'Análise técnica concluída - constitucional',
        responsavel: 'Relator da CCJ',
        prazo: '2025-01-21',
        ordem: 2,
        criadaEm: '2025-01-16T08:00:00Z',
        atualizadaEm: '2025-01-21T17:00:00Z'
      },
      {
        id: '3',
        proposicaoId: '1',
        tipoTramitacaoId: '1',
        unidadeTramitacaoId: '2',
        dataEntrada: '2025-01-22T08:00:00Z',
        status: 'EM_ANDAMENTO',
        observacoes: 'Encaminhada para análise financeira',
        responsavel: 'Secretário da CFO',
        prazo: '2025-01-29',
        ordem: 3,
        criadaEm: '2025-01-22T08:00:00Z',
        atualizadaEm: '2025-01-22T08:00:00Z'
      }
    ],
    criadaEm: '2025-01-15T10:00:00Z',
    atualizadaEm: '2025-01-22T08:00:00Z'
  },
  {
    id: '2',
    numero: '002',
    ano: 2025,
    tipo: 'PROJETO_RESOLUCAO',
    titulo: 'Projeto de Resolução - Regulamentação de Sessões Virtuais',
    ementa: 'Regulamenta a realização de sessões legislativas em formato virtual.',
    textoCompleto: 'Art. 1º Fica regulamentada a realização de sessões legislativas em formato virtual...',
    autorId: '3',
    status: 'APROVADA',
    dataApresentacao: '2025-01-10T14:00:00Z',
    dataPublicacao: '2025-01-11T08:00:00Z',
    dataVotacao: '2025-01-25T19:00:00Z',
    resultadoVotacao: {
      votosFavoraveis: 8,
      votosContrarios: 2,
      abstencao: 1,
      ausentes: 0
    },
    tramitacoes: [
      {
        id: '4',
        proposicaoId: '2',
        tipoTramitacaoId: '1',
        unidadeTramitacaoId: '1',
        dataEntrada: '2025-01-11T08:00:00Z',
        dataSaida: '2025-01-16T17:00:00Z',
        status: 'CONCLUIDA',
        observacoes: 'Recebida e analisada',
        responsavel: 'Secretário da CCJ',
        ordem: 1,
        criadaEm: '2025-01-11T08:00:00Z',
        atualizadaEm: '2025-01-16T17:00:00Z'
      },
      {
        id: '5',
        proposicaoId: '2',
        tipoTramitacaoId: '4',
        unidadeTramitacaoId: '5',
        dataEntrada: '2025-01-25T19:00:00Z',
        dataSaida: '2025-01-25T19:30:00Z',
        status: 'CONCLUIDA',
        observacoes: 'Aprovada em plenário',
        responsavel: 'Presidente da Câmara',
        ordem: 2,
        criadaEm: '2025-01-25T19:00:00Z',
        atualizadaEm: '2025-01-25T19:30:00Z'
      }
    ],
    criadaEm: '2025-01-10T14:00:00Z',
    atualizadaEm: '2025-01-25T19:30:00Z'
  }
]

// Dados mock para Sessões Legislativas
export const sessoesLegislativasData: SessaoLegislativa[] = [
  {
    id: '1',
    numero: '001',
    tipo: 'ORDINARIA',
    status: 'CONCLUIDA',
    dataHora: '2025-01-15T19:00:00Z',
    local: 'Câmara Municipal de Mojuí dos Campos',
    presidenteId: '1',
    vicePresidenteId: '2',
    secretario1Id: '3',
    secretario2Id: '4',
    quorumMinimo: 6,
    quorumPresente: 9,
    titulo: 'Sessão Ordinária - 15/01/2025',
    descricao: 'Sessão ordinária para apreciação de proposições legislativas',
    
    pauta: {
      expediente: [
        {
          id: '1-1',
          tipo: 'EXPEDIENTE',
          categoria: 'COMUNICACAO',
          titulo: 'Leitura de Comunicações',
          descricao: 'Leitura de comunicações recebidas',
          prioridade: 'MEDIA',
          status: 'PENDENTE',
          ordem: 1,
          tempoEstimado: 15
        }
      ],
      ordemDoDia: [
        {
          id: '1-2',
          tipo: 'ORDEM_DO_DIA',
          categoria: 'PROJETO_LEI',
          numero: 'PL 001/2025',
          titulo: 'Projeto de Lei - Criação do Conselho Municipal de Educação',
          descricao: 'Institui o Conselho Municipal de Educação de Mojuí dos Campos',
          autor: 'Vereador Diego Silva',
          parlamentarId: '2',
          prioridade: 'ALTA',
          status: 'APROVADO',
          ordem: 1,
          tempoEstimado: 45,
          anexos: [
            {
              nome: 'PL_001_2025_Conselho_Educacao.pdf',
              url: '/documentos/pl_001_2025.pdf',
              tipo: 'PDF'
            }
          ]
        }
      ],
      observacoes: 'Sessão com transmissão ao vivo pelo canal oficial da Câmara',
      publicadaEm: '2025-01-10T10:00:00Z'
    },
    
    presenca: [
      { parlamentarId: '1', presente: true, chegada: '18:45', saida: '21:30' },
      { parlamentarId: '2', presente: true, chegada: '18:50', saida: '21:25' },
      { parlamentarId: '3', presente: true, chegada: '18:55', saida: '21:35' },
      { parlamentarId: '4', presente: true, chegada: '19:00', saida: '21:20' },
      { parlamentarId: '5', presente: true, chegada: '19:05', saida: '21:40' },
      { parlamentarId: '6', presente: true, chegada: '19:10', saida: '21:15' },
      { parlamentarId: '7', presente: true, chegada: '19:15', saida: '21:45' },
      { parlamentarId: '8', presente: true, chegada: '19:20', saida: '21:10' },
      { parlamentarId: '9', presente: true, chegada: '19:25', saida: '21:50' },
      { parlamentarId: '10', presente: false, justificativa: 'Licença médica' },
      { parlamentarId: '11', presente: false, justificativa: 'Ausência justificada' }
    ],
    
    documentos: [
      {
        nome: 'Ata_Sessao_001_2025.pdf',
        url: '/documentos/ata_001_2025.pdf',
        tipo: 'PDF',
        data: '2025-01-15'
      }
    ],
    
    ata: {
      conteudo: 'Aos quinze dias do mês de janeiro de dois mil e vinte e cinco, às dezenove horas...',
      aprovada: true,
      dataAprovacao: '2025-01-22T10:00:00Z'
    },
    
    criadaEm: '2025-01-08T14:30:00Z',
    atualizadaEm: '2025-01-22T10:00:00Z'
  }
]

// Serviços para gerenciar Pautas das Sessões
export const pautasSessoesService = {
  // Buscar todas as pautas
  getAll: (): PautaSessao[] => {
    return pautasSessoesData
  },

  // Buscar pauta por ID
  getById: (id: string): PautaSessao | undefined => {
    return pautasSessoesData.find(p => p.id === id)
  },

  // Buscar pautas por sessão
  getBySessao: (sessaoId: string): PautaSessao[] => {
    return pautasSessoesData.filter(p => p.sessaoId === sessaoId)
  },

  // Buscar pautas por status
  getByStatus: (status: string): PautaSessao[] => {
    return pautasSessoesData.filter(p => p.status === status)
  },

  // Buscar pautas por tipo
  getByTipo: (tipo: string): PautaSessao[] => {
    return pautasSessoesData.filter(p => p.tipo === tipo)
  },

  // Buscar pautas por data
  getByData: (data: string): PautaSessao[] => {
    return pautasSessoesData.filter(p => p.data === data)
  },

  // Buscar pautas publicadas
  getPublicadas: (): PautaSessao[] => {
    return pautasSessoesData.filter(p => p.status === 'PUBLICADA' || p.status === 'APROVADA')
  },

  // Buscar pautas em rascunho
  getRascunhos: (): PautaSessao[] => {
    return pautasSessoesData.filter(p => p.status === 'RASCUNHO')
  },

  // Adicionar nova pauta
  add: (pauta: Omit<PautaSessao, 'id' | 'criadaEm' | 'atualizadaEm'>): PautaSessao => {
    const novaPauta: PautaSessao = {
      ...pauta,
      id: (pautasSessoesData.length + 1).toString(),
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    }
    pautasSessoesData.push(novaPauta)
    return novaPauta
  },

  // Atualizar pauta
  update: (id: string, dados: Partial<PautaSessao>): PautaSessao | undefined => {
    const index = pautasSessoesData.findIndex(p => p.id === id)
    if (index === -1) return undefined

    pautasSessoesData[index] = {
      ...pautasSessoesData[index],
      ...dados,
      atualizadaEm: new Date().toISOString()
    }
    return pautasSessoesData[index]
  },

  // Remover pauta
  remove: (id: string): boolean => {
    const index = pautasSessoesData.findIndex(p => p.id === id)
    if (index === -1) return false

    pautasSessoesData.splice(index, 1)
    return true
  },

  // Buscar com filtros
  search: (filtros: {
    termo?: string
    status?: string
    tipo?: string
    dataInicio?: string
    dataFim?: string
  }): PautaSessao[] => {
    return pautasSessoesData.filter(p => {
      // Filtro por termo
      if (filtros.termo) {
        const termoLower = filtros.termo.toLowerCase()
        if (!p.titulo.toLowerCase().includes(termoLower) &&
            !p.descricao?.toLowerCase().includes(termoLower)) {
          return false
        }
      }

      // Filtro por status
      if (filtros.status && filtros.status !== 'TODOS') {
        if (p.status !== filtros.status) return false
      }

      // Filtro por tipo
      if (filtros.tipo && filtros.tipo !== 'TODOS') {
        if (p.tipo !== filtros.tipo) return false
      }

      // Filtro por data
      if (filtros.dataInicio && p.data < filtros.dataInicio) return false
      if (filtros.dataFim && p.data > filtros.dataFim) return false

      return true
    })
  },

  // Estatísticas gerais
  getStats: () => {
    return {
      total: pautasSessoesData.length,
      publicadas: pautasSessoesData.filter(p => p.status === 'PUBLICADA').length,
      rascunhos: pautasSessoesData.filter(p => p.status === 'RASCUNHO').length,
      aprovadas: pautasSessoesData.filter(p => p.status === 'APROVADA').length,
      ordinarias: pautasSessoesData.filter(p => p.tipo === 'ORDINARIA').length,
      extraordinarias: pautasSessoesData.filter(p => p.tipo === 'EXTRAORDINARIA').length
    }
  }
}

// Serviços para gerenciar Audiências Públicas
export const audienciasPublicasService = {
  // Buscar todas as audiências
  getAll: (): AudienciaPublica[] => {
    return audienciasPublicasData
  },

  // Buscar audiência por ID
  getById: (id: string): AudienciaPublica | undefined => {
    return audienciasPublicasData.find(a => a.id === id)
  },

  // Buscar audiências por status
  getByStatus: (status: string): AudienciaPublica[] => {
    return audienciasPublicasData.filter(a => a.status === status)
  },

  // Buscar audiências por tipo
  getByTipo: (tipo: string): AudienciaPublica[] => {
    return audienciasPublicasData.filter(a => a.tipo === tipo)
  },

  // Buscar audiências por parlamentar
  getByParlamentar: (parlamentarId: string): AudienciaPublica[] => {
    return audienciasPublicasData.filter(a => a.parlamentarId === parlamentarId)
  },

  // Buscar audiências por comissão
  getByComissao: (comissaoId: string): AudienciaPublica[] => {
    return audienciasPublicasData.filter(a => a.comissaoId === comissaoId)
  },

  // Buscar audiências agendadas
  getAgendadas: (): AudienciaPublica[] => {
    return audienciasPublicasData.filter(a => a.status === 'AGENDADA')
  },

  // Buscar audiências concluídas
  getConcluidas: (): AudienciaPublica[] => {
    return audienciasPublicasData.filter(a => a.status === 'CONCLUIDA')
  },

  // Buscar audiências por data
  getByData: (data: string): AudienciaPublica[] => {
    return audienciasPublicasData.filter(a => a.dataHora.startsWith(data))
  },

  // Adicionar nova audiência
  add: (audiencia: Omit<AudienciaPublica, 'id' | 'numero' | 'criadaEm' | 'atualizadaEm'>): AudienciaPublica => {
    // Gerar número sequencial automático
    const anoAtual = new Date().getFullYear()
    const proximoNumero = audienciasPublicasData.length + 1
    const numero = `AP-${proximoNumero.toString().padStart(3, '0')}/${anoAtual}`
    
    const novaAudiencia: AudienciaPublica = {
      ...audiencia,
      id: (audienciasPublicasData.length + 1).toString(),
      numero,
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    }
    audienciasPublicasData.push(novaAudiencia)
    return novaAudiencia
  },

  // Atualizar audiência
  update: (id: string, dados: Partial<AudienciaPublica>): AudienciaPublica | undefined => {
    const index = audienciasPublicasData.findIndex(a => a.id === id)
    if (index === -1) return undefined

    audienciasPublicasData[index] = {
      ...audienciasPublicasData[index],
      ...dados,
      atualizadaEm: new Date().toISOString()
    }
    return audienciasPublicasData[index]
  },

  // Remover audiência
  remove: (id: string): boolean => {
    const index = audienciasPublicasData.findIndex(a => a.id === id)
    if (index === -1) return false

    audienciasPublicasData.splice(index, 1)
    return true
  },

  // Buscar com filtros
  search: (filtros: {
    termo?: string
    status?: string
    tipo?: string
    dataInicio?: string
    dataFim?: string
    responsavel?: string
  }): AudienciaPublica[] => {
    return audienciasPublicasData.filter(a => {
      // Filtro por termo
      if (filtros.termo) {
        const termoLower = filtros.termo.toLowerCase()
        if (!a.titulo.toLowerCase().includes(termoLower) &&
            !a.descricao.toLowerCase().includes(termoLower) &&
            !a.objetivo.toLowerCase().includes(termoLower)) {
          return false
        }
      }

      // Filtro por status
      if (filtros.status && filtros.status !== 'TODOS') {
        if (a.status !== filtros.status) return false
      }

      // Filtro por tipo
      if (filtros.tipo && filtros.tipo !== 'TODOS') {
        if (a.tipo !== filtros.tipo) return false
      }

      // Filtro por responsável
      if (filtros.responsavel && filtros.responsavel !== 'TODOS') {
        if (a.responsavel !== filtros.responsavel) return false
      }

      // Filtro por data
      if (filtros.dataInicio && a.dataHora < filtros.dataInicio) return false
      if (filtros.dataFim && a.dataHora > filtros.dataFim) return false

      return true
    })
  },

  // Estatísticas gerais
  getStats: () => {
    return {
      total: audienciasPublicasData.length,
      agendadas: audienciasPublicasData.filter(a => a.status === 'AGENDADA').length,
      concluidas: audienciasPublicasData.filter(a => a.status === 'CONCLUIDA').length,
      canceladas: audienciasPublicasData.filter(a => a.status === 'CANCELADA').length,
      ordinarias: audienciasPublicasData.filter(a => a.tipo === 'ORDINARIA').length,
      extraordinarias: audienciasPublicasData.filter(a => a.tipo === 'EXTRAORDINARIA').length,
      especiais: audienciasPublicasData.filter(a => a.tipo === 'ESPECIAL').length
    }
  }
}

// Serviços para gerenciar Tipos de Tramitação
export const tiposTramitacaoService = {
  getAll: (): TipoTramitacao[] => tiposTramitacaoData,
  getById: (id: string): TipoTramitacao | undefined => tiposTramitacaoData.find(t => t.id === id),
  add: (tipo: Omit<TipoTramitacao, 'id'>): TipoTramitacao => {
    const novoTipo = { ...tipo, id: (tiposTramitacaoData.length + 1).toString() }
    tiposTramitacaoData.push(novoTipo)
    return novoTipo
  },
  update: (id: string, dados: Partial<TipoTramitacao>): TipoTramitacao | undefined => {
    const index = tiposTramitacaoData.findIndex(t => t.id === id)
    if (index === -1) return undefined
    tiposTramitacaoData[index] = { ...tiposTramitacaoData[index], ...dados }
    return tiposTramitacaoData[index]
  },
  remove: (id: string): boolean => {
    const index = tiposTramitacaoData.findIndex(t => t.id === id)
    if (index === -1) return false
    tiposTramitacaoData.splice(index, 1)
    return true
  }
}

// Serviços para gerenciar Unidades de Tramitação
export const unidadesTramitacaoService = {
  getAll: (): UnidadeTramitacao[] => unidadesTramitacaoData,
  getById: (id: string): UnidadeTramitacao | undefined => unidadesTramitacaoData.find(u => u.id === id),
  add: (unidade: Omit<UnidadeTramitacao, 'id'>): UnidadeTramitacao => {
    const novaUnidade = { ...unidade, id: (unidadesTramitacaoData.length + 1).toString() }
    unidadesTramitacaoData.push(novaUnidade)
    return novaUnidade
  },
  update: (id: string, dados: Partial<UnidadeTramitacao>): UnidadeTramitacao | undefined => {
    const index = unidadesTramitacaoData.findIndex(u => u.id === id)
    if (index === -1) return undefined
    unidadesTramitacaoData[index] = { ...unidadesTramitacaoData[index], ...dados }
    return unidadesTramitacaoData[index]
  },
  remove: (id: string): boolean => {
    const index = unidadesTramitacaoData.findIndex(u => u.id === id)
    if (index === -1) return false
    unidadesTramitacaoData.splice(index, 1)
    return true
  }
}

// Serviços para gerenciar Proposições
export const proposicoesService = {
  getAll: (): Proposicao[] => proposicoesData,
  getById: (id: string): Proposicao | undefined => proposicoesData.find(p => p.id === id),
  add: (proposicao: Omit<Proposicao, 'id' | 'criadaEm' | 'atualizadaEm'>): Proposicao => {
    const novaProposicao = { ...proposicao, id: (proposicoesData.length + 1).toString(), criadaEm: new Date().toISOString(), atualizadaEm: new Date().toISOString() }
    proposicoesData.push(novaProposicao)
    return novaProposicao
  },
  update: (id: string, dados: Partial<Proposicao>): Proposicao | undefined => {
    const index = proposicoesData.findIndex(p => p.id === id)
    if (index === -1) return undefined
    proposicoesData[index] = { ...proposicoesData[index], ...dados, atualizadaEm: new Date().toISOString() }
    return proposicoesData[index]
  },
  remove: (id: string): boolean => {
    const index = proposicoesData.findIndex(p => p.id === id)
    if (index === -1) return false
    proposicoesData.splice(index, 1)
    return true
  },
  getByStatus: (status: Proposicao['status']): Proposicao[] => proposicoesData.filter(p => p.status === status),
  getByTipo: (tipo: Proposicao['tipo']): Proposicao[] => proposicoesData.filter(p => p.tipo === tipo),
  getByAutor: (autorId: string): Proposicao[] => proposicoesData.filter(p => p.autorId === autorId),
  search: (termo: string): Proposicao[] => proposicoesData.filter(p => p.titulo.toLowerCase().includes(termo.toLowerCase()) || p.ementa.toLowerCase().includes(termo.toLowerCase())),
  addTramitacao: (proposicaoId: string, tramitacao: Omit<Tramitacao, 'id' | 'proposicaoId' | 'criadaEm' | 'atualizadaEm'>): Tramitacao | undefined => {
    const proposicao = proposicoesData.find(p => p.id === proposicaoId)
    if (!proposicao) return undefined

    const novaTramitacao: Tramitacao = {
      ...tramitacao,
      id: (proposicao.tramitacoes.length + 1).toString(),
      proposicaoId,
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    }

    proposicao.tramitacoes.push(novaTramitacao)
    proposicao.atualizadaEm = new Date().toISOString()
    return novaTramitacao
  },
  updateTramitacao: (proposicaoId: string, tramitacaoId: string, dados: Partial<Tramitacao>): Tramitacao | undefined => {
    const proposicao = proposicoesData.find(p => p.id === proposicaoId)
    if (!proposicao) return undefined

    const tramitacao = proposicao.tramitacoes.find(t => t.id === tramitacaoId)
    if (!tramitacao) return undefined

    Object.assign(tramitacao, dados, { atualizadaEm: new Date().toISOString() })
    proposicao.atualizadaEm = new Date().toISOString()
    return tramitacao
  },
  getStats: () => ({
    total: proposicoesData.length,
    apresentadas: proposicoesData.filter(p => p.status === 'APRESENTADA').length,
    emTramitacao: proposicoesData.filter(p => p.status === 'EM_TRAMITACAO').length,
    aprovadas: proposicoesData.filter(p => p.status === 'APROVADA').length,
    rejeitadas: proposicoesData.filter(p => p.status === 'REJEITADA').length,
    arquivadas: proposicoesData.filter(p => p.status === 'ARQUIVADA').length,
    projetosLei: proposicoesData.filter(p => p.tipo === 'PROJETO_LEI').length,
    projetosResolucao: proposicoesData.filter(p => p.tipo === 'PROJETO_RESOLUCAO').length,
    projetosDecreto: proposicoesData.filter(p => p.tipo === 'PROJETO_DECRETO').length
  })
}

// Serviços para gerenciar Sessões Legislativas
export const sessoesLegislativasService = {
  getAll: (): SessaoLegislativa[] => sessoesLegislativasData,
  getById: (id: string): SessaoLegislativa | undefined => sessoesLegislativasData.find(s => s.id === id),
  add: (sessao: Omit<SessaoLegislativa, 'id' | 'criadaEm' | 'atualizadaEm'>): SessaoLegislativa => {
    const novaSessao = { ...sessao, id: (sessoesLegislativasData.length + 1).toString(), criadaEm: new Date().toISOString(), atualizadaEm: new Date().toISOString() }
    sessoesLegislativasData.push(novaSessao)
    return novaSessao
  },
  update: (id: string, dados: Partial<SessaoLegislativa>): SessaoLegislativa | undefined => {
    const index = sessoesLegislativasData.findIndex(s => s.id === id)
    if (index === -1) return undefined
    sessoesLegislativasData[index] = { ...sessoesLegislativasData[index], ...dados, atualizadaEm: new Date().toISOString() }
    return sessoesLegislativasData[index]
  },
  remove: (id: string): boolean => {
    const index = sessoesLegislativasData.findIndex(s => s.id === id)
    if (index === -1) return false
    sessoesLegislativasData.splice(index, 1)
    return true
  },
  getSessoesAgendadas: (): SessaoLegislativa[] => sessoesLegislativasData.filter(s => s.status === 'AGENDADA'),
  getSessoesConcluidas: (): SessaoLegislativa[] => sessoesLegislativasData.filter(s => s.status === 'CONCLUIDA'),
  getSessoesPorTipo: (tipo: SessaoLegislativa['tipo']): SessaoLegislativa[] => sessoesLegislativasData.filter(s => s.tipo === tipo),
  getSessoesPorData: (data: string): SessaoLegislativa[] => sessoesLegislativasData.filter(s => s.dataHora.startsWith(data)),
  getStats: () => ({
    total: sessoesLegislativasData.length,
    agendadas: sessoesLegislativasData.filter(s => s.status === 'AGENDADA').length,
    concluidas: sessoesLegislativasData.filter(s => s.status === 'CONCLUIDA').length,
    ordinarias: sessoesLegislativasData.filter(s => s.tipo === 'ORDINARIA').length,
    extraordinarias: sessoesLegislativasData.filter(s => s.tipo === 'EXTRAORDINARIA').length,
  })
}

// Função para gerar slug a partir do apelido
export const generateSlug = (apelido: string): string => {
  return apelido.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
}
