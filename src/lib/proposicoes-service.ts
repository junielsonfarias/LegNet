export interface AnexoDocumento {
  id: string;
  nome: string;
  tipo: 'pdf' | 'doc' | 'docx';
  tamanho: number; // in bytes
  url: string;
  dataUpload: string;
}

export interface LeiReferenciada {
  id: string;
  numero: string;
  ano: number;
  titulo: string;
  tipo: 'lei' | 'decreto' | 'resolucao' | 'portaria' | 'regimento' | 'lei_organica';
  tipoRelacao: 'altera' | 'revoga' | 'inclui' | 'exclui' | 'regulamenta' | 'complementa';
  dispositivo?: string; // Artigo, parágrafo, inciso específico
  justificativa?: string; // Justificativa para a alteração
}

export interface Proposicao {
  id: string;
  numero: string;
  numeroAutomatico?: boolean; // Indica se o número foi gerado automaticamente
  titulo: string;
  tipo: 'projeto_lei' | 'projeto_resolucao' | 'projeto_decreto' | 'indicacao' | 'requerimento' | 'moção';
  status: 'em_tramitacao' | 'aprovada' | 'rejeitada' | 'arquivada';
  dataApresentacao: string;
  dataVotacao?: string;
  autorId: string; // Autor principal (mantido para compatibilidade)
  autores: string[]; // Array de IDs dos autores
  legislaturaId: string;
  descricao?: string;
  ementa?: string; // Ementa da proposição
  texto?: string;
  justificativa?: string;
  anexos?: AnexoDocumento[]; // Array de documentos anexados
  leisReferenciadas?: LeiReferenciada[]; // Array de leis que a proposição altera/revoga/inclui
  tramitacoes?: Tramitacao[];
  comissoes?: string[];
  votos?: { parlamentarId: string; voto: 'sim' | 'nao' | 'abstencao' }[];
}

export interface Tramitacao {
  id: string;
  data: string;
  status: string;
  unidade: string;
  observacoes?: string;
}

const proposicoesData: Proposicao[] = [
  {
    id: '1',
    numero: '001/2024',
    numeroAutomatico: true,
    titulo: 'Projeto de Lei que institui o Programa de Apoio ao Desenvolvimento Rural',
    tipo: 'projeto_lei',
    status: 'em_tramitacao',
    dataApresentacao: '2024-01-10T10:00:00Z',
    autorId: '1',
    autores: ['1'],
    legislaturaId: 'leg-2021-2024',
    descricao: 'Institui programa de apoio ao desenvolvimento rural do município',
    ementa: 'Institui o Programa de Apoio ao Desenvolvimento Rural do Município de Mojuí dos Campos, estabelecendo diretrizes, objetivos e mecanismos de apoio aos produtores rurais.',
    texto: 'Art. 1º Fica instituído o Programa de Apoio ao Desenvolvimento Rural...',
    justificativa: 'Necessidade de apoiar o desenvolvimento rural do município',
    anexos: [
      {
        id: 'anexo-1',
        nome: 'projeto-lei-rural.pdf',
        tipo: 'pdf',
        tamanho: 245760, // 240KB
        url: '/uploads/proposicoes/projeto-lei-rural.pdf',
        dataUpload: '2024-01-10T10:30:00Z'
      },
      {
        id: 'anexo-2',
        nome: 'justificativa-rural.docx',
        tipo: 'docx',
        tamanho: 15360, // 15KB
        url: '/uploads/proposicoes/justificativa-rural.docx',
        dataUpload: '2024-01-10T10:35:00Z'
      }
    ],
    leisReferenciadas: [
      {
        id: 'ref-1',
        numero: '005',
        ano: 2022,
        titulo: 'Lei de Organização da Administração Municipal',
        tipo: 'lei',
        tipoRelacao: 'altera',
        dispositivo: 'Art. 15, § 2º',
        justificativa: 'Necessidade de incluir dispositivos específicos para o desenvolvimento rural'
      }
    ],
    tramitacoes: [
      {
        id: 't1',
        data: '2024-01-10T10:00:00Z',
        status: 'Apresentada',
        unidade: 'Mesa Diretora',
        observacoes: 'Projeto apresentado pelo vereador',
      },
      {
        id: 't2',
        data: '2024-01-15T14:00:00Z',
        status: 'Encaminhada para Comissão',
        unidade: 'Comissão de Constituição e Justiça',
        observacoes: 'Encaminhada para análise técnica',
      },
    ],
    comissoes: ['1'],
  },
  {
    id: '2',
    numero: '002/2024',
    numeroAutomatico: true,
    titulo: 'Indicação para Melhoria da Iluminação Pública',
    tipo: 'indicacao',
    status: 'aprovada',
    dataApresentacao: '2024-01-05T09:00:00Z',
    dataVotacao: '2024-01-20T15:00:00Z',
    autorId: '2',
    autores: ['2', '3'], // Múltiplos autores
    legislaturaId: 'leg-2021-2024',
    descricao: 'Indicação para melhoria da iluminação pública no centro da cidade',
    ementa: 'Indica ao Poder Executivo a necessidade de melhorar a iluminação pública no centro da cidade, especialmente nas principais vias de circulação, visando aumentar a segurança e visibilidade noturna.',
    justificativa: 'Necessidade de melhorar a segurança e visibilidade',
    anexos: [
      {
        id: 'anexo-3',
        nome: 'indicacao-iluminacao.pdf',
        tipo: 'pdf',
        tamanho: 189440, // 185KB
        url: '/uploads/proposicoes/indicacao-iluminacao.pdf',
        dataUpload: '2024-01-05T09:15:00Z'
      }
    ],
    leisReferenciadas: [
      {
        id: 'ref-2',
        numero: '002',
        ano: 2020,
        titulo: 'Regimento Interno da Câmara Municipal',
        tipo: 'regimento',
        tipoRelacao: 'inclui',
        dispositivo: 'Capítulo III',
        justificativa: 'Incluir dispositivos sobre iluminação pública no regimento'
      }
    ],
    tramitacoes: [
      {
        id: 't3',
        data: '2024-01-05T09:00:00Z',
        status: 'Apresentada',
        unidade: 'Mesa Diretora',
      },
      {
        id: 't4',
        data: '2024-01-20T15:00:00Z',
        status: 'Aprovada',
        unidade: 'Plenário',
        observacoes: 'Aprovada por unanimidade',
      },
    ],
    votos: [
      { parlamentarId: '1', voto: 'sim' },
      { parlamentarId: '2', voto: 'sim' },
      { parlamentarId: '3', voto: 'sim' },
    ],
  },
  {
    id: '3',
    numero: '003/2024',
    numeroAutomatico: false, // Exemplo de numeração manual (dados históricos)
    titulo: 'Requerimento de Informações sobre Obras Públicas',
    tipo: 'requerimento',
    status: 'em_tramitacao',
    dataApresentacao: '2024-01-12T11:00:00Z',
    autorId: '3',
    autores: ['3', '4', '5'], // Múltiplos autores
    legislaturaId: 'leg-2021-2024',
    descricao: 'Requerimento de informações sobre o andamento das obras públicas',
    ementa: 'Requer informações detalhadas ao Poder Executivo sobre o andamento das obras públicas em execução no município, incluindo cronograma, recursos aplicados e previsão de conclusão.',
    justificativa: 'Necessidade de transparência e controle social',
    tramitacoes: [
      {
        id: 't5',
        data: '2024-01-12T11:00:00Z',
        status: 'Apresentado',
        unidade: 'Mesa Diretora',
      },
    ],
  },
];

export const proposicoesService = {
  getAll: (): Proposicao[] => {
    return proposicoesData;
  },

  // Função para gerar número automático sequencial por tipo e ano
  gerarNumeroAutomatico: (tipo: string, ano: number): string => {
    const proposicoesDoTipoAno = proposicoesData.filter(p => 
      p.tipo === tipo && 
      p.numero.includes(`/${ano}`) &&
      p.numeroAutomatico === true
    )
    
    const proximoNumero = proposicoesDoTipoAno.length + 1
    return proximoNumero.toString().padStart(3, '0')
  },

  // Função para verificar se um número já existe para o tipo e ano
  numeroExiste: (numero: string, tipo: string, ano: number, excluirId?: string): boolean => {
    return proposicoesData.some(p => 
      p.id !== excluirId &&
      p.numero === `${numero}/${ano}` &&
      p.tipo === tipo
    )
  },

  // Função para obter o próximo número disponível para um tipo e ano
  obterProximoNumero: (tipo: string, ano: number): string => {
    let numero = 1
    // Chama a função diretamente ao invés de usar this
    const numeroExiste = (num: string, t: string, a: number): boolean => {
      return proposicoesData.some(p =>
        p.numero === `${num}/${a}` &&
        p.tipo === t
      )
    }
    while (numeroExiste(numero.toString().padStart(3, '0'), tipo, ano)) {
      numero++
    }
    return numero.toString().padStart(3, '0')
  },
  getById: (id: string): Proposicao | undefined => {
    return proposicoesData.find(proposicao => proposicao.id === id);
  },
  getByLegislatura: (legislaturaId: string): Proposicao[] => {
    return proposicoesData.filter(proposicao => proposicao.legislaturaId === legislaturaId);
  },
  getByStatus: (status: Proposicao['status']): Proposicao[] => {
    return proposicoesData.filter(proposicao => proposicao.status === status);
  },
  getByTipo: (tipo: Proposicao['tipo']): Proposicao[] => {
    return proposicoesData.filter(proposicao => proposicao.tipo === tipo);
  },
  getByAutor: (autorId: string): Proposicao[] => {
    return proposicoesData.filter(proposicao => proposicao.autorId === autorId);
  },
  create: (novaProposicao: Omit<Proposicao, 'id'>): Proposicao => {
    const proposicao: Proposicao = {
      ...novaProposicao,
      id: `proposicao-${Date.now()}`,
    };
    proposicoesData.push(proposicao);
    return proposicao;
  },
  update: (proposicaoAtualizada: Proposicao): Proposicao => {
    const index = proposicoesData.findIndex(proposicao => proposicao.id === proposicaoAtualizada.id);
    if (index !== -1) {
      proposicoesData[index] = proposicaoAtualizada;
      return proposicaoAtualizada;
    }
    throw new Error('Proposição não encontrada');
  },
  delete: (id: string): void => {
    const index = proposicoesData.findIndex(proposicao => proposicao.id === id);
    if (index !== -1) {
      proposicoesData.splice(index, 1);
    } else {
      throw new Error('Proposição não encontrada');
    }
  },
  addTramitacao: (proposicaoId: string, tramitacao: Omit<Tramitacao, 'id'>): void => {
    const proposicao = proposicoesData.find(p => p.id === proposicaoId);
    if (proposicao) {
      const novaTramitacao: Tramitacao = {
        ...tramitacao,
        id: `tramitacao-${Date.now()}`,
      };
      if (!proposicao.tramitacoes) {
        proposicao.tramitacoes = [];
      }
      proposicao.tramitacoes.push(novaTramitacao);
    }
  },
};
