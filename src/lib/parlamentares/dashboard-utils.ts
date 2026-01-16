export interface PresencaResumo {
  total: number
  presentes: number
  ausentes: number
  justificadas: number
  percentualPresenca: number
}

export interface VotacaoResumo {
  total: number
  sim: number
  nao: number
  abstencao: number
  ausente: number
}

export const calcularPresencaResumo = (
  presencas: Array<{ presente: boolean; justificativa?: string | null }>
): PresencaResumo => {
  const total = presencas.length
  const presentes = presencas.filter(p => p.presente).length
  const ausentes = total - presentes
  const justificadas = presencas.filter(p => !p.presente && !!p.justificativa).length
  const percentualPresenca = total === 0 ? 0 : Math.round((presentes / total) * 100)

  return {
    total,
    presentes,
    ausentes,
    justificadas,
    percentualPresenca
  }
}

export const calcularVotacaoResumo = (
  votacoes: Array<{ voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE' }>
): VotacaoResumo => {
  const total = votacoes.length
  const sim = votacoes.filter(v => v.voto === 'SIM').length
  const nao = votacoes.filter(v => v.voto === 'NAO').length
  const abstencao = votacoes.filter(v => v.voto === 'ABSTENCAO').length
  const ausente = votacoes.filter(v => v.voto === 'AUSENTE').length

  return {
    total,
    sim,
    nao,
    abstencao,
    ausente
  }
}

