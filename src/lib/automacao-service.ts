// Serviço de automação para pautas e tramitação
export interface RegraAutomacao {
  id: string
  nome: string
  descricao: string
  tipo: 'pauta' | 'tramitacao' | 'notificacao' | 'prazo'
  ativa: boolean
  condicoes: CondicaoAutomacao[]
  acoes: AcaoAutomacao[]
  prioridade: number
  criadaEm: Date
  atualizadaEm: Date
}

export interface CondicaoAutomacao {
  id: string
  campo: string
  operador: 'igual' | 'diferente' | 'maior' | 'menor' | 'contem' | 'inicio' | 'fim'
  valor: string
  logica: 'E' | 'OU'
}

export interface AcaoAutomacao {
  id: string
  tipo: 'alterar_status' | 'enviar_email' | 'criar_tramitacao' | 'adicionar_pauta' | 'definir_prazo' | 'criar_lembrete'
  parametros: Record<string, any>
  ordem: number
}

export interface TemplateEmail {
  id: string
  nome: string
  assunto: string
  conteudo: string
  variaveis: string[]
  ativo: boolean
}

export interface AgendamentoPauta {
  id: string
  nome: string
  tipo: 'periodica' | 'evento' | 'proposicao'
  configuracao: {
    frequencia?: 'diaria' | 'semanal' | 'mensal'
    diasSemana?: number[]
    diaMes?: number
    hora?: string
    evento?: string
    proposicaoId?: string
  }
  ativo: boolean
  proximaExecucao: Date
  ultimaExecucao?: Date
}

// Regras de automação padrão
const regrasAutomacaoPadrao: RegraAutomacao[] = [
  {
    id: '1',
    nome: 'Proposições aprovadas em primeira discussão',
    descricao: 'Automaticamente cria tramitação para segunda discussão quando proposição é aprovada em primeira discussão',
    tipo: 'tramitacao',
    ativa: true,
    condicoes: [
      {
        id: '1',
        campo: 'status',
        operador: 'igual',
        valor: 'APROVADA_PRIMEIRA_DISCUSSAO',
        logica: 'E'
      }
    ],
    acoes: [
      {
        id: '1',
        tipo: 'criar_tramitacao',
        parametros: {
          tipo: 'SEGUNDA_DISCUSSAO',
          prazo: 30,
          observacao: 'Tramitação automática criada para segunda discussão'
        },
        ordem: 1
      }
    ],
    prioridade: 1,
    criadaEm: new Date(),
    atualizadaEm: new Date()
  },
  {
    id: '2',
    nome: 'Proposições com prazo vencido',
    descricao: 'Envia notificação quando proposição tem prazo de tramitação vencido',
    tipo: 'notificacao',
    ativa: true,
    condicoes: [
      {
        id: '2',
        campo: 'prazoVencido',
        operador: 'igual',
        valor: 'true',
        logica: 'E'
      }
    ],
    acoes: [
      {
        id: '2',
        tipo: 'enviar_email',
        parametros: {
          template: 'prazo_vencido',
          destinatarios: ['presidente@camara.gov.br', 'secretario@camara.gov.br']
        },
        ordem: 1
      }
    ],
    prioridade: 2,
    criadaEm: new Date(),
    atualizadaEm: new Date()
  },
  {
    id: '3',
    nome: 'Adicionar proposições à pauta',
    descricao: 'Adiciona automaticamente proposições de determinados tipos à próxima sessão',
    tipo: 'pauta',
    ativa: true,
    condicoes: [
      {
        id: '3',
        campo: 'tipo',
        operador: 'igual',
        valor: 'PROJETO_LEI',
        logica: 'E'
      },
      {
        id: '4',
        campo: 'status',
        operador: 'igual',
        valor: 'EM_TRAMITACAO',
        logica: 'E'
      }
    ],
    acoes: [
      {
        id: '3',
        tipo: 'adicionar_pauta',
        parametros: {
          tipoSessao: 'ORDINARIA',
          ordem: 'fim'
        },
        ordem: 1
      }
    ],
    prioridade: 3,
    criadaEm: new Date(),
    atualizadaEm: new Date()
  }
]

// Templates de email padrão
const templatesEmailPadrao: TemplateEmail[] = [
  {
    id: '1',
    nome: 'Prazo Vencido',
    assunto: 'Prazo de tramitação vencido - {{proposicao.numero}}',
    conteudo: `
      <p>Prezados,</p>
      <p>A proposição <strong>{{proposicao.numero}}</strong> - {{proposicao.titulo}} tem prazo de tramitação vencido.</p>
      <p><strong>Detalhes:</strong></p>
      <ul>
        <li>Número: {{proposicao.numero}}</li>
        <li>Título: {{proposicao.titulo}}</li>
        <li>Autor: {{proposicao.autor}}</li>
        <li>Prazo: {{tramitacao.prazo}}</li>
        <li>Vencimento: {{tramitacao.vencimento}}</li>
      </ul>
      <p>Atenciosamente,<br>Sistema de Gestão Legislativa</p>
    `,
    variaveis: ['proposicao.numero', 'proposicao.titulo', 'proposicao.autor', 'tramitacao.prazo', 'tramitacao.vencimento'],
    ativo: true
  },
  {
    id: '2',
    nome: 'Nova Tramitação',
    assunto: 'Nova tramitação criada - {{proposicao.numero}}',
    conteudo: `
      <p>Prezados,</p>
      <p>Uma nova tramitação foi criada para a proposição <strong>{{proposicao.numero}}</strong>.</p>
      <p><strong>Detalhes da tramitação:</strong></p>
      <ul>
        <li>Tipo: {{tramitacao.tipo}}</li>
        <li>Órgão: {{tramitacao.orgao}}</li>
        <li>Prazo: {{tramitacao.prazo}} dias</li>
        <li>Observações: {{tramitacao.observacao}}</li>
      </ul>
      <p>Atenciosamente,<br>Sistema de Gestão Legislativa</p>
    `,
    variaveis: ['proposicao.numero', 'tramitacao.tipo', 'tramitacao.orgao', 'tramitacao.prazo', 'tramitacao.observacao'],
    ativo: true
  },
  {
    id: '3',
    nome: 'Lembrete de Prazo',
    assunto: 'Lembrete: Prazo próximo do vencimento - {{proposicao.numero}}',
    conteudo: `
      <p>Prezados,</p>
      <p>A proposição <strong>{{proposicao.numero}}</strong> tem prazo próximo do vencimento.</p>
      <p><strong>Detalhes:</strong></p>
      <ul>
        <li>Número: {{proposicao.numero}}</li>
        <li>Título: {{proposicao.titulo}}</li>
        <li>Dias restantes: {{diasRestantes}}</li>
        <li>Vencimento: {{tramitacao.vencimento}}</li>
      </ul>
      <p>Atenciosamente,<br>Sistema de Gestão Legislativa</p>
    `,
    variaveis: ['proposicao.numero', 'proposicao.titulo', 'diasRestantes', 'tramitacao.vencimento'],
    ativo: true
  }
]

// Agendamentos de pauta padrão
const agendamentosPautaPadrao: AgendamentoPauta[] = [
  {
    id: '1',
    nome: 'Sessão Ordinária Semanal',
    tipo: 'periodica',
    configuracao: {
      frequencia: 'semanal',
      diasSemana: [1], // Segunda-feira
      hora: '19:00'
    },
    ativo: true,
    proximaExecucao: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
    ultimaExecucao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Há uma semana
  },
  {
    id: '2',
    nome: 'Sessão Extraordinária Mensal',
    tipo: 'periodica',
    configuracao: {
      frequencia: 'mensal',
      diaMes: 15,
      hora: '19:00'
    },
    ativo: true,
    proximaExecucao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Em um mês
    ultimaExecucao: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // Há 15 dias
  }
]

class AutomacaoService {
  private regras: RegraAutomacao[]
  private templatesEmail: TemplateEmail[]
  private agendamentosPauta: AgendamentoPauta[]

  constructor() {
    this.regras = [...regrasAutomacaoPadrao]
    this.templatesEmail = [...templatesEmailPadrao]
    this.agendamentosPauta = [...agendamentosPautaPadrao]
  }

  // Regras de Automação
  getAllRegras(): RegraAutomacao[] {
    return this.regras.filter(r => r.ativa)
  }

  getRegra(id: string): RegraAutomacao | undefined {
    return this.regras.find(r => r.id === id)
  }

  createRegra(regra: Omit<RegraAutomacao, 'id' | 'criadaEm' | 'atualizadaEm'>): RegraAutomacao {
    const novaRegra: RegraAutomacao = {
      ...regra,
      id: Date.now().toString(),
      criadaEm: new Date(),
      atualizadaEm: new Date()
    }
    this.regras.push(novaRegra)
    return novaRegra
  }

  updateRegra(id: string, regra: Partial<RegraAutomacao>): RegraAutomacao | null {
    const index = this.regras.findIndex(r => r.id === id)
    if (index === -1) return null

    this.regras[index] = {
      ...this.regras[index],
      ...regra,
      atualizadaEm: new Date()
    }
    return this.regras[index]
  }

  deleteRegra(id: string): boolean {
    const index = this.regras.findIndex(r => r.id === id)
    if (index === -1) return false

    this.regras.splice(index, 1)
    return true
  }

  // Templates de Email
  getAllTemplatesEmail(): TemplateEmail[] {
    return this.templatesEmail.filter(t => t.ativo)
  }

  getTemplateEmail(id: string): TemplateEmail | undefined {
    return this.templatesEmail.find(t => t.id === id)
  }

  createTemplateEmail(template: Omit<TemplateEmail, 'id'>): TemplateEmail {
    const novoTemplate: TemplateEmail = {
      ...template,
      id: Date.now().toString()
    }
    this.templatesEmail.push(novoTemplate)
    return novoTemplate
  }

  updateTemplateEmail(id: string, template: Partial<TemplateEmail>): TemplateEmail | null {
    const index = this.templatesEmail.findIndex(t => t.id === id)
    if (index === -1) return null

    this.templatesEmail[index] = {
      ...this.templatesEmail[index],
      ...template
    }
    return this.templatesEmail[index]
  }

  deleteTemplateEmail(id: string): boolean {
    const index = this.templatesEmail.findIndex(t => t.id === id)
    if (index === -1) return false

    this.templatesEmail.splice(index, 1)
    return true
  }

  // Agendamentos de Pauta
  getAllAgendamentosPauta(): AgendamentoPauta[] {
    return this.agendamentosPauta.filter(a => a.ativo)
  }

  getAgendamentoPauta(id: string): AgendamentoPauta | undefined {
    return this.agendamentosPauta.find(a => a.id === id)
  }

  createAgendamentoPauta(agendamento: Omit<AgendamentoPauta, 'id'>): AgendamentoPauta {
    const novoAgendamento: AgendamentoPauta = {
      ...agendamento,
      id: Date.now().toString()
    }
    this.agendamentosPauta.push(novoAgendamento)
    return novoAgendamento
  }

  updateAgendamentoPauta(id: string, agendamento: Partial<AgendamentoPauta>): AgendamentoPauta | null {
    const index = this.agendamentosPauta.findIndex(a => a.id === id)
    if (index === -1) return null

    this.agendamentosPauta[index] = {
      ...this.agendamentosPauta[index],
      ...agendamento
    }
    return this.agendamentosPauta[index]
  }

  deleteAgendamentoPauta(id: string): boolean {
    const index = this.agendamentosPauta.findIndex(a => a.id === id)
    if (index === -1) return false

    this.agendamentosPauta.splice(index, 1)
    return true
  }

  // Execução de Regras
  executarRegras(contexto: Record<string, any>): void {
    const regrasAtivas = this.getAllRegras().sort((a, b) => a.prioridade - b.prioridade)

    regrasAtivas.forEach(regra => {
      if (this.avaliarCondicoes(regra.condicoes, contexto)) {
        this.executarAcoes(regra.acoes, contexto)
      }
    })
  }

  private avaliarCondicoes(condicoes: CondicaoAutomacao[], contexto: Record<string, any>): boolean {
    if (condicoes.length === 0) return true

    let resultado = true
    let logicaAtual = 'E'

    condicoes.forEach((condicao, index) => {
      const valorCampo = this.obterValorCampo(condicao.campo, contexto)
      const condicaoAtendida = this.avaliarCondicao(condicao, valorCampo)

      if (index === 0) {
        resultado = condicaoAtendida
      } else {
        if (logicaAtual === 'E') {
          resultado = resultado && condicaoAtendida
        } else {
          resultado = resultado || condicaoAtendida
        }
      }

      logicaAtual = condicao.logica
    })

    return resultado
  }

  private avaliarCondicao(condicao: CondicaoAutomacao, valorCampo: any): boolean {
    const valor = String(valorCampo).toLowerCase()
    const valorComparacao = String(condicao.valor).toLowerCase()

    switch (condicao.operador) {
      case 'igual':
        return valor === valorComparacao
      case 'diferente':
        return valor !== valorComparacao
      case 'contem':
        return valor.includes(valorComparacao)
      case 'inicio':
        return valor.startsWith(valorComparacao)
      case 'fim':
        return valor.endsWith(valorComparacao)
      case 'maior':
        return parseFloat(valor) > parseFloat(valorComparacao)
      case 'menor':
        return parseFloat(valor) < parseFloat(valorComparacao)
      default:
        return false
    }
  }

  private obterValorCampo(campo: string, contexto: Record<string, any>): any {
    const partes = campo.split('.')
    let valor = contexto

    for (const parte of partes) {
      valor = valor?.[parte]
      if (valor === undefined || valor === null) return null
    }

    return valor
  }

  private executarAcoes(acoes: AcaoAutomacao[], contexto: Record<string, any>): void {
    acoes.sort((a, b) => a.ordem - b.ordem)

    acoes.forEach(acao => {
      this.executarAcao(acao, contexto)
    })
  }

  private executarAcao(acao: AcaoAutomacao, contexto: Record<string, any>): void {
    switch (acao.tipo) {
      case 'enviar_email':
        this.enviarEmail(acao.parametros, contexto)
        break
      case 'criar_tramitacao':
        this.criarTramitacao(acao.parametros, contexto)
        break
      case 'adicionar_pauta':
        this.adicionarPauta(acao.parametros, contexto)
        break
      case 'alterar_status':
        this.alterarStatus(acao.parametros, contexto)
        break
      case 'definir_prazo':
        this.definirPrazo(acao.parametros, contexto)
        break
      case 'criar_lembrete':
        this.criarLembrete(acao.parametros, contexto)
        break
    }
  }

  private enviarEmail(parametros: Record<string, any>, contexto: Record<string, any>): void {
    const template = this.getTemplateEmail(parametros.template)
    if (!template) return

    // Implementar lógica de envio de email
    console.log('Enviando email:', {
      template: template.nome,
      destinatarios: parametros.destinatarios,
      contexto
    })
  }

  private criarTramitacao(parametros: Record<string, any>, contexto: Record<string, any>): void {
    // Implementar lógica de criação de tramitação
    console.log('Criando tramitação:', parametros)
  }

  private adicionarPauta(parametros: Record<string, any>, contexto: Record<string, any>): void {
    // Implementar lógica de adição à pauta
    console.log('Adicionando à pauta:', parametros)
  }

  private alterarStatus(parametros: Record<string, any>, contexto: Record<string, any>): void {
    // Implementar lógica de alteração de status
    console.log('Alterando status:', parametros)
  }

  private definirPrazo(parametros: Record<string, any>, contexto: Record<string, any>): void {
    // Implementar lógica de definição de prazo
    console.log('Definindo prazo:', parametros)
  }

  private criarLembrete(parametros: Record<string, any>, contexto: Record<string, any>): void {
    // Implementar lógica de criação de lembrete
    console.log('Criando lembrete:', parametros)
  }

  // Métodos utilitários
  processarProposicao(proposicao: any): void {
    this.executarRegras({ proposicao })
  }

  processarTramitacao(tramitacao: any): void {
    this.executarRegras({ tramitacao })
  }

  processarPauta(pauta: any): void {
    this.executarRegras({ pauta })
  }

  // Agendamento automático
  executarAgendamentos(): void {
    const agora = new Date()
    const agendamentos = this.getAllAgendamentosPauta()

    agendamentos.forEach(agendamento => {
      if (agendamento.proximaExecucao <= agora) {
        this.executarAgendamento(agendamento)
        this.atualizarProximaExecucao(agendamento)
      }
    })
  }

  private executarAgendamento(agendamento: AgendamentoPauta): void {
    console.log('Executando agendamento:', agendamento.nome)
    // Implementar lógica específica do agendamento
  }

  private atualizarProximaExecucao(agendamento: AgendamentoPauta): void {
    const agora = new Date()
    let proximaExecucao: Date

    switch (agendamento.configuracao.frequencia) {
      case 'diaria':
        proximaExecucao = new Date(agora.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'semanal':
        proximaExecucao = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'mensal':
        proximaExecucao = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      default:
        proximaExecucao = new Date(agora.getTime() + 24 * 60 * 60 * 1000)
    }

    this.updateAgendamentoPauta(agendamento.id, {
      proximaExecucao,
      ultimaExecucao: agora
    })
  }
}

export const automacaoService = new AutomacaoService()