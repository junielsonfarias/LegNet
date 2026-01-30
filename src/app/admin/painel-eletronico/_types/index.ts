/**
 * Tipos do Painel Eletrônico
 * Centraliza todas as definições de tipos usadas no painel
 */

import {
  PainelSessao as BasePainelSessao,
  PautaItem,
  Presenca
} from '@/lib/types/painel-eletronico'

// Re-exporta tipos base
export type { PautaItem, Presenca }

// Estende PainelSessao com estatísticas para uso no painel admin
export interface PainelSessao extends BasePainelSessao {
  estatisticas: {
    totalParlamentares: number
    presentes: number
    ausentes: number
    percentualPresenca: number
  }
  descricao?: string
  votacoes?: any[]
}

// Estado do painel
export interface PainelState {
  // Dados principais
  sessaoAtiva: PainelSessao | null
  pauta: PautaItem[]
  presenca: Presenca[]

  // UI
  loading: boolean
  activeTab: string
  autoRefresh: boolean

  // Seleção de sessão
  sessoesDisponiveis: SessaoDisponivel[]
  sessaoSelecionada: string

  // Controles de transmissão
  painelPublicoAberto: boolean
  transmissaoAtiva: boolean
  audioAtivo: boolean
  videoAtivo: boolean

  // Votação
  votacaoAtiva: boolean
  votacaoItemAtivo: string | null
  tempoRestante: number

  // Cronômetro
  cronometroAtivo: boolean
  tempoSessao: number
  tempoInicioSessao: Date | null

  // Discurso
  discursoAtivo: boolean
  tempoDiscurso: number
  tempoDiscursoConfigurado: number
  discursoParlamentar: string | null
}

// Sessão disponível para seleção
export interface SessaoDisponivel {
  id: string
  numero: number
  tipo: string
  data: string
  status: string
  horario?: string
  local?: string
}

// Ações do painel
export interface PainelActions {
  // Dados
  carregarSessoesDisponiveis: () => Promise<SessaoDisponivel[]>
  carregarDados: () => Promise<void>

  // Sessão
  iniciarSessao: (sessaoId: string, numeroSessao: string, dataSessao: Date) => Promise<void>
  finalizarSessao: () => Promise<void>

  // Pauta
  iniciarItem: (itemId: string) => Promise<void>
  finalizarItem: (itemId: string, aprovado: boolean) => Promise<void>
  concluirItemInformativo: (itemId: string) => Promise<void>

  // Votação
  iniciarVotacao: (itemId: string) => Promise<void>
  finalizarVotacao: (itemId: string) => Promise<void>

  // Presença
  registrarPresenca: (parlamentarId: string, tipo: 'presente' | 'ausente' | 'justificada', justificativa?: string) => Promise<void>

  // Transmissão
  abrirPainelPublico: () => void
  iniciarTransmissao: () => void
  pararTransmissao: () => void
  toggleAudio: () => void
  toggleVideo: () => void

  // Discurso
  iniciarDiscurso: (parlamentarId: string, parlamentarNome: string) => void
  finalizarDiscurso: () => void
  configurarTempoDiscurso: (tempo: number) => void

  // Relatório
  gerarRelatorio: () => Promise<void>

  // Setters
  setActiveTab: (tab: string) => void
  setAutoRefresh: (value: boolean) => void
  setSessaoSelecionada: (id: string) => void
}

// Props para componentes
export interface PainelHeaderProps {
  sessao: PainelSessao | null
  tempoSessao: number
  cronometroAtivo: boolean
  transmissaoAtiva: boolean
  onAbrirPainelPublico: () => void
  onIniciarTransmissao: () => void
  onPararTransmissao: () => void
}

export interface PainelOverviewProps {
  sessao: PainelSessao | null
  presenca: Presenca[]
  pauta: PautaItem[]
}

export interface PainelPautaProps {
  sessao: PainelSessao | null
  pauta: PautaItem[]
  votacaoAtiva: boolean
  votacaoItemAtivo: string | null
  onIniciarItem: (itemId: string) => Promise<void>
  onFinalizarItem: (itemId: string, aprovado: boolean) => Promise<void>
  onIniciarVotacao: (itemId: string) => Promise<void>
  onFinalizarVotacao: (itemId: string) => Promise<void>
  onConcluirItemInformativo: (itemId: string) => Promise<void>
}

export interface PainelPresencaProps {
  sessao: PainelSessao | null
  presenca: Presenca[]
  discursoAtivo: boolean
  discursoParlamentar: string | null
  tempoDiscurso: number
  tempoDiscursoConfigurado: number
  onRegistrarPresenca: (parlamentarId: string, tipo: 'presente' | 'ausente' | 'justificada', justificativa?: string) => Promise<void>
  onIniciarDiscurso: (parlamentarId: string, parlamentarNome: string) => void
  onFinalizarDiscurso: () => void
  onConfigurarTempoDiscurso: (tempo: number) => void
}

export interface PainelControlesProps {
  sessao: PainelSessao | null
  sessoesDisponiveis: SessaoDisponivel[]
  sessaoSelecionada: string
  autoRefresh: boolean
  audioAtivo: boolean
  videoAtivo: boolean
  loading: boolean
  onSessaoChange: (id: string) => void
  onAutoRefreshChange: (value: boolean) => void
  onIniciarSessao: (sessaoId: string, numeroSessao: string, dataSessao: Date) => Promise<void>
  onFinalizarSessao: () => Promise<void>
  onGerarRelatorio: () => Promise<void>
  onToggleAudio: () => void
  onToggleVideo: () => void
  onCarregarDados: () => Promise<void>
}

// Helpers
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'em_andamento': return 'bg-green-100 text-green-800'
    case 'agendada': return 'bg-blue-100 text-blue-800'
    case 'concluida': return 'bg-gray-100 text-gray-800'
    case 'cancelada': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getItemStatusColor = (status: string): string => {
  switch (status) {
    case 'APROVADO': return 'bg-green-100 text-green-800'
    case 'REJEITADO': return 'bg-red-100 text-red-800'
    case 'EM_VOTACAO': return 'bg-yellow-100 text-yellow-800'
    case 'EM_DISCUSSAO': return 'bg-blue-100 text-blue-800'
    case 'PENDENTE': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const isItemInformativo = (tipoAcao?: string): boolean => {
  return tipoAcao === 'LEITURA' || tipoAcao === 'COMUNICADO' || tipoAcao === 'HOMENAGEM'
}

export const formatarTempo = (segundos: number): string => {
  const mins = Math.floor(segundos / 60)
  const secs = segundos % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
