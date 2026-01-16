// Serviço de dados centralizado que simula um banco de dados real
// Em produção, isso seria substituído por chamadas ao Prisma/PostgreSQL

import { parlamentaresData, parlamentaresService, type Parlamentar } from './parlamentares-data'

// Tipos para o sistema integrado
export interface Sessao {
  id: string
  numero: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  data: string
  horario: string
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  descricao?: string
  ata?: string
  local?: string
  presencas: PresencaSessao[]
  proposicoes: Proposicao[]
  createdAt: string
  updatedAt: string
}

export interface PresencaSessao {
  id: string
  sessaoId: string
  parlamentarId: string
  presente: boolean
  justificativa?: string
  createdAt: string
}

export interface Proposicao {
  id: string
  numero: string
  ano: number
  tipo: 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'INDICACAO' | 'REQUERIMENTO' | 'MOCAO' | 'VOTO_PESAR' | 'VOTO_APLAUSO'
  titulo: string
  ementa: string
  texto?: string
  status: 'APRESENTADA' | 'EM_TRAMITACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA'
  dataApresentacao: string
  dataVotacao?: string
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  sessaoId?: string
  autorId: string
  votacoes: Votacao[]
  createdAt: string
  updatedAt: string
}

export interface Votacao {
  id: string
  proposicaoId: string
  parlamentarId: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE'
  createdAt: string
}

export interface Comissao {
  id: string
  nome: string
  descricao?: string
  tipo: 'PERMANENTE' | 'TEMPORARIA' | 'ESPECIAL' | 'INQUERITO'
  ativa: boolean
  membros: MembroComissao[]
  createdAt: string
  updatedAt: string
}

export interface MembroComissao {
  id: string
  comissaoId: string
  parlamentarId: string
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'RELATOR' | 'MEMBRO'
  dataInicio: string
  dataFim?: string
  ativo: boolean
  createdAt: string
}

// Interface para legislatura
export interface Legislatura {
  id: string
  numero: string
  periodoInicio: string
  periodoFim: string
  ano: string
  ativa: boolean
  periodosMesa: number
  createdAt: string
  updatedAt: string
}

// Dados mock para legislaturas
let legislaturasData: Legislatura[] = [
  {
    id: '1',
    numero: '15',
    periodoInicio: '2025-01-01',
    periodoFim: '2028-12-31',
    ano: '2025',
    ativa: true,
    periodosMesa: 4,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    numero: '14',
    periodoInicio: '2021-01-01',
    periodoFim: '2024-12-31',
    ano: '2021',
    ativa: false,
    periodosMesa: 4,
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: '2024-12-31T23:59:59Z'
  }
]

// Dados mock iniciais
let sessoesData: Sessao[] = [
  {
    id: '1',
    numero: '1',
    tipo: 'ORDINARIA',
    data: '2025-01-15',
    horario: '19:00',
    status: 'CONCLUIDA',
    descricao: 'Primeira sessão ordinária da legislatura 2025/2028. Posse da Mesa Diretora e apresentação de proposições iniciais.',
    ata: 'Ata da primeira sessão ordinária...',
    local: 'Plenário da Câmara Municipal',
    presencas: [],
    proposicoes: [],
    createdAt: '2025-01-15T19:00:00Z',
    updatedAt: '2025-01-15T21:00:00Z'
  },
  {
    id: '2',
    numero: '2',
    tipo: 'ORDINARIA',
    data: '2025-01-22',
    horario: '19:00',
    status: 'CONCLUIDA',
    descricao: 'Sessão ordinária com discussão de projetos de lei sobre educação e saúde pública.',
    ata: 'Ata da segunda sessão ordinária...',
    local: 'Plenário da Câmara Municipal',
    presencas: [],
    proposicoes: [],
    createdAt: '2025-01-22T19:00:00Z',
    updatedAt: '2025-01-22T21:00:00Z'
  }
]

let proposicoesData: Proposicao[] = [
  {
    id: '1',
    numero: '001/2025',
    ano: 2025,
    tipo: 'PROJETO_LEI',
    titulo: 'Institui o Programa Municipal de Educação Ambiental',
    ementa: 'Institui o Programa Municipal de Educação Ambiental no âmbito do município de Mojuí dos Campos.',
    status: 'APRESENTADA',
    dataApresentacao: '2025-01-15',
    autorId: '1',
    votacoes: [],
    createdAt: '2025-01-15T19:30:00Z',
    updatedAt: '2025-01-15T19:30:00Z'
  },
  {
    id: '2',
    numero: '002/2025',
    ano: 2025,
    tipo: 'PROJETO_LEI',
    titulo: 'Cria o Fundo Municipal de Saúde',
    ementa: 'Cria o Fundo Municipal de Saúde para financiamento das ações de saúde pública.',
    status: 'EM_TRAMITACAO',
    dataApresentacao: '2025-01-22',
    autorId: '2',
    votacoes: [],
    createdAt: '2025-01-22T19:15:00Z',
    updatedAt: '2025-01-22T19:15:00Z'
  }
]

let comissoesData: Comissao[] = [
  {
    id: '1',
    nome: 'Comissão de Constituição e Justiça',
    descricao: 'Comissão responsável pela análise de constitucionalidade e legalidade das proposições.',
    tipo: 'PERMANENTE',
    ativa: true,
    membros: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    nome: 'Comissão de Finanças e Orçamento',
    descricao: 'Comissão responsável pela análise de matérias financeiras e orçamentárias.',
    tipo: 'PERMANENTE',
    ativa: true,
    membros: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
]

// Serviço de dados centralizado
export class DatabaseService {
  // Parlamentares
  static getParlamentares(): Parlamentar[] {
    return parlamentaresData.filter(p => p.ativo)
  }

  static getParlamentarById(id: string): Parlamentar | undefined {
    return parlamentaresData.find(p => p.id === id && p.ativo)
  }

  static updateParlamentar(id: string, data: Partial<Parlamentar>): Parlamentar | null {
    const index = parlamentaresData.findIndex(p => p.id === id)
    if (index === -1) return null
    
    parlamentaresData[index] = { ...parlamentaresData[index], ...data }
    return parlamentaresData[index]
  }

  static createParlamentar(data: Omit<Parlamentar, 'id'>): Parlamentar {
    const newParlamentar: Parlamentar = {
      ...data,
      id: Date.now().toString()
    }
    parlamentaresData.push(newParlamentar)
    return newParlamentar
  }

  // Sessões
  static getSessoes(): Sessao[] {
    return sessoesData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }

  static getSessaoById(id: string): Sessao | undefined {
    return sessoesData.find(s => s.id === id)
  }

  static createSessao(data: Omit<Sessao, 'id' | 'createdAt' | 'updatedAt' | 'presencas' | 'proposicoes'>): Sessao {
    const newSessao: Sessao = {
      ...data,
      id: Date.now().toString(),
      presencas: [],
      proposicoes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    sessoesData.push(newSessao)
    return newSessao
  }

  static updateSessao(id: string, data: Partial<Sessao>): Sessao | null {
    const index = sessoesData.findIndex(s => s.id === id)
    if (index === -1) return null
    
    sessoesData[index] = { 
      ...sessoesData[index], 
      ...data, 
      updatedAt: new Date().toISOString() 
    }
    return sessoesData[index]
  }

  static deleteSessao(id: string): boolean {
    const index = sessoesData.findIndex(s => s.id === id)
    if (index === -1) return false
    
    sessoesData.splice(index, 1)
    return true
  }

  // Proposições
  static getProposicoes(): Proposicao[] {
    return proposicoesData.sort((a, b) => new Date(b.dataApresentacao).getTime() - new Date(a.dataApresentacao).getTime())
  }

  static getProposicaoById(id: string): Proposicao | undefined {
    return proposicoesData.find(p => p.id === id)
  }

  static getProposicoesByAutor(autorId: string): Proposicao[] {
    return proposicoesData.filter(p => p.autorId === autorId)
  }

  static createProposicao(data: Omit<Proposicao, 'id' | 'createdAt' | 'updatedAt' | 'votacoes'>): Proposicao {
    const newProposicao: Proposicao = {
      ...data,
      id: Date.now().toString(),
      votacoes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    proposicoesData.push(newProposicao)
    return newProposicao
  }

  static updateProposicao(id: string, data: Partial<Proposicao>): Proposicao | null {
    const index = proposicoesData.findIndex(p => p.id === id)
    if (index === -1) return null
    
    proposicoesData[index] = { 
      ...proposicoesData[index], 
      ...data, 
      updatedAt: new Date().toISOString() 
    }
    return proposicoesData[index]
  }

  static deleteProposicao(id: string): boolean {
    const index = proposicoesData.findIndex(p => p.id === id)
    if (index === -1) return false
    
    proposicoesData.splice(index, 1)
    return true
  }

  // Comissões
  static getComissoes(): Comissao[] {
    return comissoesData.filter(c => c.ativa)
  }

  static getComissaoById(id: string): Comissao | undefined {
    return comissoesData.find(c => c.id === id)
  }

  static createComissao(data: Omit<Comissao, 'id' | 'createdAt' | 'updatedAt' | 'membros'>): Comissao {
    const newComissao: Comissao = {
      ...data,
      id: Date.now().toString(),
      membros: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    comissoesData.push(newComissao)
    return newComissao
  }

  static updateComissao(id: string, data: Partial<Comissao>): Comissao | null {
    const index = comissoesData.findIndex(c => c.id === id)
    if (index === -1) return null
    
    comissoesData[index] = { 
      ...comissoesData[index], 
      ...data, 
      updatedAt: new Date().toISOString() 
    }
    return comissoesData[index]
  }

  static deleteComissao(id: string): boolean {
    const index = comissoesData.findIndex(c => c.id === id)
    if (index === -1) return false
    
    comissoesData.splice(index, 1)
    return true
  }

  // Presenças
  static registrarPresenca(sessaoId: string, parlamentarId: string, presente: boolean, justificativa?: string): PresencaSessao {
    const sessao = this.getSessaoById(sessaoId)
    if (!sessao) throw new Error('Sessão não encontrada')

    // Remove presença existente se houver
    sessao.presencas = sessao.presencas.filter(p => p.parlamentarId !== parlamentarId)

    const novaPresenca: PresencaSessao = {
      id: Date.now().toString(),
      sessaoId,
      parlamentarId,
      presente,
      justificativa,
      createdAt: new Date().toISOString()
    }

    sessao.presencas.push(novaPresenca)
    return novaPresenca
  }

  // Votações
  static registrarVoto(proposicaoId: string, parlamentarId: string, voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE'): Votacao {
    const proposicao = this.getProposicaoById(proposicaoId)
    if (!proposicao) throw new Error('Proposição não encontrada')

    // Remove voto existente se houver
    proposicao.votacoes = proposicao.votacoes.filter(v => v.parlamentarId !== parlamentarId)

    const novoVoto: Votacao = {
      id: Date.now().toString(),
      proposicaoId,
      parlamentarId,
      voto,
      createdAt: new Date().toISOString()
    }

    proposicao.votacoes.push(novoVoto)
    return novoVoto
  }

  // Membros de Comissão
  static adicionarMembroComissao(comissaoId: string, parlamentarId: string, cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'RELATOR' | 'MEMBRO'): MembroComissao {
    const comissao = this.getComissaoById(comissaoId)
    if (!comissao) throw new Error('Comissão não encontrada')

    // Remove membro existente se houver
    comissao.membros = comissao.membros.filter(m => m.parlamentarId !== parlamentarId)

    const novoMembro: MembroComissao = {
      id: Date.now().toString(),
      comissaoId,
      parlamentarId,
      cargo,
      dataInicio: new Date().toISOString(),
      ativo: true,
      createdAt: new Date().toISOString()
    }

    comissao.membros.push(novoMembro)
    return novoMembro
  }

  // Legislaturas
  static getLegislaturas(): Legislatura[] {
    return [...legislaturasData]
  }

  static getLegislaturaById(id: string): Legislatura | undefined {
    return legislaturasData.find(l => l.id === id)
  }

  static getLegislaturaAtiva(): Legislatura | undefined {
    return legislaturasData.find(l => l.ativa)
  }

  static createLegislatura(data: Omit<Legislatura, 'id' | 'createdAt' | 'updatedAt'>): Legislatura {
    const novaLegislatura: Legislatura = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    legislaturasData.push(novaLegislatura)
    return novaLegislatura
  }

  static updateLegislatura(id: string, data: Partial<Legislatura>): Legislatura | undefined {
    const index = legislaturasData.findIndex(l => l.id === id)
    if (index === -1) return undefined

    legislaturasData[index] = {
      ...legislaturasData[index],
      ...data,
      updatedAt: new Date().toISOString()
    }

    return legislaturasData[index]
  }

  static deleteLegislatura(id: string): boolean {
    const index = legislaturasData.findIndex(l => l.id === id)
    if (index === -1) return false

    legislaturasData.splice(index, 1)
    return true
  }

  // Estatísticas
  static getEstatisticasParlamentar(parlamentarId: string) {
    const proposicoes = this.getProposicoesByAutor(parlamentarId)
    const sessoes = this.getSessoes()
    
    // Calcular presenças
    let presencas = 0
    let totalSessoes = 0
    
    sessoes.forEach(sessao => {
      if (sessao.status === 'CONCLUIDA') {
        totalSessoes++
        const presenca = sessao.presencas.find(p => p.parlamentarId === parlamentarId)
        if (presenca?.presente) presencas++
      }
    })

    const percentualPresenca = totalSessoes > 0 ? (presencas / totalSessoes) * 100 : 0
    const totalProposicoes = this.getProposicoes().length

    return {
      legislaturaAtual: {
        materias: proposicoes.length,
        percentualMaterias: totalProposicoes > 0 ? (proposicoes.length / totalProposicoes) * 100 : 0,
        sessoes: presencas,
        percentualPresenca,
        dataAtualizacao: new Date().toISOString()
      },
      exercicioAtual: {
        materias: proposicoes.filter(p => new Date(p.dataApresentacao).getFullYear() === new Date().getFullYear()).length,
        percentualMaterias: 0,
        sessoes: presencas,
        percentualPresenca
      }
    }
  }
}

// Exportar instância única
export const databaseService = DatabaseService
