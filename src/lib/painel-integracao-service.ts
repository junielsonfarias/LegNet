// @ts-nocheck
/**
 * @deprecated Este serviço usa DADOS MOCKADOS e NÃO deve ser usado em produção.
 * Use o serviço painel-tempo-real-service.ts que usa Prisma e dados reais do banco.
 *
 * TODO: Remover este arquivo após confirmar que não está mais em uso.
 */

// Serviço de integração entre painel administrativo e painel eletrônico
// Conecta dados de sessões, parlamentares, pautas e votações

import { databaseService, type Sessao, type Proposicao, type Votacao, type PresencaSessao } from './database-service'
import { parlamentaresService, type Parlamentar } from './parlamentares-data'
import { 
  painelEletronicoService, 
  type PainelSessao, 
  type PautaItem, 
  type Presenca,
  type Votacao as VotacaoPainel,
  type VotoIndividual 
} from './painel-eletronico-service'

// Interface para integração de dados
export interface IntegracaoPainel {
  // Sessões integradas
  sessoes: PainelSessao[]
  
  // Parlamentares com presença
  parlamentares: (Parlamentar & { presente: boolean; ausente: boolean; justificada: boolean })[]
  
  // Pauta integrada
  pauta: PautaItem[]
  
  // Votações ativas
  votacoes: VotacaoPainel[]
  
  // Estatísticas
  estatisticas: {
    totalParlamentares: number
    presentes: number
    ausentes: number
    sessoesAtivas: number
    votacoesEmAndamento: number
  }
}

class PainelIntegracaoService {
  
  // Converte sessão do admin para formato do painel eletrônico
  private converterSessaoParaPainel(sessao: Sessao): PainelSessao {
    const parlamentarPresidente = parlamentaresService.getByCargo('PRESIDENTE')[0]
    const parlamentarSecretario = parlamentaresService.getByCargo('VICE_PRESIDENTE')[0] || parlamentaresService.getByCargo('PRESIDENTE')[0]
    
    return {
      id: sessao.id,
      numeroSessao: `${sessao.numero.toString().padStart(3, '0')}/${new Date(sessao.data).getFullYear()}`,
      tipo: sessao.tipo.toLowerCase() as 'ordinaria' | 'extraordinaria' | 'solene' | 'especial',
      data: new Date(sessao.data),
      horarioInicio: sessao.horario,
      horarioFim: this.calcularHorarioFim(sessao.horario),
      status: this.converterStatusSessao(sessao.status),
      presidente: parlamentarPresidente?.nome || 'Presidente não definido',
      secretario: parlamentarSecretario?.nome || 'Secretário não definido',
      local: 'Plenário da Câmara Municipal',
      transmissao: {
        ativa: sessao.status === 'EM_ANDAMENTO',
        url: 'https://youtube.com/watch?v=exemplo',
        plataforma: 'youtube'
      },
      informacoes: {
        totalItens: (sessao as any).proposicoes?.length || 0,
        itemAtual: (sessao as any).proposicoes?.findIndex((p: any) => p.status === 'EM_TRAMITACAO') || 0,
        tempoEstimado: this.calcularTempoEstimado((sessao as any).proposicoes || [])
      }
    }
  }

  // Converte proposição para item de pauta
  private converterProposicaoParaPauta(proposicao: Proposicao, ordem: number): PautaItem {
    const autor = parlamentaresService.getById(proposicao.autorId)
    
    return {
      id: proposicao.id,
      ordem,
      tipo: this.converterTipoProposicao(proposicao.tipo),
      titulo: `${proposicao.tipo.replace('_', ' ')} ${proposicao.numero}/${proposicao.ano} - ${proposicao.titulo}`,
      descricao: proposicao.ementa,
      autor: autor?.nome || 'Autor não identificado',
      tipoProposicao: proposicao.tipo as any,
      numeroProposicao: proposicao.numero,
      prioridade: this.definirPrioridade(proposicao),
      tempoEstimado: this.calcularTempoProposicao(proposicao),
      status: this.converterStatusProposicao(proposicao.status),
      observacoes: proposicao.observacoes || '',
      anexos: proposicao.anexos || [],
      votacao: proposicao.votacoes.length > 0 ? {
        emAndamento: proposicao.status === 'EM_TRAMITACAO',
        resultado: this.converterResultadoVotacao(proposicao.resultado),
        votos: this.calcularVotos(proposicao.votacoes),
        detalhes: this.converterVotosDetalhados(proposicao.votacoes)
      } : undefined
    }
  }

  // Converte presença do admin para formato do painel
  private converterPresencaParaPainel(presencas: PresencaSessao[]): Presenca[] {
    const parlamentares = parlamentaresService.getAll()
    
    return parlamentares.map(parlamentar => {
      const presenca = presencas.find(p => p.parlamentarId === parlamentar.id)
      
      return {
        id: presenca?.id || `presenca-${parlamentar.id}`,
        parlamentarId: parlamentar.id,
        parlamentarNome: parlamentar.nome,
        parlamentarPartido: parlamentar.partido,
        presente: presenca?.presente || false,
        ausente: presenca ? !presenca.presente : true,
        justificada: presenca?.justificativa ? true : false,
        horarioEntrada: presenca?.presente ? new Date(presenca.createdAt) : null,
        justificativa: presenca?.justificativa || null
      }
    })
  }

  // Obtém dados integrados para o painel eletrônico
  async getDadosIntegrados(sessaoId?: string): Promise<IntegracaoPainel> {
    try {
      // Busca sessões
      const sessoesAdmin = sessaoId 
        ? [databaseService.getSessaoById(sessaoId)]
        : databaseService.getSessoes()
      
      // Filtra apenas sessões ativas
      const sessoesAtivas = sessoesAdmin.filter(s => 
        s.status === 'EM_ANDAMENTO' || s.status === 'AGENDADA'
      )
      
      // Converte para formato do painel
      const sessoesPainel = sessoesAtivas.map(s => this.converterSessaoParaPainel(s))
      
      // Busca parlamentares
      const parlamentares = parlamentaresService.getAll()
      
      // Busca presenças da sessão ativa
      const sessaoAtiva = sessoesAtivas.find(s => s.status === 'EM_ANDAMENTO')
      const presencas = sessaoAtiva ? this.converterPresencaParaPainel(sessaoAtiva.presencas) : []
      
      // Busca pauta da sessão ativa
      const pauta = sessaoAtiva 
        ? sessaoAtiva.proposicoes.map((p, index) => this.converterProposicaoParaPauta(p, index + 1))
        : []
      
      // Busca votações ativas
      const votacoes = sessaoAtiva 
        ? sessaoAtiva.proposicoes
            .filter(p => p.status === 'EM_TRAMITACAO' && p.votacoes.length > 0)
            .map(p => this.converterVotacaoParaPainel(p.votacoes[0]))
        : []
      
      // Calcula estatísticas
      const estatisticas = {
        totalParlamentares: parlamentares.length,
        presentes: presencas.filter(p => p.presente).length,
        ausentes: presencas.filter(p => !p.presente).length,
        sessoesAtivas: sessoesPainel.filter(s => s.status === 'em_andamento').length,
        votacoesEmAndamento: votacoes.filter(v => v.emAndamento).length
      }
      
      return {
        sessoes: sessoesPainel,
        parlamentares: parlamentares.map(p => {
          const presenca = presencas.find(pr => pr.parlamentarId === p.id)
          return {
            ...p,
            presente: presenca?.presente || false,
            ausente: presenca?.ausente || true,
            justificada: presenca?.justificada || false
          }
        }),
        pauta,
        votacoes,
        estatisticas
      }
      
    } catch (error) {
      console.error('Erro ao obter dados integrados:', error)
      throw error
    }
  }

  // Inicia uma sessão no painel eletrônico
  async iniciarSessao(sessaoId: string): Promise<PainelSessao> {
    try {
      const sessao = databaseService.getSessaoById(sessaoId)
      
      if (!sessao) {
        throw new Error(`Sessão com ID ${sessaoId} não encontrada`)
      }
      
      // Atualiza status da sessão
      databaseService.updateSessao(sessaoId, {
        ...sessao,
        status: 'EM_ANDAMENTO'
      })
      
      // Converte para formato do painel
      return this.converterSessaoParaPainel({
        ...sessao,
        status: 'EM_ANDAMENTO'
      })
      
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error)
      throw error
    }
  }

  // Finaliza uma sessão
  async finalizarSessao(sessaoId: string): Promise<void> {
    try {
      const sessao = await databaseService.getSessaoById(sessaoId)
      
      await databaseService.updateSessao(sessaoId, {
        ...sessao,
        status: 'CONCLUIDA'
      })
      
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error)
      throw error
    }
  }

  // Registra presença de parlamentar
  async registrarPresenca(parlamentarId: string, tipo: 'presente' | 'ausente' | 'justificada', justificativa?: string): Promise<void> {
    try {
      // Busca sessão ativa
      const sessoes = databaseService.getSessoes()
      const sessaoAtiva = sessoes.find(s => s.status === 'EM_ANDAMENTO')
      
      if (!sessaoAtiva) {
        throw new Error('Nenhuma sessão ativa encontrada')
      }

      const presente = tipo === 'presente'
      await databaseService.registrarPresenca(sessaoAtiva.id, parlamentarId, presente, justificativa)
    } catch (error) {
      console.error('Erro ao registrar presença:', error)
      throw error
    }
  }

  // Inicia votação de uma proposição
  async iniciarVotacao(proposicaoId: string): Promise<VotacaoPainel> {
    try {
      const proposicao = await databaseService.getProposicaoById(proposicaoId)
      
      // Cria nova votação
      const votacao = await databaseService.createVotacao({
        proposicaoId,
        tipo: 'NOMINAL',
        status: 'EM_ANDAMENTO',
        dataInicio: new Date().toISOString(),
        tempoLimite: 5 // 5 minutos
      })
      
      return this.converterVotacaoParaPainel(votacao)
      
    } catch (error) {
      console.error('Erro ao iniciar votação:', error)
      throw error
    }
  }

  // Registra voto individual
  async registrarVoto(votacaoId: string, parlamentarId: string, voto: 'SIM' | 'NAO' | 'ABSTENCAO'): Promise<void> {
    try {
      await databaseService.registrarVoto(votacaoId, parlamentarId, voto)
    } catch (error) {
      console.error('Erro ao registrar voto:', error)
      throw error
    }
  }

  // Finaliza votação
  async finalizarVotacao(votacaoId: string): Promise<void> {
    try {
      await databaseService.finalizarVotacao(votacaoId)
    } catch (error) {
      console.error('Erro ao finalizar votação:', error)
      throw error
    }
  }

  // Métodos auxiliares
  private converterStatusSessao(status: string): 'agendada' | 'em_andamento' | 'concluida' | 'cancelada' {
    const statusMap = {
      'AGENDADA': 'agendada',
      'EM_ANDAMENTO': 'em_andamento',
      'CONCLUIDA': 'concluida',
      'CANCELADA': 'cancelada'
    }
    return statusMap[status as keyof typeof statusMap] || 'agendada'
  }

  private converterStatusProposicao(status: string): 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO' | 'ADIADO' {
    const statusMap = {
      'APRESENTADA': 'PENDENTE',
      'EM_TRAMITACAO': 'EM_ANALISE',
      'APROVADA': 'APROVADO',
      'REJEITADA': 'REJEITADO',
      'ARQUIVADA': 'ADIADO'
    }
    return statusMap[status as keyof typeof statusMap] || 'PENDENTE'
  }

  private converterTipoProposicao(tipo: string): 'projeto_lei' | 'projeto_resolucao' | 'projeto_decreto' | 'indicacao' | 'requerimento' | 'mocao' | 'voto_pesar' | 'voto_aplauso' {
    return tipo.toLowerCase() as any
  }

  private converterResultadoVotacao(resultado?: string): 'APROVADO' | 'REJEITADO' | 'EMPATE' | undefined {
    if (!resultado) return undefined
    return resultado as 'APROVADO' | 'REJEITADO' | 'EMPATE'
  }

  private calcularHorarioFim(horarioInicio: string): string {
    const [hora, minuto] = horarioInicio.split(':').map(Number)
    const fim = new Date()
    fim.setHours(hora + 3, minuto, 0, 0) // 3 horas de duração padrão
    return fim.toTimeString().slice(0, 5)
  }

  private calcularTempoEstimado(proposicoes: Proposicao[]): number {
    return proposicoes.length * 15 // 15 minutos por proposição
  }

  private calcularTempoProposicao(proposicao: Proposicao): number {
    const base = 10 // 10 minutos base
    const complexidade = proposicao.ementa.length > 500 ? 10 : 5
    return base + complexidade
  }

  private definirPrioridade(proposicao: Proposicao): 'ALTA' | 'MEDIA' | 'BAIXA' {
    if (proposicao.tipo.includes('LEI') || proposicao.tipo.includes('DECRETO')) return 'ALTA'
    if (proposicao.tipo.includes('RESOLUCAO') || proposicao.tipo.includes('MOCAO')) return 'MEDIA'
    return 'BAIXA'
  }

  private calcularVotos(votacoes: Votacao[]): { sim: number; nao: number; abstencoes: number } {
    let sim = 0, nao = 0, abstencoes = 0
    
    votacoes.forEach(votacao => {
      votacao.votos.forEach(voto => {
        switch (voto.voto) {
          case 'SIM': sim++; break
          case 'NAO': nao++; break
          case 'ABSTENCAO': abstencoes++; break
        }
      })
    })
    
    return { sim, nao, abstencoes }
  }

  private converterVotosDetalhados(votacoes: Votacao[]): { parlamentarId: string; voto: 'SIM' | 'NAO' | 'ABSTENCAO' }[] {
    const detalhes: { parlamentarId: string; voto: 'SIM' | 'NAO' | 'ABSTENCAO' }[] = []
    
    votacoes.forEach(votacao => {
      votacao.votos.forEach(voto => {
        detalhes.push({
          parlamentarId: voto.parlamentarId,
          voto: voto.voto
        })
      })
    })
    
    return detalhes
  }

  private converterVotacaoParaPainel(votacao: Votacao): VotacaoPainel {
    return {
      id: votacao.id,
      proposicaoId: votacao.proposicaoId,
      tipo: votacao.tipo.toLowerCase() as 'nominal' | 'simbolica' | 'secreta',
      status: votacao.status.toLowerCase() as 'em_andamento' | 'concluida' | 'suspensa',
      dataInicio: new Date(votacao.dataInicio),
      dataFim: votacao.dataFim ? new Date(votacao.dataFim) : null,
      tempoLimite: votacao.tempoLimite || 5,
      resultado: this.converterResultadoVotacao(votacao.resultado),
      votos: {
        sim: votacao.votos.filter(v => v.voto === 'SIM').length,
        nao: votacao.votos.filter(v => v.voto === 'NAO').length,
        abstencoes: votacao.votos.filter(v => v.voto === 'ABSTENCAO').length
      },
      votosDetalhados: votacao.votos.map(v => ({
        parlamentarId: v.parlamentarId,
        voto: v.voto
      }))
    }
  }
}

// Exporta instância singleton
export const painelIntegracaoService = new PainelIntegracaoService()
