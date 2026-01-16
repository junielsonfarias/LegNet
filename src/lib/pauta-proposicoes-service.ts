// Serviço de integração entre pautas e proposições baseado no SAPL
import { PautaSessao } from './types/pauta-sessao'
import { proposicoesService } from './proposicoes-service'

// Interfaces para integração
export interface ProposicaoDisponivel {
  id: string
  numero: string
  ano: number
  tipo: string
  ementa: string
  autor: string
  coautores?: string[]
  status: string
  tramitacaoCompleta: boolean
  pareceresEmitidos: boolean
  prazoVencido: boolean
  podeIncluirEmPauta: boolean
  motivoBloqueio?: string
  secaoSugerida: 'expediente' | 'ordemDoDia'
}

export interface ValidacaoVinculacao {
  proposicaoId: string
  secao: 'expediente' | 'ordemDoDia'
  valida: boolean
  erros: string[]
  avisos: string[]
  sugestoes: string[]
}

export interface FiltrosProposicao {
  tipo?: string[]
  status?: string[]
  comissao?: string[]
  dataInicio?: string
  dataFim?: string
  tramitacaoCompleta?: boolean
  pareceresEmitidos?: boolean
  prazoVencido?: boolean
  secao?: 'expediente' | 'ordemDoDia'
  termo?: string
  apenasRecentes?: boolean
}

export interface ConfigVinculacao {
  validarTramitacao: boolean
  validarPareceres: boolean
  validarPrazos: boolean
  permitirUrgencia: boolean
  quorumMinimo?: number
}

// Serviço de integração
export const pautaProposicoesService = {
  // Buscar proposições disponíveis para inclusão em pauta
  buscarProposicoesDisponiveis: (filtros: FiltrosProposicao = {}): ProposicaoDisponivel[] => {
    const proposicoes = proposicoesService.getAll()
    
    return proposicoes
      .map(proposicao => {
        const tramitacaoCompleta = pautaProposicoesService.validarTramitacaoCompleta(proposicao)
        const pareceresEmitidos = pautaProposicoesService.validarPareceresEmitidos(proposicao)
        const prazoVencido = pautaProposicoesService.validarPrazoVencido(proposicao)
        const podeIncluirEmPauta = pautaProposicoesService.podeIncluirEmPauta(proposicao)
        
        return {
          id: proposicao.id,
          numero: proposicao.numero,
          ano: new Date(proposicao.dataApresentacao).getFullYear(),
          tipo: proposicao.tipo,
          ementa: proposicao.ementa || '',
          autor: proposicao.autorId,
          coautores: proposicao.autores.filter(id => id !== proposicao.autorId),
          status: proposicao.status,
          tramitacaoCompleta,
          pareceresEmitidos,
          prazoVencido,
          podeIncluirEmPauta,
          motivoBloqueio: podeIncluirEmPauta ? undefined : pautaProposicoesService.getMotivoBloqueio(proposicao),
          secaoSugerida: pautaProposicoesService.getSecaoSugerida(proposicao)
        }
      })
      .filter(proposicao => {
        // Aplicar filtros
        if (filtros.tipo && !filtros.tipo.includes(proposicao.tipo)) return false
        if (filtros.status && !filtros.status.includes(proposicao.status)) return false
        if (filtros.tramitacaoCompleta !== undefined && proposicao.tramitacaoCompleta !== filtros.tramitacaoCompleta) return false
        if (filtros.pareceresEmitidos !== undefined && proposicao.pareceresEmitidos !== filtros.pareceresEmitidos) return false
        if (filtros.prazoVencido !== undefined && proposicao.prazoVencido !== filtros.prazoVencido) return false
        if (filtros.secao && proposicao.secaoSugerida !== filtros.secao) return false
        if (filtros.termo && !proposicao.ementa.toLowerCase().includes(filtros.termo.toLowerCase())) return false
        
        return true
      })
  },

  // Validar se proposição pode ser vinculada à pauta
  validarVinculacao: (proposicaoId: string, secao: 'expediente' | 'ordemDoDia', config: ConfigVinculacao = {
    validarTramitacao: true,
    validarPareceres: true,
    validarPrazos: true,
    permitirUrgencia: false
  }): ValidacaoVinculacao => {
    const proposicao = proposicoesService.getById(proposicaoId)
    if (!proposicao) {
      return {
        proposicaoId,
        secao,
        valida: false,
        erros: ['Proposição não encontrada'],
        avisos: [],
        sugestoes: []
      }
    }

    const erros: string[] = []
    const avisos: string[] = []
    const sugestoes: string[] = []

    // Validações obrigatórias
    if (config.validarTramitacao && !pautaProposicoesService.validarTramitacaoCompleta(proposicao)) {
      erros.push('Proposição não possui tramitação completa')
    }

    if (config.validarPareceres && !pautaProposicoesService.validarPareceresEmitidos(proposicao)) {
      erros.push('Proposição não possui pareceres emitidos')
    }

    if (config.validarPrazos && pautaProposicoesService.validarPrazoVencido(proposicao)) {
      erros.push('Proposição com prazo vencido')
    }

    // Validações específicas por seção
    if (secao === 'ordemDoDia') {
      if (!['PROJETO_LEI', 'PROJETO_RESOLUCAO', 'PROJETO_DECRETO'].includes(proposicao.tipo)) {
        avisos.push('Tipo de proposição não usual para Ordem do Dia')
      }
    }

    if (secao === 'expediente') {
      if (!['REQUERIMENTO', 'INDICACAO', 'MOCAO'].includes(proposicao.tipo)) {
        avisos.push('Tipo de proposição não usual para Expediente')
      }
    }

    // Sugestões
    if (proposicao.status === 'em_tramitacao') {
      sugestoes.push('Verificar se tramitação está completa antes da votação')
    }

    if (proposicao.tramitacoes && proposicao.tramitacoes.length > 0) {
      const ultimaTramitacao = proposicao.tramitacoes[proposicao.tramitacoes.length - 1]
      if (ultimaTramitacao.data) {
        const diasDesdeUltimaTramitacao = Math.floor((Date.now() - new Date(ultimaTramitacao.data).getTime()) / (1000 * 60 * 60 * 24))
        if (diasDesdeUltimaTramitacao > 30) {
          sugestoes.push('Proposição sem movimentação há mais de 30 dias')
        }
      }
    }

    return {
      proposicaoId,
      secao,
      valida: erros.length === 0,
      erros,
      avisos,
      sugestoes
    }
  },

  // Vincular proposição à pauta
  vincularProposicao: (pautaId: string, proposicaoId: string, secao: 'expediente' | 'ordemDoDia'): boolean => {
    const proposicao = proposicoesService.getById(proposicaoId)
    if (!proposicao) return false

    // Validar vinculação
    const validacao = pautaProposicoesService.validarVinculacao(proposicaoId, secao)
    if (!validacao.valida) return false

    // Criar item da pauta baseado na proposição
    if (secao === 'expediente') {
      const itemExpediente = {
        tipo: pautaProposicoesService.mapearTipoExpediente(proposicao.tipo),
        numeroMateria: `${proposicao.numero}/${new Date(proposicao.dataApresentacao).getFullYear()}`,
        autor: proposicao.autorId,
        coautores: proposicao.autores.filter(id => id !== proposicao.autorId),
        ementa: proposicao.ementa,
        textoCompleto: proposicao.texto,
        status: 'PENDENTE' as const,
        turno: 'DELIBERAÇÃO' as const,
        observacoes: `Vinculada automaticamente da proposição ${proposicao.id}`
      }

      // Usar o serviço de pautas para adicionar o item
      const { pautasSessoesService } = require('./pautas-sessoes-service')
      return pautasSessoesService.addMateriaExpediente(pautaId, itemExpediente) !== undefined
    }

    if (secao === 'ordemDoDia') {
      const itemOrdemDoDia = {
        tipo: pautaProposicoesService.mapearTipoOrdemDoDia(proposicao.tipo),
        numeroMateria: `${proposicao.numero}/${new Date(proposicao.dataApresentacao).getFullYear()}`,
        processo: `${proposicao.numero}/${new Date(proposicao.dataApresentacao).getFullYear()}`,
        autor: proposicao.autorId,
        coautores: proposicao.autores.filter(id => id !== proposicao.autorId),
        ementa: proposicao.ementa,
        textoCompleto: proposicao.texto,
        status: 'PENDENTE' as const,
        turno: 'PRIMEIRO' as const,
        quorumVotacao: 'MAIORIA_SIMPLES' as const,
        observacoes: `Vinculada automaticamente da proposição ${proposicao.id}`
      }

      const { pautasSessoesService } = require('./pautas-sessoes-service')
      return pautasSessoesService.addOrdemDoDia(pautaId, itemOrdemDoDia) !== undefined
    }

    return false
  },

  // Validar tramitação completa
  validarTramitacaoCompleta: (proposicao: any): boolean => {
    if (!proposicao.tramitacoes || proposicao.tramitacoes.length === 0) return false
    
    // Verificar se passou por todas as comissões necessárias
    const comissoesNecessarias = ['Comissão de Constituição e Justiça', 'Comissão de Legislação', 'Comissão de Finanças']
    const comissoesVisitadas = new Set(proposicao.tramitacoes.map((t: any) => t.unidade))
    
    return comissoesNecessarias.every(comissao => comissoesVisitadas.has(comissao))
  },

  // Validar pareceres emitidos
  validarPareceresEmitidos: (proposicao: any): boolean => {
    if (!proposicao.tramitacoes || proposicao.tramitacoes.length === 0) return false
    
    // Verificar se todas as comissões emitiram parecer
    const tramitacoesComParecer = proposicao.tramitacoes.filter((t: any) => t.parecer)
    return tramitacoesComParecer.length >= proposicao.tramitacoes.length * 0.8 // 80% das tramitações com parecer
  },

  // Validar prazo vencido
  validarPrazoVencido: (proposicao: any): boolean => {
    if (!proposicao.dataApresentacao) return false
    
    const dataApresentacao = new Date(proposicao.dataApresentacao)
    const prazoLimite = new Date(dataApresentacao.getTime() + (90 * 24 * 60 * 60 * 1000)) // 90 dias
    
    return new Date() > prazoLimite
  },

  // Verificar se pode incluir em pauta
  podeIncluirEmPauta: (proposicao: any): boolean => {
    // Regras básicas para todas as proposições
    if (proposicao.status !== 'em_tramitacao') return false
    if (pautaProposicoesService.validarPrazoVencido(proposicao)) return false

    // Regras específicas por tipo de proposição
    switch (proposicao.tipo) {
      case 'requerimento':
        // Requerimentos podem ir para pauta imediatamente após apresentação
        // ou após tramitação básica (dependendo da complexidade)
        return pautaProposicoesService.validarRequerimentoParaPauta(proposicao)
      
      case 'indicacao':
        // Indicações podem ir para pauta após tramitação simples
        return pautaProposicoesService.validarIndicacaoParaPauta(proposicao)
      
      case 'moção':
        // Moções podem ir para pauta após tramitação simples
        return pautaProposicoesService.validarMocaoParaPauta(proposicao)
      
      case 'projeto_lei':
      case 'projeto_resolucao':
      case 'projeto_decreto':
        // Projetos precisam de tramitação completa
        return pautaProposicoesService.validarTramitacaoCompleta(proposicao) &&
               pautaProposicoesService.validarPareceresEmitidos(proposicao)
      
      default:
        // Para outros tipos, usar regras básicas
        return pautaProposicoesService.validarTramitacaoCompleta(proposicao)
    }
  },

  // Validar requerimento para pauta
  validarRequerimentoParaPauta: (proposicao: any): boolean => {
    // Requerimentos simples podem ir para pauta imediatamente
    if (!proposicao.tramitacoes || proposicao.tramitacoes.length === 0) {
      // Se não tem tramitações, pode ir para pauta se foi apresentado há pelo menos 1 dia
      const dataApresentacao = new Date(proposicao.dataApresentacao)
      const umDiaAtras = new Date(Date.now() - (24 * 60 * 60 * 1000))
      return dataApresentacao <= umDiaAtras
    }

    // Se tem tramitações, verificar se passou pela mesa diretora
    const passouMesaDiretora = proposicao.tramitacoes.some((t: any) => 
      t.unidade === 'Mesa Diretora' || t.unidade === 'Mesa Diretora'
    )

    return passouMesaDiretora
  },

  // Validar indicação para pauta
  validarIndicacaoParaPauta: (proposicao: any): boolean => {
    // Indicações podem ir para pauta após tramitação simples
    if (!proposicao.tramitacoes || proposicao.tramitacoes.length === 0) {
      const dataApresentacao = new Date(proposicao.dataApresentacao)
      const tresDiasAtras = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000))
      return dataApresentacao <= tresDiasAtras
    }

    // Verificar se passou pela mesa diretora ou comissão simples
    const passouTramitacaoBasica = proposicao.tramitacoes.some((t: any) => 
      t.unidade === 'Mesa Diretora' || 
      t.unidade === 'Comissão de Constituição e Justiça'
    )

    return passouTramitacaoBasica
  },

  // Validar moção para pauta
  validarMocaoParaPauta: (proposicao: any): boolean => {
    // Moções podem ir para pauta após tramitação simples
    if (!proposicao.tramitacoes || proposicao.tramitacoes.length === 0) {
      const dataApresentacao = new Date(proposicao.dataApresentacao)
      const doisDiasAtras = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000))
      return dataApresentacao <= doisDiasAtras
    }

    // Verificar se passou pela mesa diretora
    const passouMesaDiretora = proposicao.tramitacoes.some((t: any) => 
      t.unidade === 'Mesa Diretora'
    )

    return passouMesaDiretora
  },

  // Obter motivo de bloqueio
  getMotivoBloqueio: (proposicao: any): string => {
    if (proposicao.status !== 'em_tramitacao') return 'Proposição não está em tramitação'
    if (pautaProposicoesService.validarPrazoVencido(proposicao)) return 'Prazo vencido'
    
    // Motivos específicos por tipo
    switch (proposicao.tipo) {
      case 'requerimento':
        if (!pautaProposicoesService.validarRequerimentoParaPauta(proposicao)) {
          return 'Requerimento precisa ser protocolado há pelo menos 1 dia'
        }
        break
      case 'indicacao':
        if (!pautaProposicoesService.validarIndicacaoParaPauta(proposicao)) {
          return 'Indicação precisa passar por tramitação básica'
        }
        break
      case 'moção':
        if (!pautaProposicoesService.validarMocaoParaPauta(proposicao)) {
          return 'Moção precisa ser protocolada há pelo menos 2 dias'
        }
        break
      case 'projeto_lei':
      case 'projeto_resolucao':
      case 'projeto_decreto':
        if (!pautaProposicoesService.validarTramitacaoCompleta(proposicao)) {
          return 'Projeto precisa de tramitação completa'
        }
        if (!pautaProposicoesService.validarPareceresEmitidos(proposicao)) {
          return 'Projeto precisa de pareceres das comissões'
        }
        break
      default:
        if (!pautaProposicoesService.validarTramitacaoCompleta(proposicao)) {
          return 'Tramitação incompleta'
        }
    }
    
    return 'Não pode ser incluída em pauta'
  },

  // Obter seção sugerida
  getSecaoSugerida: (proposicao: any): 'expediente' | 'ordemDoDia' => {
    const tiposExpediente = ['requerimento', 'indicacao', 'moção', 'voto_pesar', 'voto_aplauso']
    return tiposExpediente.includes(proposicao.tipo) ? 'expediente' : 'ordemDoDia'
  },

  // Mapear tipo para expediente
  mapearTipoExpediente: (tipo: string): string => {
    const mapeamento: Record<string, string> = {
      'requerimento': 'REQUERIMENTO',
      'indicacao': 'INDICACAO',
      'moção': 'MOÇÃO',
      'voto_pesar': 'VOTO_PESAR',
      'voto_aplauso': 'VOTO_APLAUSO',
      'outros': 'OUTROS'
    }
    return mapeamento[tipo] || 'OUTROS'
  },

  // Mapear tipo para ordem do dia
  mapearTipoOrdemDoDia: (tipo: string): string => {
    const mapeamento: Record<string, string> = {
      'projeto_lei': 'PROJETO_LEI',
      'projeto_lei_complementar': 'PROJETO_LEI_COMPLEMENTAR',
      'projeto_resolucao': 'PROJETO_RESOLUCAO',
      'projeto_decreto': 'PROJETO_DECRETO',
      'moção': 'MOÇÃO',
      'outros': 'OUTROS'
    }
    return mapeamento[tipo] || 'OUTROS'
  },

  // Obter proposições recém-disponíveis para pauta
  getProposicoesRecemDisponiveis: (diasRecentes: number = 7): ProposicaoDisponivel[] => {
    const proposicoesDisponiveis = pautaProposicoesService.buscarProposicoesDisponiveis()
    const dataLimite = new Date(Date.now() - (diasRecentes * 24 * 60 * 60 * 1000))
    
    return proposicoesDisponiveis.filter(proposicao => {
      const proposicaoOriginal = proposicoesService.getById(proposicao.id)
      if (!proposicaoOriginal) return false
      
      // Verificar se ficou disponível recentemente
      const dataApresentacao = new Date(proposicaoOriginal.dataApresentacao)
      
      // Se é requerimento e foi apresentado recentemente
      if (proposicaoOriginal.tipo === 'requerimento' && dataApresentacao >= dataLimite) {
        return true
      }
      
      // Se tem tramitações recentes
      if (proposicaoOriginal.tramitacoes && proposicaoOriginal.tramitacoes.length > 0) {
        const ultimaTramitacao = proposicaoOriginal.tramitacoes[proposicaoOriginal.tramitacoes.length - 1]
        const dataUltimaTramitacao = new Date(ultimaTramitacao.data)
        return dataUltimaTramitacao >= dataLimite
      }
      
      return false
    })
  },

  // Verificar se proposição ficou disponível para pauta hoje
  verificarDisponibilidadeHoje: (proposicaoId: string): boolean => {
    const proposicao = proposicoesService.getById(proposicaoId)
    if (!proposicao) return false
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    // Verificar se foi apresentada hoje e é requerimento
    if (proposicao.tipo === 'requerimento') {
      const dataApresentacao = new Date(proposicao.dataApresentacao)
      dataApresentacao.setHours(0, 0, 0, 0)
      
      if (dataApresentacao.getTime() === hoje.getTime()) {
        return true
      }
    }
    
    // Verificar se teve tramitação hoje
    if (proposicao.tramitacoes && proposicao.tramitacoes.length > 0) {
      const ultimaTramitacao = proposicao.tramitacoes[proposicao.tramitacoes.length - 1]
      const dataUltimaTramitacao = new Date(ultimaTramitacao.data)
      dataUltimaTramitacao.setHours(0, 0, 0, 0)
      
      if (dataUltimaTramitacao.getTime() === hoje.getTime()) {
        return pautaProposicoesService.podeIncluirEmPauta(proposicao)
      }
    }
    
    return false
  },

  // Obter estatísticas de proposições disponíveis
  getStatsProposicoesDisponiveis: () => {
    const proposicoes = proposicoesService.getAll()
    
    const stats = {
      total: proposicoes.length,
      expediente: 0,
      ordemDoDia: 0,
      tramitacaoCompleta: 0,
      pareceresEmitidos: 0,
      prazoVencido: 0,
      podeIncluir: 0,
      recemDisponiveis: 0
    }

    proposicoes.forEach(proposicao => {
      const tramitacaoCompleta = pautaProposicoesService.validarTramitacaoCompleta(proposicao)
      const pareceresEmitidos = pautaProposicoesService.validarPareceresEmitidos(proposicao)
      const prazoVencido = pautaProposicoesService.validarPrazoVencido(proposicao)
      const podeIncluir = pautaProposicoesService.podeIncluirEmPauta(proposicao)
      const secaoSugerida = pautaProposicoesService.getSecaoSugerida(proposicao)
      const recemDisponivel = pautaProposicoesService.verificarDisponibilidadeHoje(proposicao.id)

      if (tramitacaoCompleta) stats.tramitacaoCompleta++
      if (pareceresEmitidos) stats.pareceresEmitidos++
      if (prazoVencido) stats.prazoVencido++
      if (podeIncluir) stats.podeIncluir++
      if (secaoSugerida === 'expediente') stats.expediente++
      if (secaoSugerida === 'ordemDoDia') stats.ordemDoDia++
      if (recemDisponivel) stats.recemDisponiveis++
    })

    return stats
  }
}
