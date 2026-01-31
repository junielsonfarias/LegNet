/**
 * Servico para calculo de prazos de comissoes
 * Regra RN-113: Materia vai ao plenario se prazo vencido (15 dias)
 */

export type DeadlineStatus = 'ok' | 'warning' | 'expired'

export interface DeadlineResult {
  dias: number
  status: DeadlineStatus
  mensagem: string
  dataLimite: Date
}

const PRAZO_PARECER_DIAS = 15 // RN-113: 15 dias para emitir parecer
const PRAZO_WARNING_DIAS = 5 // Alerta quando faltam 5 dias ou menos

/**
 * Calcula o prazo restante para emissao de parecer
 */
export function calcularPrazoRestante(dataDistribuicao: Date | string): DeadlineResult {
  const dataInicio = new Date(dataDistribuicao)
  const dataLimite = new Date(dataInicio)
  dataLimite.setDate(dataLimite.getDate() + PRAZO_PARECER_DIAS)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  dataLimite.setHours(23, 59, 59, 999)

  const diffTime = dataLimite.getTime() - hoje.getTime()
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let status: DeadlineStatus
  let mensagem: string

  if (dias < 0) {
    status = 'expired'
    mensagem = `Prazo vencido ha ${Math.abs(dias)} dia(s)`
  } else if (dias === 0) {
    status = 'expired'
    mensagem = 'Prazo vence hoje'
  } else if (dias <= PRAZO_WARNING_DIAS) {
    status = 'warning'
    mensagem = `${dias} dia(s) restante(s)`
  } else {
    status = 'ok'
    mensagem = `${dias} dias restantes`
  }

  return { dias, status, mensagem, dataLimite }
}

/**
 * Verifica se uma proposicao deve ir ao plenario por prazo vencido
 * RN-113: Se prazo de 15 dias vencer sem parecer, vai direto ao plenario
 */
export function deveIrAoPlenario(dataDistribuicao: Date | string, temParecer: boolean): boolean {
  if (temParecer) return false

  const { status } = calcularPrazoRestante(dataDistribuicao)
  return status === 'expired'
}

/**
 * Agrupa proposicoes por status de prazo
 */
export function agruparPorPrazo<T extends { dataDistribuicao: Date | string }>(
  proposicoes: T[]
): {
  expiradas: T[]
  alertas: T[]
  dentroDosPrazos: T[]
} {
  const expiradas: T[] = []
  const alertas: T[] = []
  const dentroDosPrazos: T[] = []

  for (const prop of proposicoes) {
    const { status } = calcularPrazoRestante(prop.dataDistribuicao)

    switch (status) {
      case 'expired':
        expiradas.push(prop)
        break
      case 'warning':
        alertas.push(prop)
        break
      case 'ok':
        dentroDosPrazos.push(prop)
        break
    }
  }

  return { expiradas, alertas, dentroDosPrazos }
}

/**
 * Formata data limite para exibicao
 */
export function formatarDataLimite(dataLimite: Date): string {
  return dataLimite.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
