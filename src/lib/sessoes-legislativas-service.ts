export interface Sessao {
  id: string;
  titulo: string;
  data: string;
  status: 'agendada' | 'realizada' | 'cancelada';
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL' | 'SOLENE';
  legislaturaId: string;
  legislatura: string; // Número da legislatura
  numeroSessao: number; // Número sequencial da sessão
  periodo?: number; // Período da legislatura
  descricao?: string;
  local?: string;
  pauta?: string[];
  participantes?: string[];
  duracaoMinutos?: number;
  geradoAutomaticamente?: boolean; // Se o título foi gerado automaticamente
}

// Array vazio - sessões são gerenciadas pelo banco de dados
const sessoesData: Sessao[] = [];

export const sessoesLegislativasService = {
  getAll: (): Sessao[] => {
    return sessoesData;
  },
  getById: (id: string): Sessao | undefined => {
    return sessoesData.find(sessao => sessao.id === id);
  },
  getByLegislatura: (legislaturaId: string): Sessao[] => {
    return sessoesData.filter(sessao => sessao.legislaturaId === legislaturaId);
  },
  getByStatus: (status: Sessao['status']): Sessao[] => {
    return sessoesData.filter(sessao => sessao.status === status);
  },
  getByTipo: (tipo: Sessao['tipo']): Sessao[] => {
    return sessoesData.filter(sessao => sessao.tipo === tipo);
  },
  create: (novaSessao: Omit<Sessao, 'id'>): Sessao => {
    const sessao: Sessao = {
      ...novaSessao,
      id: `sessao-${Date.now()}`,
    };
    sessoesData.push(sessao);
    return sessao;
  },
  update: (sessaoAtualizada: Sessao): Sessao => {
    const index = sessoesData.findIndex(sessao => sessao.id === sessaoAtualizada.id);
    if (index !== -1) {
      sessoesData[index] = sessaoAtualizada;
      return sessaoAtualizada;
    }
    throw new Error('Sessão não encontrada');
  },
  delete: (id: string): void => {
    const index = sessoesData.findIndex(sessao => sessao.id === id);
    if (index !== -1) {
      sessoesData.splice(index, 1);
    } else {
      throw new Error('Sessão não encontrada');
    }
  },

  // Função para criar sessão com nomenclatura automática
  createWithNomenclatura(sessaoData: {
    tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL' | 'SOLENE';
    data: string;
    legislaturaId: string;
    legislatura: string;
    periodo?: number;
    descricao?: string;
    local?: string;
    status?: 'agendada' | 'realizada' | 'cancelada';
  }): Sessao {
    // Importar o serviço de nomenclatura
    const { nomenclaturaSessoesService } = require('./nomenclatura-sessoes-service')
    
    // Obter próximo número da sessão
    const ano = new Date(sessaoData.data).getFullYear()
    const numeroSessao = nomenclaturaSessoesService.getProximoNumeroSessao(
      sessaoData.tipo,
      sessaoData.legislatura,
      ano
    )

    // Gerar título automaticamente
    const titulo = nomenclaturaSessoesService.gerarTituloSessao(
      sessaoData.tipo,
      sessaoData.legislatura,
      numeroSessao,
      sessaoData.periodo
    )

    // Criar nova sessão
    const novaSessao: Sessao = {
      id: `sessao-${Date.now()}`,
      titulo,
      data: sessaoData.data,
      status: sessaoData.status || 'agendada',
      tipo: sessaoData.tipo,
      legislaturaId: sessaoData.legislaturaId,
      legislatura: sessaoData.legislatura,
      numeroSessao,
      periodo: sessaoData.periodo,
      descricao: sessaoData.descricao,
      local: sessaoData.local,
      pauta: [],
      participantes: [],
      geradoAutomaticamente: true
    }

    sessoesData.push(novaSessao)
    return novaSessao
  },

  // Função para regenerar título de sessão existente
  regenerateTitle(id: string): Sessao | null {
    const sessao = this.getById(id)
    if (!sessao) return null

    const { nomenclaturaSessoesService } = require('./nomenclatura-sessoes-service')
    
    const ano = new Date(sessao.data).getFullYear()
    const titulo = nomenclaturaSessoesService.gerarTituloSessao(
      sessao.tipo,
      sessao.legislatura,
      sessao.numeroSessao,
      sessao.periodo
    )

    return this.update({ ...sessao, titulo, geradoAutomaticamente: true })
  },

  // Função para obter estatísticas de numeração
  getNumeracaoStats(): {
    totalSessoes: number;
    porTipo: Record<string, number>;
    proximosNumeros: Record<string, number>;
  } {
    const stats = {
      totalSessoes: sessoesData.length,
      porTipo: {} as Record<string, number>,
      proximosNumeros: {} as Record<string, number>
    }

    // Contar por tipo
    sessoesData.forEach(sessao => {
      stats.porTipo[sessao.tipo] = (stats.porTipo[sessao.tipo] || 0) + 1
    })

    // Obter próximos números
    const { nomenclaturaSessoesService } = require('./nomenclatura-sessoes-service')
    const ano = new Date().getFullYear()
    
    Object.keys(stats.porTipo).forEach(tipo => {
      stats.proximosNumeros[tipo] = nomenclaturaSessoesService.getProximoNumeroSessao(
        tipo,
        '15', // Legislatura atual
        ano
      )
    })

    return stats
  }
};
