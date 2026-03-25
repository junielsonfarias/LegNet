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

const proposicoesData: Proposicao[] = [];

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
