import { Lei } from '../types'

export const leisData: Lei[] = [
  {
    id: 1,
    numero: '156',
    ano: 2025,
    titulo: 'Dispõe sobre o Plano Diretor Municipal de Mojuí dos Campos',
    ementa: 'Institui o Plano Diretor Municipal, estabelecendo diretrizes para o desenvolvimento urbano e territorial do município, em conformidade com o Estatuto da Cidade.',
    data: '2025-07-15',
    status: 'VIGENTE',
    autor: 'Pantoja do Cartório',
    sessao: '15ª Sessão Ordinária',
    arquivo: 'lei-156-2025.pdf'
  },
  {
    id: 2,
    numero: '155',
    ano: 2025,
    titulo: 'Institui o Fundo Municipal de Cultura',
    ementa: 'Cria o Fundo Municipal de Cultura, destinado ao financiamento de projetos culturais e artísticos no município.',
    data: '2025-07-05',
    status: 'VIGENTE',
    autor: 'Wallace Lalá',
    sessao: '14ª Sessão Ordinária',
    arquivo: 'lei-155-2025.pdf'
  },
  {
    id: 3,
    numero: '154',
    ano: 2025,
    titulo: 'Dispõe sobre a Política Municipal de Meio Ambiente',
    ementa: 'Estabelece diretrizes para a política municipal de meio ambiente e desenvolvimento sustentável.',
    data: '2025-06-28',
    status: 'VIGENTE',
    autor: 'Enfermeiro Frank',
    sessao: '13ª Sessão Ordinária',
    arquivo: 'lei-154-2025.pdf'
  },
  {
    id: 4,
    numero: '153',
    ano: 2025,
    titulo: 'Institui o Programa Municipal de Apoio à Agricultura Familiar',
    ementa: 'Cria programa municipal de apoio técnico e financeiro aos agricultores familiares do município.',
    data: '2025-06-20',
    status: 'VIGENTE',
    autor: 'Joilson da Santa Júlia',
    sessao: '12ª Sessão Ordinária',
    arquivo: 'lei-153-2025.pdf'
  },
  {
    id: 5,
    numero: '152',
    ano: 2025,
    titulo: 'Dispõe sobre a Política Municipal de Educação',
    ementa: 'Estabelece diretrizes para a política municipal de educação, em consonância com a legislação federal.',
    data: '2025-06-10',
    status: 'VIGENTE',
    autor: 'Everaldo Camilo',
    sessao: '11ª Sessão Ordinária',
    arquivo: 'lei-152-2025.pdf'
  },
  {
    id: 6,
    numero: '151',
    ano: 2025,
    titulo: 'Institui o Sistema Municipal de Transporte Público',
    ementa: 'Cria o sistema municipal de transporte público coletivo, estabelecendo normas e diretrizes para sua operação.',
    data: '2025-05-30',
    status: 'VIGENTE',
    autor: 'Diego do Zé Neto',
    sessao: '10ª Sessão Ordinária',
    arquivo: 'lei-151-2025.pdf'
  },
  {
    id: 7,
    numero: '150',
    ano: 2025,
    titulo: 'Dispõe sobre a Política Municipal de Saúde',
    ementa: 'Estabelece diretrizes para a política municipal de saúde, em conformidade com o SUS.',
    data: '2025-05-20',
    status: 'VIGENTE',
    autor: 'Enfermeiro Frank',
    sessao: '9ª Sessão Ordinária',
    arquivo: 'lei-150-2025.pdf'
  },
  {
    id: 8,
    numero: '149',
    ano: 2025,
    titulo: 'Institui o Programa Municipal de Habitação de Interesse Social',
    ementa: 'Cria programa municipal de habitação de interesse social para famílias de baixa renda.',
    data: '2025-05-10',
    status: 'VIGENTE',
    autor: 'Arnaldo Galvão',
    sessao: '8ª Sessão Ordinária',
    arquivo: 'lei-149-2025.pdf'
  },
  {
    id: 9,
    numero: '148',
    ano: 2024,
    titulo: 'Dispõe sobre a Política Municipal de Esporte e Lazer',
    ementa: 'Estabelece diretrizes para a política municipal de esporte e lazer, promovendo a prática esportiva.',
    data: '2024-12-15',
    status: 'VIGENTE',
    autor: 'Wallace Lalá',
    sessao: '48ª Sessão Ordinária',
    arquivo: 'lei-148-2024.pdf'
  },
  {
    id: 10,
    numero: '147',
    ano: 2024,
    titulo: 'Institui o Conselho Municipal de Turismo',
    ementa: 'Cria o Conselho Municipal de Turismo para promover o desenvolvimento turístico do município.',
    data: '2024-12-01',
    status: 'VIGENTE',
    autor: 'Pantoja do Cartório',
    sessao: '47ª Sessão Ordinária',
    arquivo: 'lei-147-2024.pdf'
  }
]

// Service functions for Leis
export const leisService = {
  getAll: () => leisData,
  
  getById: (id: number) => leisData.find(lei => lei.id === id),
  
  getByNumero: (numero: string, ano: number) => 
    leisData.find(lei => lei.numero === numero && lei.ano === ano),
  
  getByStatus: (status: string) => 
    leisData.filter(lei => lei.status === status),
  
  getByAno: (ano: number) => 
    leisData.filter(lei => lei.ano === ano),
  
  getByAutor: (autor: string) => 
    leisData.filter(lei => lei.autor.toLowerCase().includes(autor.toLowerCase())),
  
  search: (term: string) => 
    leisData.filter(lei => 
      lei.numero.includes(term) ||
      lei.titulo.toLowerCase().includes(term.toLowerCase()) ||
      lei.ementa.toLowerCase().includes(term.toLowerCase()) ||
      lei.autor.toLowerCase().includes(term.toLowerCase())
    ),
  
  getEstatisticas: () => ({
    total: leisData.length,
    vigentes: leisData.filter(lei => lei.status === 'VIGENTE').length,
    revogadas: leisData.filter(lei => lei.status === 'REVOGADA').length,
    esteAno: leisData.filter(lei => lei.ano === new Date().getFullYear()).length
  })
}
