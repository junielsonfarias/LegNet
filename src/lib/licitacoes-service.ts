// Serviço para gerenciar licitações
export interface Licitacao {
  id: string
  numero: string
  modalidade: string
  objeto: string
  valorEstimado: number
  dataAbertura: string
  dataEncerramento: string
  status: 'ABERTA' | 'ENCERRADA' | 'CANCELADA' | 'SUSPENSA'
  orgao: string
  edital?: string
}

// Mock data para licitações
const licitacoesData: Licitacao[] = [
  {
    id: '1',
    numero: '001/2025',
    modalidade: 'Pregão Eletrônico',
    objeto: 'Contratação de serviços de limpeza',
    valorEstimado: 50000,
    dataAbertura: '2025-01-01',
    dataEncerramento: '2025-01-31',
    status: 'ABERTA',
    orgao: 'Câmara Municipal',
    edital: 'edital-001-2025.pdf'
  },
  {
    id: '2',
    numero: '002/2025',
    modalidade: 'Concorrência',
    objeto: 'Aquisição de equipamentos de informática',
    valorEstimado: 150000,
    dataAbertura: '2025-01-15',
    dataEncerramento: '2025-02-15',
    status: 'ABERTA',
    orgao: 'Câmara Municipal',
    edital: 'edital-002-2025.pdf'
  }
]

export const licitacoesService = {
  getAll: (): Licitacao[] => {
    return licitacoesData
  },

  getById: (id: string): Licitacao | undefined => {
    return licitacoesData.find(licitacao => licitacao.id === id)
  },

  create: (licitacao: Omit<Licitacao, 'id'>): Licitacao => {
    const nova = {
      ...licitacao,
      id: (licitacoesData.length + 1).toString()
    }
    licitacoesData.push(nova)
    return nova
  },

  update: (id: string, licitacao: Partial<Licitacao>): Licitacao | null => {
    const index = licitacoesData.findIndex(l => l.id === id)
    if (index === -1) return null
    
    licitacoesData[index] = { ...licitacoesData[index], ...licitacao }
    return licitacoesData[index]
  },

  delete: (id: string): boolean => {
    const index = licitacoesData.findIndex(l => l.id === id)
    if (index === -1) return false
    
    licitacoesData.splice(index, 1)
    return true
  }
}
