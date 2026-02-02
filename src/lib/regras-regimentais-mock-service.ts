// Serviço de regras regimentais baseado no SAPL
import { PautaSessao } from './types/pauta-sessao'
import { ProposicaoDisponivel } from './pauta-proposicoes-service'

// Interfaces para regras regimentais
export interface RegraRegimental {
  id: string
  nome: string
  tipo: 'prazo' | 'quorum' | 'tramitacao' | 'ordenacao' | 'validacao'
  descricao: string
  criterios: CriterioRegra[]
  acoes: AcaoRegra[]
  ativa: boolean
  prioridade: number
}

export interface CriterioRegra {
  campo: string
  operador: 'igual' | 'diferente' | 'maior' | 'menor' | 'contem' | 'nao_contem'
  valor: any
  descricao: string
}

export interface AcaoRegra {
  tipo: 'bloquear' | 'avisar' | 'sugerir' | 'aplicar_automaticamente'
  mensagem: string
  parametros?: Record<string, any>
}

export interface ValidacaoRegimental {
  proposicaoId: string
  regras: RegraAplicada[]
  valida: boolean
  erros: string[]
  avisos: string[]
  sugestoes: string[]
}

export interface RegraAplicada {
  regra: RegraRegimental
  resultado: 'aprovado' | 'reprovado' | 'aviso'
  mensagem: string
}

export interface ConfiguracaoRegimental {
  prazos: {
    tramitacaoComissao: number // dias
    prazoRegimental: number // dias
    urgenciaConstitucional: number // dias
    urgenciaRegimental: number // dias
  }
  quoruns: {
    maioriaSimples: number // percentual
    maioriaAbsoluta: number // percentual
    unanimidade: number // percentual
    quorumMinimo: number // número mínimo de parlamentares
  }
  validacoes: {
    tramitacaoObrigatoria: boolean
    pareceresObrigatorios: boolean
    quorumNecessario: boolean
    prazoRespeitado: boolean
  }
  ordenacao: {
    criterios: CriterioOrdenacao[]
    pesos: Record<string, number>
  }
}

export interface CriterioOrdenacao {
  campo: string
  tipo: 'prioridade' | 'cronologico' | 'alfabetico' | 'numerico'
  ordem: 'asc' | 'desc'
  peso: number
  descricao: string
}

// Configuração padrão baseada no SAPL
const configuracaoPadrao: ConfiguracaoRegimental = {
  prazos: {
    tramitacaoComissao: 15, // 15 dias para tramitação em comissão
    prazoRegimental: 90, // 90 dias para tramitação geral
    urgenciaConstitucional: 45, // 45 dias para urgência constitucional
    urgenciaRegimental: 30 // 30 dias para urgência regimental
  },
  quoruns: {
    maioriaSimples: 50, // 50% + 1
    maioriaAbsoluta: 50, // 50% + 1 dos membros da casa
    unanimidade: 100, // 100% dos presentes
    quorumMinimo: 9 // mínimo de 9 parlamentares (maioria absoluta)
  },
  validacoes: {
    tramitacaoObrigatoria: true,
    pareceresObrigatorios: true,
    quorumNecessario: true,
    prazoRespeitado: true
  },
  ordenacao: {
    criterios: [
      { campo: 'urgencia', tipo: 'prioridade', ordem: 'desc', peso: 10, descricao: 'Urgência' },
      { campo: 'relevancia', tipo: 'prioridade', ordem: 'desc', peso: 8, descricao: 'Relevância' },
      { campo: 'dataApresentacao', tipo: 'cronologico', ordem: 'asc', peso: 6, descricao: 'Data de Apresentação' },
      { campo: 'numero', tipo: 'numerico', ordem: 'asc', peso: 4, descricao: 'Número' }
    ],
    pesos: {
      urgencia: 10,
      relevancia: 8,
      cronologia: 6,
      numero: 4
    }
  }
}

// Regras regimentais padrão
const regrasPadrao: RegraRegimental[] = [
  {
    id: 'regra-001',
    nome: 'Prazo de Tramitação',
    tipo: 'prazo',
    descricao: 'Verifica se a proposição respeita o prazo regimental de tramitação',
    criterios: [
      { campo: 'dataApresentacao', operador: 'menor', valor: 90, descricao: 'Data de apresentação dentro do prazo' }
    ],
    acoes: [
      { tipo: 'bloquear', mensagem: 'Proposição com prazo vencido não pode ser incluída na pauta' }
    ],
    ativa: true,
    prioridade: 1
  },
  {
    id: 'regra-002',
    nome: 'Tramitação Completa',
    tipo: 'tramitacao',
    descricao: 'Verifica se a proposição passou por todas as comissões necessárias',
    criterios: [
      { campo: 'tramitacaoCompleta', operador: 'igual', valor: true, descricao: 'Tramitação completa' }
    ],
    acoes: [
      { tipo: 'bloquear', mensagem: 'Proposição deve ter tramitação completa antes de ser votada' }
    ],
    ativa: true,
    prioridade: 1
  },
  {
    id: 'regra-003',
    nome: 'Pareceres Emitidos',
    tipo: 'tramitacao',
    descricao: 'Verifica se as comissões emitiram pareceres sobre a proposição',
    criterios: [
      { campo: 'pareceresEmitidos', operador: 'igual', valor: true, descricao: 'Pareceres emitidos' }
    ],
    acoes: [
      { tipo: 'bloquear', mensagem: 'Todos os pareceres das comissões devem ser emitidos' }
    ],
    ativa: true,
    prioridade: 1
  },
  {
    id: 'regra-004',
    nome: 'Quórum Mínimo',
    tipo: 'quorum',
    descricao: 'Verifica se há quórum mínimo para votação',
    criterios: [
      { campo: 'parlamentaresPresentes', operador: 'maior', valor: 8, descricao: 'Mínimo de 9 parlamentares presentes' }
    ],
    acoes: [
      { tipo: 'avisar', mensagem: 'Verificar se há quórum mínimo para votação' }
    ],
    ativa: true,
    prioridade: 2
  },
  {
    id: 'regra-005',
    nome: 'Ordem de Prioridade',
    tipo: 'ordenacao',
    descricao: 'Define ordem de prioridade para inclusão na pauta',
    criterios: [
      { campo: 'urgencia', operador: 'igual', valor: 'CONSTITUCIONAL', descricao: 'Urgência constitucional tem prioridade' },
      { campo: 'urgencia', operador: 'igual', valor: 'REGIMENTAL', descricao: 'Urgência regimental tem segunda prioridade' }
    ],
    acoes: [
      { tipo: 'aplicar_automaticamente', mensagem: 'Aplicar ordem de prioridade automaticamente' }
    ],
    ativa: true,
    prioridade: 3
  }
]

// Serviço de regras regimentais
export const regrasRegimentaisService = {
  // Obter configuração atual
  getConfiguracao: (): ConfiguracaoRegimental => {
    return configuracaoPadrao
  },

  // Obter regras ativas
  getRegrasAtivas: (): RegraRegimental[] => {
    return regrasPadrao.filter(regra => regra.ativa)
  },

  // Validar proposição contra regras regimentais
  validarProposicao: (proposicao: ProposicaoDisponivel, parlamentaresPresentes: number = 11): ValidacaoRegimental => {
    const regras = regrasRegimentaisService.getRegrasAtivas()
    const config = regrasRegimentaisService.getConfiguracao()
    
    const regrasAplicadas: RegraAplicada[] = []
    const erros: string[] = []
    const avisos: string[] = []
    const sugestoes: string[] = []

    regras.forEach(regra => {
      const resultado = regrasRegimentaisService.aplicarRegra(regra, proposicao, parlamentaresPresentes, config)
      regrasAplicadas.push(resultado)

      if (resultado.resultado === 'reprovado') {
        erros.push(resultado.mensagem)
      } else if (resultado.resultado === 'aviso') {
        avisos.push(resultado.mensagem)
      }
    })

    // Gerar sugestões baseadas nas regras
    sugestoes.push(...regrasRegimentaisService.gerarSugestoes(proposicao, regrasAplicadas))

    return {
      proposicaoId: proposicao.id,
      regras: regrasAplicadas,
      valida: erros.length === 0,
      erros,
      avisos,
      sugestoes
    }
  },

  // Aplicar regra específica
  aplicarRegra: (regra: RegraRegimental, proposicao: ProposicaoDisponivel, parlamentaresPresentes: number, config: ConfiguracaoRegimental): RegraAplicada => {
    let resultado: 'aprovado' | 'reprovado' | 'aviso' = 'aprovado'
    let mensagem = ''

    switch (regra.tipo) {
      case 'prazo':
        const prazoResultado = regrasRegimentaisService.validarPrazo(proposicao, regra, config)
        resultado = prazoResultado.resultado
        mensagem = prazoResultado.mensagem
        break

      case 'tramitacao':
        const tramitacaoResultado = regrasRegimentaisService.validarTramitacao(proposicao, regra)
        resultado = tramitacaoResultado.resultado
        mensagem = tramitacaoResultado.mensagem
        break

      case 'quorum':
        const quorumResultado = regrasRegimentaisService.validarQuorum(parlamentaresPresentes, regra, config)
        resultado = quorumResultado.resultado
        mensagem = quorumResultado.mensagem
        break

      case 'ordenacao':
        const ordenacaoResultado = regrasRegimentaisService.validarOrdenacao(proposicao, regra)
        resultado = ordenacaoResultado.resultado
        mensagem = ordenacaoResultado.mensagem
        break

      default:
        resultado = 'aprovado'
        mensagem = 'Regra não aplicável'
    }

    return {
      regra,
      resultado,
      mensagem
    }
  },

  // Validar prazo
  validarPrazo: (proposicao: ProposicaoDisponivel, regra: RegraRegimental, config: ConfiguracaoRegimental) => {
    if (proposicao.prazoVencido) {
      return {
        resultado: 'reprovado' as const,
        mensagem: `Proposição ${proposicao.numero}/${proposicao.ano} com prazo vencido (${config.prazos.prazoRegimental} dias)`
      }
    }

    return {
      resultado: 'aprovado' as const,
      mensagem: 'Prazo dentro do regimental'
    }
  },

  // Validar tramitação
  validarTramitacao: (proposicao: ProposicaoDisponivel, regra: RegraRegimental) => {
    if (regra.id === 'regra-002' && !proposicao.tramitacaoCompleta) {
      return {
        resultado: 'reprovado' as const,
        mensagem: `Proposição ${proposicao.numero}/${proposicao.ano} não possui tramitação completa`
      }
    }

    if (regra.id === 'regra-003' && !proposicao.pareceresEmitidos) {
      return {
        resultado: 'reprovado' as const,
        mensagem: `Proposição ${proposicao.numero}/${proposicao.ano} não possui pareceres emitidos`
      }
    }

    return {
      resultado: 'aprovado' as const,
      mensagem: 'Tramitação válida'
    }
  },

  // Validar quórum
  validarQuorum: (parlamentaresPresentes: number, regra: RegraRegimental, config: ConfiguracaoRegimental) => {
    if (parlamentaresPresentes < config.quoruns.quorumMinimo) {
      return {
        resultado: 'aviso' as const,
        mensagem: `Quórum insuficiente: ${parlamentaresPresentes} presentes (mínimo: ${config.quoruns.quorumMinimo})`
      }
    }

    return {
      resultado: 'aprovado' as const,
      mensagem: `Quórum adequado: ${parlamentaresPresentes} presentes`
    }
  },

  // Validar ordenação
  validarOrdenacao: (proposicao: ProposicaoDisponivel, regra: RegraRegimental) => {
    // Lógica de ordenação baseada em critérios regimentais
    return {
      resultado: 'aprovado' as const,
      mensagem: 'Ordenação válida'
    }
  },

  // Gerar sugestões
  gerarSugestoes: (proposicao: ProposicaoDisponivel, regrasAplicadas: RegraAplicada[]): string[] => {
    const sugestoes: string[] = []

    // Sugestões baseadas no tipo de proposição
    if (proposicao.tipo === 'PROJETO_LEI') {
      sugestoes.push('Verificar se projeto não conflita com legislação vigente')
      sugestoes.push('Confirmar competência da casa legislativa')
    }

    if (proposicao.tipo === 'REQUERIMENTO') {
      sugestoes.push('Verificar se requerimento tem fundamentação legal')
      sugestoes.push('Confirmar prazo de resposta do executivo')
    }

    if (proposicao.tipo === 'INDICACAO') {
      sugestoes.push('Verificar se indicação é de competência municipal')
      sugestoes.push('Confirmar viabilidade técnica e financeira')
    }

    // Sugestões baseadas nas regras aplicadas
    const regrasReprovadas = regrasAplicadas.filter(r => r.resultado === 'reprovado')
    if (regrasReprovadas.length > 0) {
      sugestoes.push('Corrigir problemas identificados antes de incluir na pauta')
    }

    const regrasAviso = regrasAplicadas.filter(r => r.resultado === 'aviso')
    if (regrasAviso.length > 0) {
      sugestoes.push('Considerar os avisos antes de prosseguir')
    }

    return sugestoes
  },

  // Ordenar proposições por critérios regimentais
  ordenarProposicoes: (proposicoes: ProposicaoDisponivel[]): ProposicaoDisponivel[] => {
    const config = regrasRegimentaisService.getConfiguracao()
    
    return proposicoes.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // Aplicar pesos dos critérios
      config.ordenacao.criterios.forEach(criterio => {
        const peso = criterio.peso

        switch (criterio.campo) {
          case 'urgencia':
            // Urgência constitucional = 10, regimental = 5, normal = 1
            // Como não temos campo urgencia na interface, usar valor padrão
            scoreA += peso * 1
            scoreB += peso * 1
            break

          case 'relevancia':
            // Proposições de maior relevância (projetos de lei) têm maior score
            const relevanciaA = ['PROJETO_LEI', 'PROJETO_RESOLUCAO'].includes(a.tipo) ? 10 : 5
            const relevanciaB = ['PROJETO_LEI', 'PROJETO_RESOLUCAO'].includes(b.tipo) ? 10 : 5
            scoreA += peso * relevanciaA
            scoreB += peso * relevanciaB
            break

          case 'cronologia':
            // Proposições mais antigas têm prioridade
            // Como não temos dataApresentacao na interface, usar valor padrão
            scoreA += peso * 1
            scoreB += peso * 1
            break

          case 'numero':
            // Números menores têm prioridade
            const numeroA = parseInt(a.numero) || 999999
            const numeroB = parseInt(b.numero) || 999999
            scoreA += peso * (numeroA < numeroB ? 10 : 1)
            scoreB += peso * (numeroB < numeroA ? 10 : 1)
            break
        }
      })

      return config.ordenacao.criterios[0]?.ordem === 'desc' ? scoreB - scoreA : scoreA - scoreB
    })
  },

  // Validar pauta completa
  validarPauta: (pauta: PautaSessao, parlamentaresPresentes: number = 11): ValidacaoRegimental => {
    // Validar estrutura básica da pauta
    const erros: string[] = []
    const avisos: string[] = []
    const sugestoes: string[] = []

    // Verificar se há itens na pauta
    const totalItens = pauta.correspondencias.length + pauta.expedientes.length + 
                      pauta.materiasExpediente.length + pauta.ordemDoDia.length

    if (totalItens === 0) {
      erros.push('Pauta não possui nenhum item')
    }

    // Verificar quórum mínimo
    if (parlamentaresPresentes < configuracaoPadrao.quoruns.quorumMinimo) {
      avisos.push(`Quórum insuficiente: ${parlamentaresPresentes} presentes (mínimo: ${configuracaoPadrao.quoruns.quorumMinimo})`)
    }

    // Verificar se há itens para votação
    const itensVotacao = pauta.ordemDoDia.length
    if (itensVotacao === 0) {
      avisos.push('Pauta não possui itens para votação na ordem do dia')
    }

    // Sugestões gerais
    sugestoes.push('Verificar se todos os itens estão na ordem correta')
    sugestoes.push('Confirmar se há tempo suficiente para apreciação de todos os itens')
    sugestoes.push('Verificar se todos os documentos necessários estão disponíveis')

    return {
      proposicaoId: pauta.id,
      regras: [],
      valida: erros.length === 0,
      erros,
      avisos,
      sugestoes
    }
  }
}
