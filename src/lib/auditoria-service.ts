// Serviço de auditoria para rastreamento de ações do sistema
export interface EventoAuditoria {
  id: string
  usuarioId: string
  usuarioNome: string
  acao: string
  entidade: string
  entidadeId: string
  dadosAnteriores?: Record<string, any>
  dadosNovos?: Record<string, any>
  ip?: string
  userAgent?: string
  timestamp: Date
  sucesso: boolean
  erro?: string
  detalhes?: Record<string, any>
}

export interface RelatorioAuditoria {
  id: string
  nome: string
  descricao: string
  filtros: FiltroAuditoria
  geradoEm: Date
  geradoPor: string
  arquivo?: string
  status: 'pendente' | 'processando' | 'concluido' | 'erro'
}

export interface FiltroAuditoria {
  dataInicio?: Date
  dataFim?: Date
  usuarioId?: string
  acao?: string
  entidade?: string
  entidadeId?: string
  sucesso?: boolean
  ip?: string
}

export interface EstatisticaAuditoria {
  totalEventos: number
  eventosPorAcao: Record<string, number>
  eventosPorUsuario: Record<string, number>
  eventosPorEntidade: Record<string, number>
  eventosPorDia: Record<string, number>
  eventosComErro: number
  usuariosAtivos: string[]
  periodo: {
    inicio: Date
    fim: Date
  }
}

// Eventos de auditoria padrão
const eventosAuditoriaPadrao: EventoAuditoria[] = [
  {
    id: '1',
    usuarioId: '1',
    usuarioNome: 'Administrador',
    acao: 'LOGIN',
    entidade: 'USUARIO',
    entidadeId: '1',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    sucesso: true,
    detalhes: { metodo: 'email' }
  },
  {
    id: '2',
    usuarioId: '1',
    usuarioNome: 'Administrador',
    acao: 'CRIAR',
    entidade: 'PROPOSICAO',
    entidadeId: '1',
    dadosNovos: {
      numero: '001/2025',
      tipo: 'PROJETO_LEI',
      titulo: 'Projeto de Lei de Teste'
    },
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
    sucesso: true
  },
  {
    id: '3',
    usuarioId: '2',
    usuarioNome: 'Secretário',
    acao: 'ATUALIZAR',
    entidade: 'PROPOSICAO',
    entidadeId: '1',
    dadosAnteriores: {
      status: 'RASCUNHO'
    },
    dadosNovos: {
      status: 'EM_TRAMITACAO'
    },
    ip: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
    sucesso: true
  },
  {
    id: '4',
    usuarioId: '1',
    usuarioNome: 'Administrador',
    acao: 'DELETAR',
    entidade: 'NOTICIA',
    entidadeId: '1',
    dadosAnteriores: {
      titulo: 'Notícia de Teste',
      conteudo: 'Conteúdo da notícia...'
    },
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
    sucesso: true
  },
  {
    id: '5',
    usuarioId: '3',
    usuarioNome: 'Vereador',
    acao: 'LOGIN',
    entidade: 'USUARIO',
    entidadeId: '3',
    ip: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutos atrás
    sucesso: false,
    erro: 'Credenciais inválidas'
  }
]

// Relatórios de auditoria padrão
const relatoriosAuditoriaPadrao: RelatorioAuditoria[] = [
  {
    id: '1',
    nome: 'Relatório de Atividade Diária',
    descricao: 'Relatório de todas as atividades do dia',
    filtros: {
      dataInicio: new Date(Date.now() - 24 * 60 * 60 * 1000),
      dataFim: new Date()
    },
    geradoEm: new Date(Date.now() - 1 * 60 * 60 * 1000),
    geradoPor: 'Administrador',
    status: 'concluido'
  },
  {
    id: '2',
    nome: 'Relatório de Logins',
    descricao: 'Relatório de tentativas de login',
    filtros: {
      acao: 'LOGIN',
      dataInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dataFim: new Date()
    },
    geradoEm: new Date(Date.now() - 2 * 60 * 60 * 1000),
    geradoPor: 'Administrador',
    status: 'concluido'
  }
]

class AuditoriaService {
  private eventos: EventoAuditoria[]
  private relatorios: RelatorioAuditoria[]

  constructor() {
    this.eventos = [...eventosAuditoriaPadrao]
    this.relatorios = [...relatoriosAuditoriaPadrao]
  }

  // Eventos de Auditoria
  getAllEventos(): EventoAuditoria[] {
    return this.eventos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getEventos(filtros: FiltroAuditoria): EventoAuditoria[] {
    let eventosFiltrados = this.eventos

    if (filtros.dataInicio) {
      eventosFiltrados = eventosFiltrados.filter(e => e.timestamp >= filtros.dataInicio!)
    }

    if (filtros.dataFim) {
      eventosFiltrados = eventosFiltrados.filter(e => e.timestamp <= filtros.dataFim!)
    }

    if (filtros.usuarioId) {
      eventosFiltrados = eventosFiltrados.filter(e => e.usuarioId === filtros.usuarioId)
    }

    if (filtros.acao) {
      eventosFiltrados = eventosFiltrados.filter(e => e.acao === filtros.acao)
    }

    if (filtros.entidade) {
      eventosFiltrados = eventosFiltrados.filter(e => e.entidade === filtros.entidade)
    }

    if (filtros.entidadeId) {
      eventosFiltrados = eventosFiltrados.filter(e => e.entidadeId === filtros.entidadeId)
    }

    if (filtros.sucesso !== undefined) {
      eventosFiltrados = eventosFiltrados.filter(e => e.sucesso === filtros.sucesso)
    }

    if (filtros.ip) {
      eventosFiltrados = eventosFiltrados.filter(e => e.ip?.includes(filtros.ip!))
    }

    return eventosFiltrados.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getEvento(id: string): EventoAuditoria | undefined {
    return this.eventos.find(e => e.id === id)
  }

  registrarEvento(evento: Omit<EventoAuditoria, 'id' | 'timestamp'>): EventoAuditoria {
    const novoEvento: EventoAuditoria = {
      ...evento,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    this.eventos.unshift(novoEvento) // Adiciona no início para manter ordem cronológica
    
    // Limita a 10000 eventos para evitar crescimento excessivo
    if (this.eventos.length > 10000) {
      this.eventos = this.eventos.slice(0, 10000)
    }

    return novoEvento
  }

  // Métodos de conveniência para registrar eventos comuns
  registrarLogin(usuarioId: string, usuarioNome: string, sucesso: boolean, ip?: string, userAgent?: string, erro?: string): EventoAuditoria {
    return this.registrarEvento({
      usuarioId,
      usuarioNome,
      acao: 'LOGIN',
      entidade: 'USUARIO',
      entidadeId: usuarioId,
      ip,
      userAgent,
      sucesso,
      erro,
      detalhes: { metodo: 'email' }
    })
  }

  registrarLogout(usuarioId: string, usuarioNome: string, ip?: string, userAgent?: string): EventoAuditoria {
    return this.registrarEvento({
      usuarioId,
      usuarioNome,
      acao: 'LOGOUT',
      entidade: 'USUARIO',
      entidadeId: usuarioId,
      ip,
      userAgent,
      sucesso: true
    })
  }

  registrarCriacao(usuarioId: string, usuarioNome: string, entidade: string, entidadeId: string, dados: Record<string, any>, ip?: string, userAgent?: string): EventoAuditoria {
    return this.registrarEvento({
      usuarioId,
      usuarioNome,
      acao: 'CRIAR',
      entidade,
      entidadeId,
      dadosNovos: dados,
      ip,
      userAgent,
      sucesso: true
    })
  }

  registrarAtualizacao(usuarioId: string, usuarioNome: string, entidade: string, entidadeId: string, dadosAnteriores: Record<string, any>, dadosNovos: Record<string, any>, ip?: string, userAgent?: string): EventoAuditoria {
    return this.registrarEvento({
      usuarioId,
      usuarioNome,
      acao: 'ATUALIZAR',
      entidade,
      entidadeId,
      dadosAnteriores,
      dadosNovos,
      ip,
      userAgent,
      sucesso: true
    })
  }

  registrarExclusao(usuarioId: string, usuarioNome: string, entidade: string, entidadeId: string, dadosAnteriores: Record<string, any>, ip?: string, userAgent?: string): EventoAuditoria {
    return this.registrarEvento({
      usuarioId,
      usuarioNome,
      acao: 'DELETAR',
      entidade,
      entidadeId,
      dadosAnteriores,
      ip,
      userAgent,
      sucesso: true
    })
  }

  registrarErro(usuarioId: string, usuarioNome: string, acao: string, entidade: string, entidadeId: string, erro: string, ip?: string, userAgent?: string): EventoAuditoria {
    return this.registrarEvento({
      usuarioId,
      usuarioNome,
      acao,
      entidade,
      entidadeId,
      ip,
      userAgent,
      sucesso: false,
      erro
    })
  }

  // Relatórios de Auditoria
  getAllRelatorios(): RelatorioAuditoria[] {
    return this.relatorios.sort((a, b) => b.geradoEm.getTime() - a.geradoEm.getTime())
  }

  getRelatorio(id: string): RelatorioAuditoria | undefined {
    return this.relatorios.find(r => r.id === id)
  }

  criarRelatorio(nome: string, descricao: string, filtros: FiltroAuditoria, geradoPor: string): RelatorioAuditoria {
    const relatorio: RelatorioAuditoria = {
      id: Date.now().toString(),
      nome,
      descricao,
      filtros,
      geradoEm: new Date(),
      geradoPor,
      status: 'pendente'
    }
    this.relatorios.unshift(relatorio)
    return relatorio
  }

  atualizarStatusRelatorio(id: string, status: RelatorioAuditoria['status'], arquivo?: string): RelatorioAuditoria | null {
    const index = this.relatorios.findIndex(r => r.id === id)
    if (index === -1) return null

    this.relatorios[index].status = status
    if (arquivo) {
      this.relatorios[index].arquivo = arquivo
    }
    return this.relatorios[index]
  }

  // Estatísticas
  gerarEstatisticas(filtros: FiltroAuditoria): EstatisticaAuditoria {
    const eventos = this.getEventos(filtros)
    
    const eventosPorAcao: Record<string, number> = {}
    const eventosPorUsuario: Record<string, number> = {}
    const eventosPorEntidade: Record<string, number> = {}
    const eventosPorDia: Record<string, number> = {}
    const usuariosAtivos = new Set<string>()

    let eventosComErro = 0

    eventos.forEach(evento => {
      // Contadores por ação
      eventosPorAcao[evento.acao] = (eventosPorAcao[evento.acao] || 0) + 1
      
      // Contadores por usuário
      eventosPorUsuario[evento.usuarioNome] = (eventosPorUsuario[evento.usuarioNome] || 0) + 1
      usuariosAtivos.add(evento.usuarioNome)
      
      // Contadores por entidade
      eventosPorEntidade[evento.entidade] = (eventosPorEntidade[evento.entidade] || 0) + 1
      
      // Contadores por dia
      const dia = evento.timestamp.toISOString().split('T')[0]
      eventosPorDia[dia] = (eventosPorDia[dia] || 0) + 1
      
      // Eventos com erro
      if (!evento.sucesso) {
        eventosComErro++
      }
    })

    return {
      totalEventos: eventos.length,
      eventosPorAcao,
      eventosPorUsuario,
      eventosPorEntidade,
      eventosPorDia,
      eventosComErro,
      usuariosAtivos: Array.from(usuariosAtivos),
      periodo: {
        inicio: filtros.dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        fim: filtros.dataFim || new Date()
      }
    }
  }

  // Limpeza de dados antigos
  limparEventosAntigos(dias: number = 90): number {
    const dataLimite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
    const eventosAntigos = this.eventos.filter(e => e.timestamp < dataLimite)
    this.eventos = this.eventos.filter(e => e.timestamp >= dataLimite)
    return eventosAntigos.length
  }

  // Exportação de dados
  exportarEventos(filtros: FiltroAuditoria, formato: 'json' | 'csv' = 'json'): string {
    const eventos = this.getEventos(filtros)
    
    if (formato === 'csv') {
      const headers = ['ID', 'Data', 'Usuário', 'Ação', 'Entidade', 'Entidade ID', 'Sucesso', 'IP', 'Erro']
      const rows = eventos.map(evento => [
        evento.id,
        evento.timestamp.toISOString(),
        evento.usuarioNome,
        evento.acao,
        evento.entidade,
        evento.entidadeId,
        evento.sucesso ? 'Sim' : 'Não',
        evento.ip || '',
        evento.erro || ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return JSON.stringify(eventos, null, 2)
  }

  // Métodos de monitoramento
  getEventosRecentes(limite: number = 50): EventoAuditoria[] {
    return this.eventos.slice(0, limite)
  }

  getEventosComErro(limite: number = 20): EventoAuditoria[] {
    return this.eventos.filter(e => !e.sucesso).slice(0, limite)
  }

  getAtividadeUsuario(usuarioId: string, limite: number = 20): EventoAuditoria[] {
    return this.eventos
      .filter(e => e.usuarioId === usuarioId)
      .slice(0, limite)
  }

  // Métodos de segurança
  detectarAtividadeSuspeita(): EventoAuditoria[] {
    const agora = new Date()
    const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000)
    
    // Detecta múltiplas tentativas de login falhadas
    const loginsFalhados = this.eventos
      .filter(e => 
        e.acao === 'LOGIN' && 
        !e.sucesso && 
        e.timestamp >= umaHoraAtras
      )
    
    // Agrupa por IP
    const tentativasPorIP: Record<string, EventoAuditoria[]> = {}
    loginsFalhados.forEach(evento => {
      if (evento.ip) {
        if (!tentativasPorIP[evento.ip]) {
          tentativasPorIP[evento.ip] = []
        }
        tentativasPorIP[evento.ip].push(evento)
      }
    })
    
    // Retorna IPs com mais de 5 tentativas
    const atividadeSuspeita: EventoAuditoria[] = []
    Object.entries(tentativasPorIP).forEach(([ip, eventos]) => {
      if (eventos.length >= 5) {
        atividadeSuspeita.push(...eventos)
      }
    })
    
    return atividadeSuspeita
  }
}

export const auditoriaService = new AuditoriaService()
