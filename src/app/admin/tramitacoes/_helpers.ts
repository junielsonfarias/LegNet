export type TramitacaoStatus = 'RECEBIDA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
export type TramitacaoResultado = 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO'

export const STATUS_CONFIG: Record<
  TramitacaoStatus | 'PENDENTE',
  { label: string; className: string }
> = {
  PENDENTE: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' },
  RECEBIDA: { label: 'Recebida', className: 'bg-purple-100 text-purple-700' },
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-blue-100 text-blue-700' },
  CONCLUIDA: { label: 'Concluída', className: 'bg-green-100 text-green-700' },
  CANCELADA: { label: 'Cancelada', className: 'bg-red-100 text-red-700' }
}

export const RESULTADO_LABEL: Record<TramitacaoResultado, string> = {
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  APROVADO_COM_EMENDAS: 'Aprovado com emendas',
  ARQUIVADO: 'Arquivado'
}

export const SELECT_ALL = '__all__'
export const SELECT_NONE = '__none__'
export const SELECT_AUTO = '__auto__'

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

export const formatDate = (value?: string | null) => {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return '—'
  }
}

export const getStatusBadge = (status?: TramitacaoStatus | null) => {
  if (!status) return STATUS_CONFIG.PENDENTE
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDENTE
}
