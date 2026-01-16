import { 
  ConfiguracaoNomenclatura, 
  SequenciaNumeracao, 
  TEMPLATE_PADRAO, 
  ELEMENTOS_PADRAO, 
  TIPOS_SESSAO_PADRAO 
} from './types/nomenclatura-sessoes'

// Configuração padrão
const configuracaoPadrao: ConfiguracaoNomenclatura = {
  id: 'config-padrao',
  nome: 'Configuração Padrão',
  descricao: 'Configuração padrão para nomenclatura de sessões legislativas',
  ativa: true,
  templateTitulo: TEMPLATE_PADRAO,
  configuracoes: {
    numeracaoSequencial: {
      habilitada: true,
      resetarPorAno: false,
      resetarPorLegislatura: true
    },
    periodosLegislatura: {
      quantidade: 4,
      nomenclatura: 'Período'
    },
    tiposSessao: TIPOS_SESSAO_PADRAO,
    elementosTemplate: ELEMENTOS_PADRAO
  },
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString()
}

// Sequências de numeração mock
let sequenciasNumeracao: SequenciaNumeracao[] = [
  {
    id: 'seq-ordinaria-2025',
    tipoSessao: 'ORDINARIA',
    legislatura: '15',
    ano: 2025,
    ultimoNumero: 15,
    proximoNumero: 16
  },
  {
    id: 'seq-extraordinaria-2025',
    tipoSessao: 'EXTRAORDINARIA',
    legislatura: '15',
    ano: 2025,
    ultimoNumero: 3,
    proximoNumero: 4
  },
  {
    id: 'seq-especial-2025',
    tipoSessao: 'ESPECIAL',
    legislatura: '15',
    ano: 2025,
    ultimoNumero: 1,
    proximoNumero: 2
  },
  {
    id: 'seq-solene-2025',
    tipoSessao: 'SOLENE',
    legislatura: '15',
    ano: 2025,
    ultimoNumero: 0,
    proximoNumero: 1
  }
]

class NomenclaturaSessoesService {
  private configuracao: ConfiguracaoNomenclatura = configuracaoPadrao

  // Configurações
  getConfiguracao(): ConfiguracaoNomenclatura {
    return this.configuracao
  }

  updateConfiguracao(configuracao: Partial<ConfiguracaoNomenclatura>): ConfiguracaoNomenclatura {
    this.configuracao = {
      ...this.configuracao,
      ...configuracao,
      atualizadaEm: new Date().toISOString()
    }
    return this.configuracao
  }

  // Sequências de numeração
  getSequenciaNumeracao(tipoSessao: string, legislatura: string, ano: number): SequenciaNumeracao | null {
    return sequenciasNumeracao.find(seq => 
      seq.tipoSessao === tipoSessao && 
      seq.legislatura === legislatura && 
      seq.ano === ano
    ) || null
  }

  getProximoNumeroSessao(tipoSessao: string, legislatura: string, ano: number): number {
    let sequencia = this.getSequenciaNumeracao(tipoSessao, legislatura, ano)
    
    if (!sequencia) {
      // Criar nova sequência
      sequencia = {
        id: `seq-${tipoSessao.toLowerCase()}-${ano}`,
        tipoSessao,
        legislatura,
        ano,
        ultimoNumero: 0,
        proximoNumero: 1
      }
      sequenciasNumeracao.push(sequencia)
    }

    const proximoNumero = sequencia.proximoNumero
    sequencia.ultimoNumero = proximoNumero
    sequencia.proximoNumero = proximoNumero + 1

    return proximoNumero
  }

  // Geração de título
  gerarTituloSessao(
    tipoSessao: string, 
    legislatura: string, 
    numeroSessao: number, 
    periodo?: number
  ): string {
    const config = this.getConfiguracao()
    const tipoSessaoConfig = config.configuracoes.tiposSessao.find(t => t.tipo === tipoSessao)
    const tipoNome = tipoSessaoConfig?.nome || 'Sessão'
    
    let titulo = config.templateTitulo
    
    // Substituir placeholders
    titulo = titulo.replace('{{numero_sessao}}', this.formatarNumeroOrdinal(numeroSessao))
    titulo = titulo.replace('{{tipo_sessao}}', tipoNome)
    titulo = titulo.replace('{{legislatura}}', legislatura)
    
    if (periodo) {
      titulo = titulo.replace('{{periodo}}', this.formatarPeriodo(periodo))
    } else {
      titulo = titulo.replace(' do {{periodo}}', '').replace(' do {{periodo}}', '')
    }
    
    return titulo
  }

  private formatarNumeroOrdinal(numero: number): string {
    const sufixos = ['', 'ª', 'ª', 'ª', 'ª', 'ª', 'ª', 'ª', 'ª', 'ª']
    return numero + sufixos[numero % 10] || 'ª'
  }

  private formatarPeriodo(periodo: number): string {
    const config = this.getConfiguracao()
    const nomenclatura = config.configuracoes.periodosLegislatura.nomenclatura
    return `${periodo}ª ${nomenclatura}`
  }

  // Validação de template
  validarTemplate(template: string): { valido: boolean; erros: string[] } {
    const erros: string[] = []
    const elementosDisponiveis = this.configuracao.configuracoes.elementosTemplate.map(e => e.placeholder)
    
    // Verificar se há placeholders válidos
    const placeholdersEncontrados = template.match(/\{\{[^}]+\}\}/g) || []
    
    placeholdersEncontrados.forEach(placeholder => {
      if (!elementosDisponiveis.includes(placeholder)) {
        erros.push(`Placeholder inválido: ${placeholder}`)
      }
    })
    
    return {
      valido: erros.length === 0,
      erros
    }
  }

  // Reset de numeração
  resetarNumeracao(tipoSessao?: string, legislatura?: string, ano?: number): void {
    if (tipoSessao && legislatura && ano) {
      // Reset específico
      const index = sequenciasNumeracao.findIndex(seq => 
        seq.tipoSessao === tipoSessao && 
        seq.legislatura === legislatura && 
        seq.ano === ano
      )
      if (index !== -1) {
        sequenciasNumeracao[index].ultimoNumero = 0
        sequenciasNumeracao[index].proximoNumero = 1
      }
    } else {
      // Reset geral
      sequenciasNumeracao = sequenciasNumeracao.map(seq => ({
        ...seq,
        ultimoNumero: 0,
        proximoNumero: 1
      }))
    }
  }

  // Estatísticas
  getEstatisticas(): {
    totalSequencias: number;
    sequenciasPorTipo: Record<string, number>;
    proximosNumeros: Record<string, number>;
  } {
    const sequenciasPorTipo: Record<string, number> = {}
    const proximosNumeros: Record<string, number> = {}
    
    sequenciasNumeracao.forEach(seq => {
      sequenciasPorTipo[seq.tipoSessao] = (sequenciasPorTipo[seq.tipoSessao] || 0) + 1
      proximosNumeros[seq.tipoSessao] = seq.proximoNumero
    })
    
    return {
      totalSequencias: sequenciasNumeracao.length,
      sequenciasPorTipo,
      proximosNumeros
    }
  }
}

export const nomenclaturaSessoesService = new NomenclaturaSessoesService()
