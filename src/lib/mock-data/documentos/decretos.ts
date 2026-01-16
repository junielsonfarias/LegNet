import { Decreto } from '../types'

export const decretosData: Decreto[] = [
  {
    id: 1,
    numero: '245',
    ano: 2025,
    titulo: 'Regulamenta o Sistema Municipal de Trânsito',
    ementa: 'Dispõe sobre a organização e funcionamento do Sistema Municipal de Trânsito, estabelecendo normas para fiscalização e controle de tráfego.',
    data: '2025-01-15',
    status: 'VIGENTE',
    tipo: 'REGULAMENTAR',
    prefeito: 'João Silva',
    arquivo: 'decreto-245-2025.pdf'
  },
  {
    id: 2,
    numero: '244',
    ano: 2025,
    titulo: 'Declara ponto facultativo nas repartições públicas municipais',
    ementa: 'Declara ponto facultativo nas repartições públicas municipais no dia 24 de janeiro de 2025.',
    data: '2025-01-10',
    status: 'VIGENTE',
    tipo: 'ADMINISTRATIVO',
    prefeito: 'João Silva',
    arquivo: 'decreto-244-2025.pdf'
  },
  {
    id: 3,
    numero: '243',
    ano: 2024,
    titulo: 'Regulamenta a Lei Municipal nº 156/2024',
    ementa: 'Regulamenta a Lei Municipal nº 156/2024, que dispõe sobre o Plano Diretor Municipal.',
    data: '2024-12-20',
    status: 'VIGENTE',
    tipo: 'REGULAMENTAR',
    prefeito: 'João Silva',
    arquivo: 'decreto-243-2024.pdf'
  },
  {
    id: 4,
    numero: '242',
    ano: 2024,
    titulo: 'Nomeia Comissão de Licitação',
    ementa: 'Nomeia os membros da Comissão Permanente de Licitação para o exercício de 2025.',
    data: '2024-12-15',
    status: 'VIGENTE',
    tipo: 'NOMEACAO',
    prefeito: 'João Silva',
    arquivo: 'decreto-242-2024.pdf'
  },
  {
    id: 5,
    numero: '241',
    ano: 2024,
    titulo: 'Institui Grupo de Trabalho para Plano Municipal de Saneamento',
    ementa: 'Institui Grupo de Trabalho para elaboração do Plano Municipal de Saneamento Básico.',
    data: '2024-12-10',
    status: 'VIGENTE',
    tipo: 'ORGANIZACIONAL',
    prefeito: 'João Silva',
    arquivo: 'decreto-241-2024.pdf'
  },
  {
    id: 6,
    numero: '240',
    ano: 2024,
    titulo: 'Regulamenta o uso de espaços públicos para eventos',
    ementa: 'Estabelece normas para utilização de praças, parques e outros espaços públicos para realização de eventos.',
    data: '2024-12-05',
    status: 'VIGENTE',
    tipo: 'REGULAMENTAR',
    prefeito: 'João Silva',
    arquivo: 'decreto-240-2024.pdf'
  },
  {
    id: 7,
    numero: '239',
    ano: 2024,
    titulo: 'Decreta luto oficial de 3 dias',
    ementa: 'Decreta luto oficial de 3 dias pelo falecimento de cidadão ilustre do município.',
    data: '2024-11-28',
    status: 'CUMPRIDO',
    tipo: 'PROTOCOLAR',
    prefeito: 'João Silva',
    arquivo: 'decreto-239-2024.pdf'
  },
  {
    id: 8,
    numero: '238',
    ano: 2024,
    titulo: 'Abre crédito adicional suplementar',
    ementa: 'Abre crédito adicional suplementar no valor de R$ 500.000,00 para atender despesas com saúde.',
    data: '2024-11-20',
    status: 'VIGENTE',
    tipo: 'FINANCEIRO',
    prefeito: 'João Silva',
    arquivo: 'decreto-238-2024.pdf'
  },
  {
    id: 9,
    numero: '237',
    ano: 2024,
    titulo: 'Regulamenta o Sistema Municipal de Cultura',
    ementa: 'Regulamenta a Lei Municipal nº 155/2024, que institui o Fundo Municipal de Cultura.',
    data: '2024-11-15',
    status: 'VIGENTE',
    tipo: 'REGULAMENTAR',
    prefeito: 'João Silva',
    arquivo: 'decreto-237-2024.pdf'
  },
  {
    id: 10,
    numero: '236',
    ano: 2024,
    titulo: 'Institui Comissão de Avaliação de Projetos Culturais',
    ementa: 'Institui comissão para avaliação e seleção de projetos culturais a serem financiados pelo Fundo Municipal de Cultura.',
    data: '2024-11-10',
    status: 'VIGENTE',
    tipo: 'ORGANIZACIONAL',
    prefeito: 'João Silva',
    arquivo: 'decreto-236-2024.pdf'
  }
]

// Service functions for Decretos
export const decretosService = {
  getAll: () => decretosData,
  
  getById: (id: number) => decretosData.find(decreto => decreto.id === id),
  
  getByNumero: (numero: string, ano: number) => 
    decretosData.find(decreto => decreto.numero === numero && decreto.ano === ano),
  
  getByStatus: (status: string) => 
    decretosData.filter(decreto => decreto.status === status),
  
  getByAno: (ano: number) => 
    decretosData.filter(decreto => decreto.ano === ano),
  
  getByTipo: (tipo: string) => 
    decretosData.filter(decreto => decreto.tipo === tipo),
  
  getByPrefeito: (prefeito: string) => 
    decretosData.filter(decreto => decreto.prefeito.toLowerCase().includes(prefeito.toLowerCase())),
  
  search: (term: string) => 
    decretosData.filter(decreto => 
      decreto.numero.includes(term) ||
      decreto.titulo.toLowerCase().includes(term.toLowerCase()) ||
      decreto.ementa.toLowerCase().includes(term.toLowerCase()) ||
      decreto.prefeito.toLowerCase().includes(term.toLowerCase())
    ),
  
  getEstatisticas: () => ({
    total: decretosData.length,
    vigentes: decretosData.filter(decreto => decreto.status === 'VIGENTE').length,
    revogados: decretosData.filter(decreto => decreto.status === 'REVOGADO').length,
    cumpridos: decretosData.filter(decreto => decreto.status === 'CUMPRIDO').length,
    esteMes: decretosData.filter(decreto => {
      const data = new Date(decreto.data)
      const hoje = new Date()
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()
    }).length
  })
}
