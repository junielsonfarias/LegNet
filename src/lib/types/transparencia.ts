export interface TransparenciaItem {
  id: string;
  categoria: string;
  subcategoria: string;
  titulo: string;
  descricao: string;
  tipo: 'documento' | 'relatorio' | 'informacao' | 'servico' | 'agenda' | 'lista';
  dataPublicacao: string;
  ano: number;
  url: string;
  status: 'publicado' | 'rascunho' | 'arquivado';
  anexos?: string[];
  tags?: string[];
  responsavel?: string;
  atualizacao?: string;
}

export interface TransparenciaCategoria {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  subcategorias: TransparenciaSubcategoria[];
}

export interface TransparenciaSubcategoria {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  obrigatoria: boolean;
  prazo?: number; // em dias
  frequencia?: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'eventual';
}

export interface TransparenciaEstatisticas {
  total: number;
  porCategoria: Record<string, number>;
  porTipo: Record<string, number>;
  porAno: Record<number, number>;
  atualizacoesRecentes: number;
  pendentes: number;
  vencidas: number;
}

export interface TransparenciaFiltros {
  categoria?: string;
  subcategoria?: string;
  tipo?: string;
  ano?: number;
  status?: string;
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
}
