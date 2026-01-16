export interface Lei {
  id: string;
  numero: string;
  ano: number;
  titulo: string;
  tipo: 'lei' | 'decreto' | 'resolucao' | 'portaria' | 'regimento' | 'lei_organica';
  dataPublicacao: string;
  dataVigencia?: string;
  status: 'vigente' | 'revogada' | 'alterada' | 'suspensa';
  texto?: string;
  ementa?: string;
  palavrasChave?: string[];
}

const leisData: Lei[] = [
  {
    id: 'lei-1',
    numero: '001',
    ano: 2020,
    titulo: 'Lei Orgânica do Município de Mojuí dos Campos',
    tipo: 'lei_organica',
    dataPublicacao: '2020-01-15T00:00:00Z',
    dataVigencia: '2020-01-15T00:00:00Z',
    status: 'vigente',
    ementa: 'Dispõe sobre a organização dos Poderes e o funcionamento das instituições municipais',
    palavrasChave: ['lei orgânica', 'município', 'poderes', 'organização']
  },
  {
    id: 'lei-2',
    numero: '002',
    ano: 2020,
    titulo: 'Regimento Interno da Câmara Municipal',
    tipo: 'regimento',
    dataPublicacao: '2020-02-01T00:00:00Z',
    dataVigencia: '2020-02-01T00:00:00Z',
    status: 'vigente',
    ementa: 'Regulamenta o funcionamento interno da Câmara Municipal',
    palavrasChave: ['regimento', 'câmara', 'funcionamento', 'sessões']
  },
  {
    id: 'lei-3',
    numero: '003',
    ano: 2021,
    titulo: 'Lei de Diretrizes Orçamentárias',
    tipo: 'lei',
    dataPublicacao: '2021-01-15T00:00:00Z',
    dataVigencia: '2021-01-15T00:00:00Z',
    status: 'vigente',
    ementa: 'Estabelece as diretrizes para elaboração e execução da lei orçamentária anual',
    palavrasChave: ['ldo', 'orçamento', 'diretrizes', 'planejamento']
  },
  {
    id: 'lei-4',
    numero: '004',
    ano: 2021,
    titulo: 'Lei Orçamentária Anual',
    tipo: 'lei',
    dataPublicacao: '2021-12-15T00:00:00Z',
    dataVigencia: '2022-01-01T00:00:00Z',
    status: 'vigente',
    ementa: 'Autoriza o orçamento anual do município para o exercício de 2022',
    palavrasChave: ['loa', 'orçamento', 'exercício', '2022']
  },
  {
    id: 'lei-5',
    numero: '005',
    ano: 2022,
    titulo: 'Lei de Organização da Administração Municipal',
    tipo: 'lei',
    dataPublicacao: '2022-03-10T00:00:00Z',
    dataVigencia: '2022-03-10T00:00:00Z',
    status: 'vigente',
    ementa: 'Dispõe sobre a estrutura organizacional da administração municipal',
    palavrasChave: ['administração', 'organização', 'estrutura', 'secretarias']
  },
  {
    id: 'lei-6',
    numero: '006',
    ano: 2022,
    titulo: 'Lei do Código Tributário Municipal',
    tipo: 'lei',
    dataPublicacao: '2022-06-20T00:00:00Z',
    dataVigencia: '2022-06-20T00:00:00Z',
    status: 'vigente',
    ementa: 'Institui o Código Tributário do Município de Mojuí dos Campos',
    palavrasChave: ['tributário', 'impostos', 'taxas', 'contribuições']
  },
  {
    id: 'decreto-1',
    numero: '001',
    ano: 2023,
    titulo: 'Decreto de Regulamentação do Funcionamento dos Serviços Públicos',
    tipo: 'decreto',
    dataPublicacao: '2023-01-15T00:00:00Z',
    dataVigencia: '2023-01-15T00:00:00Z',
    status: 'vigente',
    ementa: 'Regulamenta o funcionamento dos serviços públicos municipais',
    palavrasChave: ['serviços', 'públicos', 'funcionamento', 'regulamentação']
  },
  {
    id: 'resolucao-1',
    numero: '001',
    ano: 2023,
    titulo: 'Resolução que Estabelece Normas para Licitações',
    tipo: 'resolucao',
    dataPublicacao: '2023-04-10T00:00:00Z',
    dataVigencia: '2023-04-10T00:00:00Z',
    status: 'vigente',
    ementa: 'Estabelece normas complementares para o processo licitatório municipal',
    palavrasChave: ['licitação', 'normas', 'processo', 'contratação']
  },
  {
    id: 'portaria-1',
    numero: '001',
    ano: 2023,
    titulo: 'Portaria de Organização da Secretaria de Administração',
    tipo: 'portaria',
    dataPublicacao: '2023-07-05T00:00:00Z',
    dataVigencia: '2023-07-05T00:00:00Z',
    status: 'vigente',
    ementa: 'Organiza a estrutura e funcionamento da Secretaria de Administração',
    palavrasChave: ['secretaria', 'administração', 'organização', 'estrutura']
  },
  {
    id: 'lei-7',
    numero: '007',
    ano: 2024,
    titulo: 'Lei de Proteção ao Meio Ambiente',
    tipo: 'lei',
    dataPublicacao: '2024-01-20T00:00:00Z',
    dataVigencia: '2024-01-20T00:00:00Z',
    status: 'vigente',
    ementa: 'Estabelece normas de proteção e preservação do meio ambiente municipal',
    palavrasChave: ['meio ambiente', 'proteção', 'preservação', 'sustentabilidade']
  }
];

export const leisService = {
  getAll: (): Lei[] => {
    return leisData.filter(lei => lei.status === 'vigente');
  },

  getById: (id: string): Lei | null => {
    return leisData.find(lei => lei.id === id) || null;
  },

  getByTipo: (tipo: string): Lei[] => {
    return leisData.filter(lei => lei.tipo === tipo && lei.status === 'vigente');
  },

  search: (termo: string): Lei[] => {
    const termoLower = termo.toLowerCase();
    return leisData.filter(lei => 
      lei.status === 'vigente' && (
        lei.titulo.toLowerCase().includes(termoLower) ||
        lei.ementa?.toLowerCase().includes(termoLower) ||
        lei.palavrasChave?.some(palavra => palavra.toLowerCase().includes(termoLower)) ||
        lei.numero.includes(termo) ||
        lei.ano.toString().includes(termo)
      )
    );
  },

  getByNumeroAno: (numero: string, ano: number): Lei | null => {
    return leisData.find(lei => lei.numero === numero && lei.ano === ano) || null;
  },

  getEstatisticas: () => {
    const leis = leisData.filter(lei => lei.status === 'vigente');
    return {
      total: leis.length,
      porTipo: {
        lei: leis.filter(l => l.tipo === 'lei').length,
        decreto: leis.filter(l => l.tipo === 'decreto').length,
        resolucao: leis.filter(l => l.tipo === 'resolucao').length,
        portaria: leis.filter(l => l.tipo === 'portaria').length,
        regimento: leis.filter(l => l.tipo === 'regimento').length,
        lei_organica: leis.filter(l => l.tipo === 'lei_organica').length
      }
    };
  }
};
