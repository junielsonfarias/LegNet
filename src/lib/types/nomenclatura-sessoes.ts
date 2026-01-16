export interface ConfiguracaoNomenclatura {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  templateTitulo: string;
  configuracoes: {
    numeracaoSequencial: {
      habilitada: boolean;
      resetarPorAno: boolean;
      resetarPorLegislatura: boolean;
    };
    periodosLegislatura: {
      quantidade: number;
      nomenclatura: string; // ex: "Período", "Sessão", "Reunião"
    };
    tiposSessao: TipoSessaoNomenclatura[];
    elementosTemplate: ElementoTemplate[];
  };
  criadaEm: string;
  atualizadaEm: string;
}

export interface TipoSessaoNomenclatura {
  id: string;
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL' | 'SOLENE';
  nome: string; // ex: "Sessão Ordinária", "Sessão Extraordinária"
  abreviatura: string; // ex: "S.O.", "S.E."
  prefixoNumeracao: string; // ex: "Ord.", "Ext."
  ordem: number;
}

export interface ElementoTemplate {
  id: string;
  nome: string;
  placeholder: string; // ex: "{numero_sessao}", "{periodo}", "{legislatura}"
  descricao: string;
  tipo: 'numero' | 'texto' | 'data' | 'periodo' | 'legislatura';
  formato?: string; // ex: "ordinal" para números ordinais
}

export interface SequenciaNumeracao {
  id: string;
  tipoSessao: string;
  legislatura: string;
  ano: number;
  ultimoNumero: number;
  proximoNumero: number;
}

// Template padrão
export const TEMPLATE_PADRAO = "{{numero_sessao}}ª {{tipo_sessao}} do {{periodo}} da Legislatura da {{legislatura}}ª Legislatura";

// Elementos padrão do template
export const ELEMENTOS_PADRAO: ElementoTemplate[] = [
  {
    id: 'numero_sessao',
    nome: 'Número da Sessão',
    placeholder: '{{numero_sessao}}',
    descricao: 'Número sequencial da sessão',
    tipo: 'numero',
    formato: 'ordinal'
  },
  {
    id: 'tipo_sessao',
    nome: 'Tipo de Sessão',
    placeholder: '{{tipo_sessao}}',
    descricao: 'Tipo da sessão (Ordinária, Extraordinária, etc.)',
    tipo: 'texto'
  },
  {
    id: 'periodo',
    nome: 'Período',
    placeholder: '{{periodo}}',
    descricao: 'Período da legislatura',
    tipo: 'periodo'
  },
  {
    id: 'legislatura',
    nome: 'Legislatura',
    placeholder: '{{legislatura}}',
    descricao: 'Número da legislatura',
    tipo: 'legislatura'
  }
];

// Tipos de sessão padrão
export const TIPOS_SESSAO_PADRAO: TipoSessaoNomenclatura[] = [
  {
    id: 'ordinaria',
    tipo: 'ORDINARIA',
    nome: 'Sessão Ordinária',
    abreviatura: 'S.O.',
    prefixoNumeracao: 'Ord.',
    ordem: 1
  },
  {
    id: 'extraordinaria',
    tipo: 'EXTRAORDINARIA',
    nome: 'Sessão Extraordinária',
    abreviatura: 'S.E.',
    prefixoNumeracao: 'Ext.',
    ordem: 2
  },
  {
    id: 'especial',
    tipo: 'ESPECIAL',
    nome: 'Sessão Especial',
    abreviatura: 'S.Esp.',
    prefixoNumeracao: 'Esp.',
    ordem: 3
  },
  {
    id: 'solene',
    tipo: 'SOLENE',
    nome: 'Sessão Solene',
    abreviatura: 'S.S.',
    prefixoNumeracao: 'Sol.',
    ordem: 4
  }
];
