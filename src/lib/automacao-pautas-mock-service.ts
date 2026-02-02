// Serviço de automação de pautas baseado no SAPL
import { PautaSessao } from './types/pauta-sessao'
import { ProposicaoDisponivel } from './pauta-proposicoes-service'

// Interfaces para automação
export interface TemplatePauta {
  id: string
  nome: string
  descricao: string
  tipo: 'ordinaria' | 'extraordinaria' | 'especial' | 'solene'
  secoes: SecaoTemplate[]
  configuracoes: ConfiguracaoTemplate
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface SecaoTemplate {
  id: string
  nome: string
  tipo: 'correspondencias' | 'expedientes' | 'materiasExpediente' | 'ordemDoDia'
  ordem: number
  obrigatoria: boolean
  itensPadrao: ItemTemplate[]
  regras: RegraSecao[]
}

export interface ItemTemplate {
  id: string
  titulo: string
  descricao: string
  tipo: string
  ordem: number
  obrigatorio: boolean
  placeholder: string
  validacoes: string[]
}

export interface RegraSecao {
  id: string
  nome: string
  condicao: CondicaoRegra
  acao: AcaoRegra
  ativa: boolean
}

export interface CondicaoRegra {
  campo: string
  operador: 'igual' | 'diferente' | 'maior' | 'menor' | 'contem' | 'nao_contem'
  valor: any
  logica: 'E' | 'OU'
}

export interface AcaoRegra {
  tipo: 'incluir' | 'excluir' | 'reordenar' | 'notificar' | 'validar'
  parametros: Record<string, any>
  mensagem: string
}

export interface ConfiguracaoTemplate {
  numeracaoAutomatica: boolean
  preenchimentoAutomatico: boolean
  validacaoAutomatica: boolean
  notificacoes: boolean
  emails: string[]
  prazos: {
    notificacaoAntecipada: number // dias
    lembrete: number // horas
  }
}

export interface RegraAutomatica {
  id: string
  nome: string
  descricao: string
  ativa: boolean
  condicoes: CondicaoRegra[]
  acoes: AcaoRegra[]
  prioridade: number
  execucao: 'imediata' | 'agendada' | 'periodica'
  agendamento?: AgendamentoRegra
}

export interface AgendamentoRegra {
  tipo: 'diario' | 'semanal' | 'mensal' | 'data_especifica'
  horario: string
  dias?: number[]
  data?: string
  ativo: boolean
}

export interface ExecucaoAutomatica {
  id: string
  regraId: string
  pautaId: string
  status: 'pendente' | 'executando' | 'concluida' | 'erro'
  inicioExecucao: string
  fimExecucao?: string
  resultado: any
  erros: string[]
  logs: LogExecucao[]
}

export interface LogExecucao {
  timestamp: string
  nivel: 'info' | 'warning' | 'error'
  mensagem: string
  detalhes?: any
}

// Templates padrão baseados no SAPL
const templatesPadrao: TemplatePauta[] = [
  {
    id: 'template-001',
    nome: 'Sessão Ordinária Padrão',
    descricao: 'Template padrão para sessões ordinárias com todas as seções básicas',
    tipo: 'ordinaria',
    secoes: [
      {
        id: 'secao-001',
        nome: 'Correspondências',
        tipo: 'correspondencias',
        ordem: 1,
        obrigatoria: true,
        itensPadrao: [
          {
            id: 'item-001',
            titulo: 'Correspondências Recebidas',
            descricao: 'Leitura das correspondências recebidas',
            tipo: 'LEITURA',
            ordem: 1,
            obrigatorio: true,
            placeholder: 'Adicionar correspondências recebidas',
            validacoes: ['correspondencia_valida']
          }
        ],
        regras: []
      },
      {
        id: 'secao-002',
        nome: 'Expedientes',
        tipo: 'expedientes',
        ordem: 2,
        obrigatoria: true,
        itensPadrao: [
          {
            id: 'item-002',
            titulo: 'Abertura da Sessão',
            descricao: 'Declaração de abertura da sessão',
            tipo: 'ABERTURA',
            ordem: 1,
            obrigatorio: true,
            placeholder: 'Declarar aberta a sessão',
            validacoes: ['quorum_verificado']
          },
          {
            id: 'item-003',
            titulo: 'Leitura da Ata Anterior',
            descricao: 'Leitura e votação da ata da sessão anterior',
            tipo: 'ATA_ANTERIOR',
            ordem: 2,
            obrigatorio: true,
            placeholder: 'Ler e votar ata anterior',
            validacoes: ['ata_disponivel']
          }
        ],
        regras: []
      },
      {
        id: 'secao-003',
        nome: 'Matérias do Expediente',
        tipo: 'materiasExpediente',
        ordem: 3,
        obrigatoria: false,
        itensPadrao: [],
        regras: [
          {
            id: 'regra-001',
            nome: 'Auto-inclusão de Requerimentos',
            condicao: {
              campo: 'tipo',
              operador: 'igual',
              valor: 'REQUERIMENTO',
              logica: 'E'
            },
            acao: {
              tipo: 'incluir',
              parametros: { secao: 'materiasExpediente' },
              mensagem: 'Requerimento incluído automaticamente no expediente'
            },
            ativa: true
          }
        ]
      },
      {
        id: 'secao-004',
        nome: 'Ordem do Dia',
        tipo: 'ordemDoDia',
        ordem: 4,
        obrigatoria: false,
        itensPadrao: [],
        regras: [
          {
            id: 'regra-002',
            nome: 'Auto-inclusão de Projetos de Lei',
            condicao: {
              campo: 'tipo',
              operador: 'igual',
              valor: 'PROJETO_LEI',
              logica: 'E'
            },
            acao: {
              tipo: 'incluir',
              parametros: { secao: 'ordemDoDia' },
              mensagem: 'Projeto de lei incluído automaticamente na ordem do dia'
            },
            ativa: true
          }
        ]
      }
    ],
    configuracoes: {
      numeracaoAutomatica: true,
      preenchimentoAutomatico: true,
      validacaoAutomatica: true,
      notificacoes: true,
      emails: ['presidente@camaramojui.pa.gov.br', 'secretario@camaramojui.pa.gov.br'],
      prazos: {
        notificacaoAntecipada: 1, // 1 dia antes
        lembrete: 2 // 2 horas antes
      }
    },
    ativo: true,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  }
]

// Regras automáticas padrão
const regrasAutomaticasPadrao: RegraAutomatica[] = [
  {
    id: 'regra-auto-001',
    nome: 'Inclusão Automática de Requerimentos',
    descricao: 'Inclui automaticamente requerimentos no expediente',
    ativa: true,
    condicoes: [
      {
        campo: 'tipo',
        operador: 'igual',
        valor: 'REQUERIMENTO',
        logica: 'E'
      },
      {
        campo: 'status',
        operador: 'igual',
        valor: 'EM_TRAMITACAO',
        logica: 'E'
      }
    ],
    acoes: [
      {
        tipo: 'incluir',
        parametros: {
          secao: 'materiasExpediente',
          posicao: 'final'
        },
        mensagem: 'Requerimento incluído automaticamente no expediente'
      }
    ],
    prioridade: 1,
    execucao: 'imediata'
  },
  {
    id: 'regra-auto-002',
    nome: 'Inclusão Automática de Projetos de Lei',
    descricao: 'Inclui automaticamente projetos de lei na ordem do dia',
    ativa: true,
    condicoes: [
      {
        campo: 'tipo',
        operador: 'igual',
        valor: 'PROJETO_LEI',
        logica: 'E'
      },
      {
        campo: 'tramitacaoCompleta',
        operador: 'igual',
        valor: true,
        logica: 'E'
      }
    ],
    acoes: [
      {
        tipo: 'incluir',
        parametros: {
          secao: 'ordemDoDia',
          posicao: 'final'
        },
        mensagem: 'Projeto de lei incluído automaticamente na ordem do dia'
      }
    ],
    prioridade: 2,
    execucao: 'imediata'
  },
  {
    id: 'regra-auto-003',
    nome: 'Notificação de Pauta',
    descricao: 'Envia notificação quando pauta é criada',
    ativa: true,
    condicoes: [
      {
        campo: 'status',
        operador: 'igual',
        valor: 'PUBLICADA',
        logica: 'E'
      }
    ],
    acoes: [
      {
        tipo: 'notificar',
        parametros: {
          tipo: 'email',
          destinatarios: ['parlamentares', 'publico'],
          template: 'pauta_publicada'
        },
        mensagem: 'Notificação de pauta enviada'
      }
    ],
    prioridade: 3,
    execucao: 'imediata'
  }
]

// Serviço de automação de pautas
export const automacaoPautasService = {
  // Obter templates disponíveis
  getTemplates: (): TemplatePauta[] => {
    return templatesPadrao.filter(template => template.ativo)
  },

  // Obter template por ID
  getTemplateById: (id: string): TemplatePauta | undefined => {
    return templatesPadrao.find(template => template.id === id)
  },

  // Obter regras automáticas
  getRegrasAutomaticas: (): RegraAutomatica[] => {
    return regrasAutomaticasPadrao.filter(regra => regra.ativa)
  },

  // Aplicar template à pauta
  aplicarTemplate: (pautaId: string, templateId: string): boolean => {
    const template = automacaoPautasService.getTemplateById(templateId)
    if (!template) return false

    // Aqui você implementaria a lógica para aplicar o template
    // Por exemplo, criar itens padrão, configurar seções, etc.
    
    return true
  },

  // Executar regras automáticas
  executarRegrasAutomaticas: (pauta: PautaSessao, proposicoes: ProposicaoDisponivel[]): ExecucaoAutomatica[] => {
    const regras = automacaoPautasService.getRegrasAutomaticas()
    const execucoes: ExecucaoAutomatica[] = []

    regras.forEach(regra => {
      if (automacaoPautasService.deveExecutarRegra(regra, pauta, proposicoes)) {
        const execucao = automacaoPautasService.executarRegra(regra, pauta, proposicoes)
        execucoes.push(execucao)
      }
    })

    return execucoes
  },

  // Verificar se regra deve ser executada
  deveExecutarRegra: (regra: RegraAutomatica, pauta: PautaSessao, proposicoes: ProposicaoDisponivel[]): boolean => {
    if (!regra.ativa) return false

    // Verificar condições da regra
    return regra.condicoes.every(condicao => {
      return automacaoPautasService.avaliarCondicao(condicao, pauta, proposicoes)
    })
  },

  // Avaliar condição
  avaliarCondicao: (condicao: CondicaoRegra, pauta: PautaSessao, proposicoes: ProposicaoDisponivel[]): boolean => {
    // Implementar lógica de avaliação de condições
    // Por exemplo, verificar se proposição atende aos critérios
    return true // Simplificado para demonstração
  },

  // Executar regra
  executarRegra: (regra: RegraAutomatica, pauta: PautaSessao, proposicoes: ProposicaoDisponivel[]): ExecucaoAutomatica => {
    const execucao: ExecucaoAutomatica = {
      id: `exec-${Date.now()}`,
      regraId: regra.id,
      pautaId: pauta.id,
      status: 'executando',
      inicioExecucao: new Date().toISOString(),
      resultado: {},
      erros: [],
      logs: []
    }

    try {
      // Executar ações da regra
      regra.acoes.forEach(acao => {
        const resultadoAcao = automacaoPautasService.executarAcao(acao, pauta, proposicoes)
        execucao.resultado[acao.tipo] = resultadoAcao
        
        execucao.logs.push({
          timestamp: new Date().toISOString(),
          nivel: 'info',
          mensagem: acao.mensagem,
          detalhes: resultadoAcao
        })
      })

      execucao.status = 'concluida'
      execucao.fimExecucao = new Date().toISOString()

    } catch (error) {
      execucao.status = 'erro'
      execucao.erros.push(error instanceof Error ? error.message : 'Erro desconhecido')
      execucao.fimExecucao = new Date().toISOString()

      execucao.logs.push({
        timestamp: new Date().toISOString(),
        nivel: 'error',
        mensagem: 'Erro na execução da regra',
        detalhes: error
      })
    }

    return execucao
  },

  // Executar ação
  executarAcao: (acao: AcaoRegra, pauta: PautaSessao, proposicoes: ProposicaoDisponivel[]): any => {
    switch (acao.tipo) {
      case 'incluir':
        return automacaoPautasService.incluirItem(acao, pauta, proposicoes)
      
      case 'excluir':
        return automacaoPautasService.excluirItem(acao, pauta)
      
      case 'reordenar':
        return automacaoPautasService.reordenarItens(acao, pauta)
      
      case 'notificar':
        return automacaoPautasService.enviarNotificacao(acao, pauta)
      
      case 'validar':
        return automacaoPautasService.validarPauta(acao, pauta)
      
      default:
        throw new Error(`Tipo de ação não suportado: ${acao.tipo}`)
    }
  },

  // Incluir item automaticamente
  incluirItem: (acao: AcaoRegra, pauta: PautaSessao, proposicoes: ProposicaoDisponivel[]): any => {
    const secao = acao.parametros.secao
    const posicao = acao.parametros.posicao || 'final'

    // Lógica para incluir itens baseados nas proposições disponíveis
    // Por exemplo, incluir requerimentos no expediente
    const proposicoesParaIncluir = proposicoes.filter(p => {
      if (secao === 'materiasExpediente') {
        return p.tipo === 'REQUERIMENTO' && p.podeIncluirEmPauta
      }
      if (secao === 'ordemDoDia') {
        return p.tipo === 'PROJETO_LEI' && p.podeIncluirEmPauta
      }
      return false
    })

    return {
      itensIncluidos: proposicoesParaIncluir.length,
      secao,
      posicao
    }
  },

  // Excluir item
  excluirItem: (acao: AcaoRegra, pauta: PautaSessao): any => {
    // Implementar lógica de exclusão
    return { itensExcluidos: 0 }
  },

  // Reordenar itens
  reordenarItens: (acao: AcaoRegra, pauta: PautaSessao): any => {
    // Implementar lógica de reordenação
    return { itensReordenados: 0 }
  },

  // Enviar notificação
  enviarNotificacao: (acao: AcaoRegra, pauta: PautaSessao): any => {
    // Implementar lógica de notificação
    return { notificacoesEnviadas: 0 }
  },

  // Validar pauta
  validarPauta: (acao: AcaoRegra, pauta: PautaSessao): any => {
    // Implementar lógica de validação
    return { validacao: true }
  },

  // Gerar pauta automática
  gerarPautaAutomatica: (templateId: string, proposicoes: ProposicaoDisponivel[]): PautaSessao | null => {
    const template = automacaoPautasService.getTemplateById(templateId)
    if (!template) return null

    // Criar pauta baseada no template
    const pauta: Partial<PautaSessao> = {
      id: `pauta-auto-${Date.now()}`,
      numero: automacaoPautasService.gerarNumeroAutomatico(),
      data: new Date().toISOString().split('T')[0],
      tipo: template.tipo.toUpperCase() as any,
      status: 'RASCUNHO',
      titulo: `Pauta ${template.tipo} - ${new Date().toLocaleDateString('pt-BR')}`,
      correspondencias: [],
      expedientes: [],
      materiasExpediente: [],
      ordemDoDia: []
    }

    // Aplicar template
    template.secoes.forEach(secao => {
      if (secao.obrigatoria) {
        // Adicionar itens padrão obrigatórios
        secao.itensPadrao.forEach(item => {
          if (item.obrigatorio) {
            // Criar item baseado no template
            // Implementar lógica específica para cada tipo de seção
          }
        })
      }
    })

    // Executar regras automáticas
    const regras = automacaoPautasService.getRegrasAutomaticas()
    regras.forEach(regra => {
      if (automacaoPautasService.deveExecutarRegra(regra, pauta as PautaSessao, proposicoes)) {
        automacaoPautasService.executarRegra(regra, pauta as PautaSessao, proposicoes)
      }
    })

    return pauta as PautaSessao
  },

  // Gerar número automático
  gerarNumeroAutomatico: (): string => {
    const ano = new Date().getFullYear()
    const sequencial = Math.floor(Math.random() * 999) + 1
    return sequencial.toString().padStart(3, '0')
  },

  // Obter estatísticas de automação
  getStatsAutomacao: () => {
    return {
      templatesAtivos: templatesPadrao.filter(t => t.ativo).length,
      regrasAtivas: regrasAutomaticasPadrao.filter(r => r.ativa).length,
      execucoesHoje: 0, // Seria calculado dinamicamente
      pautasAutomaticas: 0 // Seria calculado dinamicamente
    }
  }
}
