// Interfaces
export interface Legislatura {
  id: string
  numero: number
  anoInicio: number
  anoFim: number
  dataInicio?: string | null
  dataFim?: string | null
  descricao?: string | null
  ativa: boolean
  periodos?: Periodo[]
}

export interface Periodo {
  id?: string
  numero: number
  dataInicio: string
  dataFim?: string
  descricao?: string
  cargos: Cargo[]
}

export interface Cargo {
  id?: string
  nome: string
  ordem: number
  obrigatorio: boolean
}

export interface LegislaturaFormData {
  numero: string
  anoInicio: string
  anoFim: string
  dataInicio: string
  dataFim: string
  descricao: string
  ativa: boolean
}

// Helper functions
export function formatDateUTC(dateString: string | Date | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateUTCLong(dateString: string | Date | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
                  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = months[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  return `${day} de ${month} de ${year}`
}

export function formatDateToInput(dateString: string | Date | null | undefined): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export const INITIAL_FORM_DATA: LegislaturaFormData = {
  numero: '',
  anoInicio: '',
  anoFim: '',
  dataInicio: '',
  dataFim: '',
  descricao: '',
  ativa: true
}
