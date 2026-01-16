import { Portaria } from '../types'

export const portariasData: Portaria[] = [
  {
    id: 1,
    numero: '089',
    ano: 2025,
    titulo: 'Nomeia Assessor Especial do Gabinete',
    ementa: 'Nomeia o Sr. Carlos Alberto da Silva para o cargo de Assessor Especial do Gabinete do Prefeito.',
    data: '2025-01-18',
    status: 'VIGENTE',
    tipo: 'NOMEACAO',
    secretaria: 'Gabinete do Prefeito',
    arquivo: 'portaria-089-2025.pdf'
  },
  {
    id: 2,
    numero: '088',
    ano: 2025,
    titulo: 'Designa Servidora para Função de Confiança',
    ementa: 'Designa a servidora Maria Santos para exercer a função de Coordenadora de Projetos Especiais.',
    data: '2025-01-15',
    status: 'VIGENTE',
    tipo: 'DESIGNACAO',
    secretaria: 'Secretaria de Planejamento',
    arquivo: 'portaria-088-2025.pdf'
  },
  {
    id: 3,
    numero: '087',
    ano: 2025,
    titulo: 'Institui Comissão de Sindicância',
    ementa: 'Institui comissão de sindicância para apurar irregularidades em processo administrativo.',
    data: '2025-01-12',
    status: 'VIGENTE',
    tipo: 'ORGANIZACIONAL',
    secretaria: 'Controladoria Geral',
    arquivo: 'portaria-087-2025.pdf'
  },
  {
    id: 4,
    numero: '086',
    ano: 2025,
    titulo: 'Concede Férias ao Servidor',
    ementa: 'Concede 30 dias de férias ao servidor João Oliveira, Matrícula 12345.',
    data: '2025-01-10',
    status: 'VIGENTE',
    tipo: 'PESSOAL',
    secretaria: 'Secretaria de Administração',
    arquivo: 'portaria-086-2025.pdf'
  },
  {
    id: 5,
    numero: '085',
    ano: 2025,
    titulo: 'Dispensa Servidora de Função Comissionada',
    ementa: 'Dispensa a servidora Ana Paula Costa do cargo de Diretora de Recursos Humanos.',
    data: '2025-01-08',
    status: 'VIGENTE',
    tipo: 'DISPENSA',
    secretaria: 'Secretaria de Administração',
    arquivo: 'portaria-085-2025.pdf'
  },
  {
    id: 6,
    numero: '084',
    ano: 2024,
    titulo: 'Cria Grupo de Trabalho para Revisão do Plano de Cargos',
    ementa: 'Cria grupo de trabalho para revisão do Plano de Cargos, Carreiras e Salários do município.',
    data: '2024-12-28',
    status: 'VIGENTE',
    tipo: 'ORGANIZACIONAL',
    secretaria: 'Secretaria de Administração',
    arquivo: 'portaria-084-2024.pdf'
  },
  {
    id: 7,
    numero: '083',
    ano: 2024,
    titulo: 'Autoriza Realização de Concurso Público',
    ementa: 'Autoriza a realização de concurso público para provimento de cargos efetivos na administração municipal.',
    data: '2024-12-20',
    status: 'VIGENTE',
    tipo: 'ADMINISTRATIVO',
    secretaria: 'Secretaria de Administração',
    arquivo: 'portaria-083-2024.pdf'
  },
  {
    id: 8,
    numero: '082',
    ano: 2024,
    titulo: 'Estabelece Horário de Funcionamento no Período de Recesso',
    ementa: 'Estabelece horário especial de funcionamento das repartições públicas durante o recesso de final de ano.',
    data: '2024-12-15',
    status: 'CUMPRIDA',
    tipo: 'ADMINISTRATIVO',
    secretaria: 'Gabinete do Prefeito',
    arquivo: 'portaria-082-2024.pdf'
  },
  {
    id: 9,
    numero: '081',
    ano: 2024,
    titulo: 'Nomeia Diretor de Departamento',
    ementa: 'Nomeia o servidor Roberto Mendes para o cargo de Diretor do Departamento de Obras Públicas.',
    data: '2024-12-10',
    status: 'VIGENTE',
    tipo: 'NOMEACAO',
    secretaria: 'Secretaria de Infraestrutura',
    arquivo: 'portaria-081-2024.pdf'
  },
  {
    id: 10,
    numero: '080',
    ano: 2024,
    titulo: 'Designa Coordenador de Projeto',
    ementa: 'Designa o servidor José da Silva para coordenar o projeto de revitalização do centro histórico.',
    data: '2024-12-05',
    status: 'VIGENTE',
    tipo: 'DESIGNACAO',
    secretaria: 'Secretaria de Planejamento',
    arquivo: 'portaria-080-2024.pdf'
  }
]

// Service functions for Portarias
export const portariasService = {
  getAll: () => portariasData,
  
  getById: (id: number) => portariasData.find(portaria => portaria.id === id),
  
  getByNumero: (numero: string, ano: number) => 
    portariasData.find(portaria => portaria.numero === numero && portaria.ano === ano),
  
  getByStatus: (status: string) => 
    portariasData.filter(portaria => portaria.status === status),
  
  getByAno: (ano: number) => 
    portariasData.filter(portaria => portaria.ano === ano),
  
  getByTipo: (tipo: string) => 
    portariasData.filter(portaria => portaria.tipo === tipo),
  
  getBySecretaria: (secretaria: string) => 
    portariasData.filter(portaria => 
      portaria.secretaria.toLowerCase().includes(secretaria.toLowerCase())
    ),
  
  search: (term: string) => 
    portariasData.filter(portaria => 
      portaria.numero.includes(term) ||
      portaria.titulo.toLowerCase().includes(term.toLowerCase()) ||
      portaria.ementa.toLowerCase().includes(term.toLowerCase()) ||
      portaria.secretaria.toLowerCase().includes(term.toLowerCase())
    ),
  
  getEstatisticas: () => ({
    total: portariasData.length,
    vigentes: portariasData.filter(portaria => portaria.status === 'VIGENTE').length,
    cumpridas: portariasData.filter(portaria => portaria.status === 'CUMPRIDA').length,
    revogadas: portariasData.filter(portaria => portaria.status === 'REVOGADA').length,
    esteMes: portariasData.filter(portaria => {
      const data = new Date(portaria.data)
      const hoje = new Date()
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()
    }).length
  })
}
