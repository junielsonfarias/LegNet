import { SessaoLegislativa } from '../types'

export const sessoesData: SessaoLegislativa[] = [
  {
    id: 1,
    numero: 15,
    tipo: 'Ordinária',
    data: '2025-01-15',
    horario: '19:00',
    status: 'Realizada',
    presenca: 12,
    total: 13,
    proposicoes: 8,
    resumo: 'Sessão ordinária com aprovação de 5 projetos de lei, 2 indicações e 1 requerimento. Discussão sobre Plano Diretor Municipal.',
    ata: 'ata-15-2025.pdf'
  },
  {
    id: 2,
    numero: 14,
    tipo: 'Ordinária',
    data: '2025-01-08',
    horario: '19:00',
    status: 'Realizada',
    presenca: 11,
    total: 13,
    proposicoes: 6,
    resumo: 'Sessão ordinária com aprovação de 3 projetos de lei e 3 indicações. Debate sobre política municipal de cultura.',
    ata: 'ata-14-2025.pdf'
  },
  {
    id: 3,
    numero: 13,
    tipo: 'Extraordinária',
    data: '2025-01-03',
    horario: '14:00',
    status: 'Realizada',
    presenca: 10,
    total: 13,
    proposicoes: 4,
    resumo: 'Sessão extraordinária para discussão urgente sobre situação de emergência no abastecimento de água.',
    ata: 'ata-13-2025.pdf'
  },
  {
    id: 4,
    numero: 12,
    tipo: 'Ordinária',
    data: '2024-12-18',
    horario: '19:00',
    status: 'Realizada',
    presenca: 13,
    total: 13,
    proposicoes: 10,
    resumo: 'Última sessão ordinária do ano com aprovação de 7 projetos de lei e 3 indicações. Balanço das atividades de 2024.',
    ata: 'ata-12-2024.pdf'
  },
  {
    id: 5,
    numero: 11,
    tipo: 'Solene',
    data: '2024-12-10',
    horario: '19:00',
    status: 'Realizada',
    presenca: 13,
    total: 13,
    proposicoes: 0,
    resumo: 'Sessão solene de encerramento do ano legislativo com homenagens e entrega de comendas municipais.',
    ata: 'ata-11-2024.pdf'
  },
  {
    id: 6,
    numero: 10,
    tipo: 'Ordinária',
    data: '2024-12-04',
    horario: '19:00',
    status: 'Realizada',
    presenca: 12,
    total: 13,
    proposicoes: 5,
    resumo: 'Sessão ordinária com aprovação de 3 projetos de lei e 2 indicações. Discussão sobre orçamento 2025.',
    ata: 'ata-10-2024.pdf'
  },
  {
    id: 7,
    numero: 9,
    tipo: 'Ordinária',
    data: '2024-11-27',
    horario: '19:00',
    status: 'Realizada',
    presenca: 11,
    total: 13,
    proposicoes: 7,
    resumo: 'Sessão ordinária com aprovação de 4 projetos de lei, 2 indicações e 1 requerimento.',
    ata: 'ata-9-2024.pdf'
  },
  {
    id: 8,
    numero: 8,
    tipo: 'Especial',
    data: '2024-11-20',
    horario: '14:00',
    status: 'Realizada',
    presenca: 13,
    total: 13,
    proposicoes: 3,
    resumo: 'Sessão especial para discussão do Plano Plurianual (PPA) 2024-2027.',
    ata: 'ata-8-2024.pdf'
  },
  {
    id: 9,
    numero: 7,
    tipo: 'Ordinária',
    data: '2024-11-13',
    horario: '19:00',
    status: 'Realizada',
    presenca: 12,
    total: 13,
    proposicoes: 6,
    resumo: 'Sessão ordinária com aprovação de 4 projetos de lei e 2 indicações.',
    ata: 'ata-7-2024.pdf'
  },
  {
    id: 10,
    numero: 6,
    tipo: 'Ordinária',
    data: '2024-11-06',
    horario: '19:00',
    status: 'Realizada',
    presenca: 10,
    total: 13,
    proposicoes: 4,
    resumo: 'Sessão ordinária com aprovação de 2 projetos de lei e 2 indicações.',
    ata: 'ata-6-2024.pdf'
  }
]

// Service functions for Sessoes
export const sessoesService = {
  getAll: () => sessoesData,
  
  getById: (id: number) => sessoesData.find(sessao => sessao.id === id),
  
  getByNumero: (numero: number) => 
    sessoesData.find(sessao => sessao.numero === numero),
  
  getByTipo: (tipo: string) => 
    sessoesData.filter(sessao => sessao.tipo === tipo),
  
  getByStatus: (status: string) => 
    sessoesData.filter(sessao => sessao.status === status),
  
  getByAno: (ano: number) => 
    sessoesData.filter(sessao => new Date(sessao.data).getFullYear() === ano),
  
  getByMes: (mes: number, ano: number) => 
    sessoesData.filter(sessao => {
      const data = new Date(sessao.data)
      return data.getMonth() === mes - 1 && data.getFullYear() === ano
    }),
  
  getRealizadas: () => 
    sessoesData.filter(sessao => sessao.status === 'Realizada'),
  
  getAgendadas: () => 
    sessoesData.filter(sessao => sessao.status === 'Agendada'),
  
  getRecent: (limit: number = 5) => 
    sessoesData
      .filter(sessao => sessao.status === 'Realizada')
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, limit),
  
  search: (term: string) => 
    sessoesData.filter(sessao => 
      sessao.numero.toString().includes(term) ||
      sessao.tipo.toLowerCase().includes(term.toLowerCase()) ||
      sessao.resumo.toLowerCase().includes(term.toLowerCase())
    ),
  
  getEstatisticas: () => ({
    total: sessoesData.length,
    realizadas: sessoesData.filter(sessao => sessao.status === 'Realizada').length,
    agendadas: sessoesData.filter(sessao => sessao.status === 'Agendada').length,
    canceladas: sessoesData.filter(sessao => sessao.status === 'Cancelada').length,
    totalProposicoes: sessoesData.reduce((total, sessao) => total + sessao.proposicoes, 0),
    mediaPresenca: Math.round(
      sessoesData.reduce((total, sessao) => total + (sessao.presenca / sessao.total), 0) / sessoesData.length * 100
    )
  }),
  
  getTipos: () => Array.from(new Set(sessoesData.map(sessao => sessao.tipo))),
  
  getAnos: () => Array.from(new Set(sessoesData.map(sessao => new Date(sessao.data).getFullYear())))
}
