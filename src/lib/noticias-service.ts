// Serviço para gerenciar notícias
export interface Noticia {
  id: string
  titulo: string
  conteudo: string
  resumo: string
  autor: string
  dataPublicacao: string
  categoria: string
  tags: string[]
  status: 'RASCUNHO' | 'PUBLICADA' | 'ARQUIVADA'
  imagem?: string
}

// Mock data para notícias
const noticiasData: Noticia[] = [
  {
    id: '1',
    titulo: 'Câmara aprova projeto de lei sobre meio ambiente',
    conteudo: 'A Câmara Municipal de Mojuí dos Campos aprovou por unanimidade o projeto de lei que estabelece novas diretrizes para a preservação do meio ambiente...',
    resumo: 'Projeto de lei sobre meio ambiente é aprovado por unanimidade',
    autor: 'Secretaria de Comunicação',
    dataPublicacao: '2025-01-20',
    categoria: 'Legislativo',
    tags: ['meio ambiente', 'projeto de lei', 'aprovação'],
    status: 'PUBLICADA',
    imagem: 'noticia-meio-ambiente.jpg'
  },
  {
    id: '2',
    titulo: 'Nova sessão ordinária agendada para próxima semana',
    conteudo: 'A próxima sessão ordinária da Câmara Municipal está agendada para o dia 25 de janeiro de 2025, às 19h...',
    resumo: 'Sessão ordinária agendada para 25 de janeiro',
    autor: 'Secretaria de Comunicação',
    dataPublicacao: '2025-01-18',
    categoria: 'Agenda',
    tags: ['sessão', 'ordinária', 'agenda'],
    status: 'PUBLICADA'
  }
]

export const noticiasService = {
  getAll: (): Noticia[] => {
    return noticiasData
  },

  getById: (id: string): Noticia | undefined => {
    return noticiasData.find(noticia => noticia.id === id)
  },

  getPublicadas: (): Noticia[] => {
    return noticiasData.filter(noticia => noticia.status === 'PUBLICADA')
  },

  getByCategoria: (categoria: string): Noticia[] => {
    return noticiasData.filter(noticia => noticia.categoria === categoria)
  },

  create: (noticia: Omit<Noticia, 'id'>): Noticia => {
    const nova = {
      ...noticia,
      id: (noticiasData.length + 1).toString()
    }
    noticiasData.push(nova)
    return nova
  },

  update: (id: string, noticia: Partial<Noticia>): Noticia | null => {
    const index = noticiasData.findIndex(n => n.id === id)
    if (index === -1) return null
    
    noticiasData[index] = { ...noticiasData[index], ...noticia }
    return noticiasData[index]
  },

  delete: (id: string): boolean => {
    const index = noticiasData.findIndex(n => n.id === id)
    if (index === -1) return false
    
    noticiasData.splice(index, 1)
    return true
  }
}
