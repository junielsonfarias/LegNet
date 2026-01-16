// Tipos para o sistema de pautas das sessões baseado no SAPL

export interface PautaSessao {
  id: string
  sessaoId: string
  numero: string
  data: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL' | 'SOLENE'
  status: 'RASCUNHO' | 'PUBLICADA' | 'EM_ANDAMENTO' | 'CONCLUIDA'
  titulo: string
  descricao?: string
  
  // Informações da sessão
  presidente: string
  secretario: string
  horarioInicio?: string
  horarioFim?: string
  
  // Seções da pauta
  correspondencias: ItemCorrespondencia[]
  expedientes: ItemExpediente[]
  materiasExpediente: ItemMateriaExpediente[]
  ordemDoDia: ItemOrdemDoDia[]
  
  // Controle
  observacoes?: string
  criadaEm: string
  atualizadaEm: string
  publicadaEm?: string
  aprovadaEm?: string
}

// Item de correspondência recebida
export interface ItemCorrespondencia {
  id: string
  numero: number
  tipo: 'RECEBIDA' | 'ENVIADA'
  categoria: 'OUT' | 'OF' | 'MEM' | 'REQ' | 'IND' | 'OUTROS'
  numeroDocumento: string
  data: string
  interessado: string
  assunto: string
  descricao: string
  anexos?: string[]
  status: 'PENDENTE' | 'PROTOCOLADA' | 'ARQUIVADA'
}

// Item do expediente (abertura, leitura bíblica, etc.)
export interface ItemExpediente {
  id: string
  numero: number
  titulo: string
  tipo: 'ABERTURA' | 'LEITURA_BIBLICA' | 'ATA_ANTERIOR' | 'CORRESPONDENCIAS' | 'GRANDE_EXPEDIENTE' | 'LIDERANCAS' | 'PARTICIPACAO_CONVIDADOS' | 'OUTROS'
  descricao: string
  responsavel?: string
  duracaoEstimada?: number // em minutos
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  observacoes?: string
}

// Matéria do expediente (requerimentos, indicações)
export interface ItemMateriaExpediente {
  id: string
  numero: number
  tipo: 'REQUERIMENTO' | 'INDICACAO' | 'MOÇÃO' | 'VOTO_PESAR' | 'VOTO_APLAUSO' | 'OUTROS'
  numeroMateria: string
  autor: string
  coautores?: string[]
  ementa: string
  textoCompleto?: string
  status: 'PENDENTE' | 'EM_DISCUSSAO' | 'APROVADO' | 'REJEITADO' | 'ADIADO'
  turno: 'DELIBERAÇÃO' | 'LEITURA' | 'OUTROS'
  observacoes?: string
  anexos?: string[]
}

// Item da ordem do dia (projetos de lei, etc.)
export interface ItemOrdemDoDia {
  id: string
  numero: number
  tipo: 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'PROJETO_LEI_COMPLEMENTAR' | 'MOÇÃO' | 'OUTROS'
  numeroMateria: string
  processo: string
  autor: string
  coautores?: string[]
  ementa: string
  textoCompleto?: string
  status: 'PENDENTE' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADO' | 'REJEITADO' | 'ADIADO'
  turno: 'PRIMEIRO' | 'SEGUNDO' | 'UNICO' | 'LEITURA'
  quorumVotacao: 'MAIORIA_SIMPLES' | 'MAIORIA_ABSOLUTA' | 'UNANIMIDADE'
  observacoes?: string
  anexos?: string[]
  redacaoFinal?: string
}

// Tipos auxiliares
export interface ParlamentarInfo {
  id: string
  nome: string
  apelido: string
  partido: string
  cargo?: string
}

export interface PautaStats {
  total: number
  publicadas: number
  rascunhos: number
  emAndamento: number
  concluidas: number
  ordinarias: number
  extraordinarias: number
  especiais: number
  solenes: number
}

// Interface para criação/edição de pauta
export interface PautaSessaoFormData {
  sessaoId: string
  numero: string
  data: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL' | 'SOLENE'
  titulo: string
  descricao?: string
  presidente: string
  secretario: string
  horarioInicio?: string
  observacoes?: string
}
