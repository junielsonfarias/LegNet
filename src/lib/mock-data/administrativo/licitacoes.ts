import { Licitacao } from '../types'

export const licitacoesData: Licitacao[] = [
  {
    id: 1,
    numero: '001/2025',
    objeto: 'Contratação de empresa especializada para execução de obras de pavimentação asfáltica',
    modalidade: 'PREGÃO',
    status: 'ABERTA',
    dataAbertura: '2025-01-20',
    dataEncerramento: '2025-02-05',
    valorEstimado: 850000.00,
    participantes: 0,
    arquivo: 'edital-001-2025.pdf'
  },
  {
    id: 2,
    numero: '002/2025',
    objeto: 'Aquisição de equipamentos para modernização da frota de veículos da administração municipal',
    modalidade: 'CONCORRÊNCIA',
    status: 'EM_ANDAMENTO',
    dataAbertura: '2025-01-15',
    dataEncerramento: '2025-01-30',
    valorEstimado: 450000.00,
    participantes: 3,
    arquivo: 'edital-002-2025.pdf'
  },
  {
    id: 3,
    numero: '003/2025',
    objeto: 'Contratação de serviços de limpeza urbana e coleta de lixo',
    modalidade: 'TOMADA_PREÇOS',
    status: 'FINALIZADA',
    dataAbertura: '2025-01-10',
    dataEncerramento: '2025-01-25',
    valorEstimado: 1200000.00,
    participantes: 5,
    vencedor: 'Limpeza Total Ltda.',
    arquivo: 'edital-003-2025.pdf'
  },
  {
    id: 4,
    numero: '004/2025',
    objeto: 'Aquisição de medicamentos para a rede municipal de saúde',
    modalidade: 'DISPENSA',
    status: 'FINALIZADA',
    dataAbertura: '2025-01-05',
    dataEncerramento: '2025-01-15',
    valorEstimado: 180000.00,
    participantes: 1,
    vencedor: 'Farmácia Municipal',
    arquivo: 'edital-004-2025.pdf'
  },
  {
    id: 5,
    numero: '005/2024',
    objeto: 'Contratação de empresa para execução de projeto de drenagem pluvial',
    modalidade: 'PREGÃO',
    status: 'FINALIZADA',
    dataAbertura: '2024-12-20',
    dataEncerramento: '2025-01-10',
    valorEstimado: 650000.00,
    participantes: 4,
    vencedor: 'Engenharia Hidráulica S.A.',
    arquivo: 'edital-005-2024.pdf'
  },
  {
    id: 6,
    numero: '006/2024',
    objeto: 'Aquisição de mobiliário escolar para rede municipal de ensino',
    modalidade: 'CONCORRÊNCIA',
    status: 'FINALIZADA',
    dataAbertura: '2024-12-15',
    dataEncerramento: '2024-12-30',
    valorEstimado: 320000.00,
    participantes: 6,
    vencedor: 'Móveis Educacionais Ltda.',
    arquivo: 'edital-006-2024.pdf'
  },
  {
    id: 7,
    numero: '007/2024',
    objeto: 'Contratação de serviços de segurança patrimonial',
    modalidade: 'TOMADA_PREÇOS',
    status: 'CANCELADA',
    dataAbertura: '2024-12-10',
    dataEncerramento: '2024-12-25',
    valorEstimado: 280000.00,
    participantes: 2,
    arquivo: 'edital-007-2024.pdf'
  },
  {
    id: 8,
    numero: '008/2024',
    objeto: 'Aquisição de equipamentos de informática para modernização administrativa',
    modalidade: 'INEXIGIBILIDADE',
    status: 'FINALIZADA',
    dataAbertura: '2024-12-05',
    dataEncerramento: '2024-12-15',
    valorEstimado: 150000.00,
    participantes: 1,
    vencedor: 'Tecnologia Municipal',
    arquivo: 'edital-008-2024.pdf'
  },
  {
    id: 9,
    numero: '009/2024',
    objeto: 'Contratação de empresa para execução de obras de saneamento básico',
    modalidade: 'PREGÃO',
    status: 'FINALIZADA',
    dataAbertura: '2024-11-25',
    dataEncerramento: '2024-12-10',
    valorEstimado: 2100000.00,
    participantes: 7,
    vencedor: 'Saneamento do Norte Ltda.',
    arquivo: 'edital-009-2024.pdf'
  },
  {
    id: 10,
    numero: '010/2024',
    objeto: 'Aquisição de combustível para frota municipal',
    modalidade: 'DISPENSA',
    status: 'FINALIZADA',
    dataAbertura: '2024-11-20',
    dataEncerramento: '2024-11-30',
    valorEstimado: 95000.00,
    participantes: 1,
    vencedor: 'Posto Municipal',
    arquivo: 'edital-010-2024.pdf'
  }
]

// Service functions for Licitacoes
export const licitacoesService = {
  getAll: () => licitacoesData,
  
  getById: (id: number) => licitacoesData.find(licitacao => licitacao.id === id),
  
  getByNumero: (numero: string) => 
    licitacoesData.find(licitacao => licitacao.numero === numero),
  
  getByModalidade: (modalidade: string) => 
    licitacoesData.filter(licitacao => licitacao.modalidade === modalidade),
  
  getByStatus: (status: string) => 
    licitacoesData.filter(licitacao => licitacao.status === status),
  
  getByAno: (ano: number) => 
    licitacoesData.filter(licitacao => {
      const anoLicitacao = parseInt(licitacao.numero.split('/')[1])
      return anoLicitacao === ano
    }),
  
  getAbertas: () => 
    licitacoesData.filter(licitacao => licitacao.status === 'ABERTA'),
  
  getEmAndamento: () => 
    licitacoesData.filter(licitacao => licitacao.status === 'EM_ANDAMENTO'),
  
  getFinalizadas: () => 
    licitacoesData.filter(licitacao => licitacao.status === 'FINALIZADA'),
  
  getCanceladas: () => 
    licitacoesData.filter(licitacao => licitacao.status === 'CANCELADA'),
  
  getByValorRange: (min: number, max: number) => 
    licitacoesData.filter(licitacao => 
      licitacao.valorEstimado >= min && licitacao.valorEstimado <= max
    ),
  
  search: (term: string) => 
    licitacoesData.filter(licitacao => 
      licitacao.numero.includes(term) ||
      licitacao.objeto.toLowerCase().includes(term.toLowerCase()) ||
      licitacao.modalidade.toLowerCase().includes(term.toLowerCase()) ||
      (licitacao.vencedor && licitacao.vencedor.toLowerCase().includes(term.toLowerCase()))
    ),
  
  getEstatisticas: () => ({
    total: licitacoesData.length,
    abertas: licitacoesData.filter(licitacao => licitacao.status === 'ABERTA').length,
    emAndamento: licitacoesData.filter(licitacao => licitacao.status === 'EM_ANDAMENTO').length,
    finalizadas: licitacoesData.filter(licitacao => licitacao.status === 'FINALIZADA').length,
    canceladas: licitacoesData.filter(licitacao => licitacao.status === 'CANCELADA').length,
    valorTotal: licitacoesData.reduce((total, licitacao) => total + licitacao.valorEstimado, 0),
    mediaParticipantes: Math.round(
      licitacoesData.reduce((total, licitacao) => total + licitacao.participantes, 0) / licitacoesData.length
    )
  }),
  
  getModalidades: () => Array.from(new Set(licitacoesData.map(licitacao => licitacao.modalidade))),
  
  getAnos: () => Array.from(new Set(licitacoesData.map(licitacao => 
    parseInt(licitacao.numero.split('/')[1])
  ))),
  
  getVencedores: () => 
    licitacoesData
      .filter(licitacao => licitacao.vencedor)
      .map(licitacao => licitacao.vencedor!)
}
