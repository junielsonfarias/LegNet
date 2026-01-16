// @ts-nocheck
import {
  PainelSessao,
  PautaItem,
  Votacao,
  VotoIndividual,
  Presenca,
  ControleTempo,
  ChatSessao,
  MensagemChat,
  PainelPublico,
  DispositivoVotacao,
  LogSessao,
  ConfiguracaoPainel,
  RelatorioSessao
} from './types/painel-eletronico';
import { parlamentaresService } from './parlamentares-data';

// Dados mock para sessões
const sessoesData: PainelSessao[] = [
  {
    id: '1',
    numeroSessao: '001/2025',
    tipo: 'ordinaria',
    data: new Date('2025-01-25'),
    horarioInicio: '09:00',
    horarioFim: '12:00',
    status: 'agendada',
    presidente: 'Francisco Pereira Pantoja',
    secretario: 'Mickael Christyan Alves de Aguiar',
    local: 'Plenário da Câmara Municipal',
    transmissao: {
      ativa: true,
      url: 'https://youtube.com/watch?v=exemplo',
      plataforma: 'youtube'
    },
    informacoes: {
      totalItens: 15,
      itemAtual: 0,
      tempoEstimado: 180
    }
  }
];

// Dados mock para pauta
const pautaData: PautaItem[] = [
  {
    id: '1',
    ordem: 1,
    tipo: 'projeto_lei',
    titulo: 'PL 001/2025 - Dispõe sobre a criação do programa de incentivo fiscal',
    descricao: 'Projeto de lei que cria programa de incentivo fiscal para empresas locais',
    autor: 'Francisco Pereira Pantoja',
    status: 'pendente',
    prioridade: 'alta',
    tempoEstimado: 20,
    anexos: ['PL_001_2025.pdf']
  },
  {
    id: '2',
    ordem: 2,
    tipo: 'projeto_resolucao',
    titulo: 'PR 002/2025 - Estabelece normas para funcionamento das comissões',
    descricao: 'Resolução que estabelece normas internas para funcionamento das comissões',
    autor: 'Diego Oliveira da Silva',
    status: 'pendente',
    prioridade: 'media',
    tempoEstimado: 15
  },
  {
    id: '3',
    ordem: 3,
    tipo: 'indicacao',
    titulo: 'IND 003/2025 - Indica melhorias na iluminação pública',
    descricao: 'Indicação para melhoria da iluminação pública no centro da cidade',
    autor: 'Antonio Arnaldo Oliveira de Lima',
    status: 'pendente',
    prioridade: 'baixa',
    tempoEstimado: 10
  }
];

// Dados mock para presença
const presencaData: Presenca[] = [
  {
    parlamentarId: '1',
    parlamentarNome: 'Francisco Pereira Pantoja',
    presente: false
  },
  {
    parlamentarId: '2',
    parlamentarNome: 'Diego Oliveira da Silva',
    presente: false
  },
  {
    parlamentarId: '3',
    parlamentarNome: 'Mickael Christyan Alves de Aguiar',
    presente: false
  },
  {
    parlamentarId: '4',
    parlamentarNome: 'Jesanias da Silva Pessoa',
    presente: false
  }
];

// Dados mock para chat
const chatData: ChatSessao = {
  id: '1',
  sessaoId: '1',
  mensagens: [
    {
      id: '1',
      autorId: 'moderador',
      autorNome: 'Sistema',
      autorTipo: 'moderador',
      mensagem: 'Sessão iniciada. Bem-vindos!',
      timestamp: new Date(),
      aprovada: true,
      moderada: false
    }
  ],
  moderacao: {
    ativa: true,
    moderadores: ['admin'],
    palavrasProibidas: ['palavra1', 'palavra2']
  }
};

// Dados mock para configurações
const configuracaoData: ConfiguracaoPainel = {
  id: '1',
  tema: 'claro',
  cores: {
    primaria: '#1e40af',
    secundaria: '#64748b',
    sucesso: '#059669',
    aviso: '#d97706',
    erro: '#dc2626'
  },
  layout: {
    mostrarPresenca: true,
    mostrarVotacao: true,
    mostrarChat: true,
    mostrarTempo: true,
    autoRefresh: true,
    intervaloRefresh: 30
  },
  notificacoes: {
    alertasTempo: true,
    notificacoesVotacao: true,
    somAlertas: false
  },
  seguranca: {
    autenticacaoRequerida: true,
    logAtividades: true,
    backupAutomatico: true
  }
};

// Serviço do Painel Eletrônico
export const painelEletronicoService = {
  // Gerenciamento de Sessões
  getSessaoAtiva: (): PainelSessao | null => {
    return sessoesData.find(s => s.status === 'em_andamento') || null;
  },

  getSessaoById: (id: string): PainelSessao | undefined => {
    return sessoesData.find(s => s.id === id);
  },

  iniciarSessao: (sessaoId: string): PainelSessao | null => {
    const sessao = sessoesData.find(s => s.id === sessaoId);
    if (sessao) {
      sessao.status = 'em_andamento';
      sessao.informacoes.itemAtual = 1;
      return sessao;
    }
    return null;
  },

  finalizarSessao: (sessaoId: string): PainelSessao | null => {
    const sessao = sessoesData.find(s => s.id === sessaoId);
    if (sessao) {
      sessao.status = 'concluida';
      sessao.horarioFim = new Date().toLocaleTimeString();
      return sessao;
    }
    return null;
  },

  // Gerenciamento de Pauta
  getPautaSessao: (sessaoId: string): PautaItem[] => {
    return pautaData.sort((a, b) => a.ordem - b.ordem);
  },

  getItemAtual: (sessaoId: string): PautaItem | null => {
    const pauta = painelEletronicoService.getPautaSessao(sessaoId);
    const itemAtual = pauta.find(item => item.status === 'em_discussao');
    return itemAtual || null;
  },

  iniciarItem: (itemId: string): PautaItem | null => {
    const item = pautaData.find(i => i.id === itemId);
    if (item) {
      item.status = 'em_discussao';
      return item;
    }
    return null;
  },

  finalizarItem: (itemId: string, aprovado: boolean): PautaItem | null => {
    const item = pautaData.find(i => i.id === itemId);
    if (item) {
      item.status = aprovado ? 'aprovado' : 'rejeitado';
      return item;
    }
    return null;
  },

  adiarItem: (itemId: string, observacoes?: string): PautaItem | null => {
    const item = pautaData.find(i => i.id === itemId);
    if (item) {
      item.status = 'adiado';
      if (observacoes) {
        item.observacoes = observacoes;
      }
      return item;
    }
    return null;
  },

  // Gerenciamento de Presença
  getPresencaSessao: (sessaoId: string): Presenca[] => {
    return presencaData;
  },

  registrarPresenca: (parlamentarId: string, presente: boolean): Presenca | null => {
    const presenca = presencaData.find(p => p.parlamentarId === parlamentarId);
    if (presenca) {
      presenca.presente = presente;
      if (presente) {
        presenca.horarioChegada = new Date();
      } else {
        presenca.horarioSaida = new Date();
      }
      return presenca;
    }
    return null;
  },

  getEstatisticasPresenca: (sessaoId: string) => {
    const presencas = painelEletronicoService.getPresencaSessao(sessaoId);
    const total = presencas.length;
    const presentes = presencas.filter(p => p.presente).length;
    const ausentes = total - presentes;

    return {
      total,
      presentes,
      ausentes,
      percentualPresenca: total > 0 ? Math.round((presentes / total) * 100) : 0
    };
  },

  // Gerenciamento de Votação
  iniciarVotacao: (itemId: string, tipo: Votacao['tipo']): Votacao | null => {
    const item = pautaData.find(i => i.id === itemId);
    if (!item) return null;

    const votacao: Votacao = {
      id: `votacao-${itemId}-${Date.now()}`,
      pautaItemId: itemId,
      tipo,
      iniciadaEm: new Date(),
      resultado: {
        sim: 0,
        nao: 0,
        abstencoes: 0,
        ausencias: 0,
        total: 0
      },
      aprovado: false,
      votos: []
    };

    return votacao;
  },

  registrarVoto: (votacaoId: string, parlamentarId: string, voto: VotoIndividual['voto']): boolean => {
    // Simular registro de voto
    return true;
  },

  finalizarVotacao: (votacaoId: string): Votacao | null => {
    // Simular finalização de votação
    return null;
  },

  // Gerenciamento de Chat
  getChatSessao: (sessaoId: string): ChatSessao => {
    return chatData;
  },

  enviarMensagem: (sessaoId: string, mensagem: Omit<MensagemChat, 'id' | 'timestamp'>): MensagemChat | null => {
    const chat = painelEletronicoService.getChatSessao(sessaoId);
    const novaMensagem: MensagemChat = {
      id: `msg-${Date.now()}`,
      ...mensagem,
      timestamp: new Date()
    };

    chat.mensagens.push(novaMensagem);
    return novaMensagem;
  },

  moderarMensagem: (mensagemId: string, aprovada: boolean): boolean => {
    const chat = chatData;
    const mensagem = chat.mensagens.find(m => m.id === mensagemId);
    if (mensagem) {
      mensagem.aprovada = aprovada;
      mensagem.moderada = true;
      return true;
    }
    return false;
  },

  // Painel Público
  getPainelPublico: (sessaoId: string): PainelPublico | null => {
    const sessao = painelEletronicoService.getSessaoById(sessaoId);
    if (!sessao) return null;

    const pauta = painelEletronicoService.getPautaSessao(sessaoId);
    const itemAtual = painelEletronicoService.getItemAtual(sessaoId);
    const estatisticas = painelEletronicoService.getEstatisticasPresenca(sessaoId);

    return {
      id: `painel-publico-${sessaoId}`,
      sessaoId,
      informacoes: {
        titulo: `${sessao.tipo.toUpperCase()} - ${sessao.numeroSessao}`,
        subtitulo: 'Câmara Municipal de Mojuí dos Campos',
        data: sessao.data.toLocaleDateString(),
        horario: `${sessao.horarioInicio} - ${sessao.horarioFim || 'Em andamento'}`,
        local: sessao.local
      },
      itemAtual: itemAtual ? {
        titulo: itemAtual.titulo,
        descricao: itemAtual.descricao,
        autor: itemAtual.autor,
        status: itemAtual.status,
        tempoRestante: itemAtual.tempoEstimado
      } : undefined,
      estatisticas: {
        totalItens: pauta.length,
        itemAtual: sessao.informacoes.itemAtual,
        itensAprovados: pauta.filter(p => p.status === 'aprovado').length,
        itensRejeitados: pauta.filter(p => p.status === 'rejeitado').length
      }
    };
  },

  // Controle de Tempo
  iniciarControleTempo: (itemId: string, tempoLimite: number): ControleTempo => {
    return {
      itemId,
      tempoInicio: new Date(),
      tempoLimite,
      tempoRestante: tempoLimite,
      alertas: [
        { tempo: 5, enviado: false },
        { tempo: 2, enviado: false },
        { tempo: 1, enviado: false }
      ],
      extensoes: {
        solicitada: false,
        aprovada: false,
        tempoAdicional: 0
      }
    };
  },

  // Configurações
  getConfiguracao: (): ConfiguracaoPainel => {
    return configuracaoData;
  },

  atualizarConfiguracao: (novaConfig: Partial<ConfiguracaoPainel>): ConfiguracaoPainel => {
    Object.assign(configuracaoData, novaConfig);
    return configuracaoData;
  },

  // Logs e Auditoria
  adicionarLog: (sessaoId: string, acao: string, detalhes: any, usuario: string): LogSessao => {
    const log: LogSessao = {
      id: `log-${Date.now()}`,
      sessaoId,
      acao,
      detalhes,
      usuario,
      timestamp: new Date()
    };

    return log;
  },

  getLogsSessao: (sessaoId: string): LogSessao[] => {
    // Simular logs
    return [];
  },

  // Relatórios
  gerarRelatorioSessao: (sessaoId: string, geradoPor: string): RelatorioSessao => {
    const sessao = painelEletronicoService.getSessaoById(sessaoId);
    const pauta = painelEletronicoService.getPautaSessao(sessaoId);
    const estatisticas = painelEletronicoService.getEstatisticasPresenca(sessaoId);

    return {
      id: `relatorio-${sessaoId}-${Date.now()}`,
      sessaoId,
      geradoEm: new Date(),
      geradoPor,
      dados: {
        resumo: {
          duracaoTotal: 180, // minutos
          totalItens: pauta.length,
          itensAprovados: pauta.filter(p => p.status === 'aprovado').length,
          itensRejeitados: pauta.filter(p => p.status === 'rejeitado').length,
          itensAdiados: pauta.filter(p => p.status === 'adiado').length
        },
        presenca: estatisticas,
        votacoes: [], // Seria preenchido com votações reais
        tempoPorItem: pauta.map(item => ({
          itemId: item.id,
          titulo: item.titulo,
          tempoEstimado: item.tempoEstimado,
          tempoReal: item.tempoReal || 0,
          diferenca: (item.tempoReal || 0) - item.tempoEstimado
        })),
        atividades: painelEletronicoService.getLogsSessao(sessaoId)
      }
    };
  },

  // Dispositivos
  getDispositivosConectados: (): DispositivoVotacao[] => {
    const parlamentares = parlamentaresService.getAll();
    return parlamentares.map(p => ({
      id: `device-${p.id}`,
      parlamentarId: p.id,
      tipo: 'tablet',
      conectado: Math.random() > 0.3, // Simular alguns desconectados
      ultimaAtividade: new Date(Date.now() - Math.random() * 3600000), // Última hora
      versaoApp: '1.0.0'
    }));
  },

  // Estatísticas em tempo real
  getEstatisticasTempoReal: (sessaoId: string) => {
    const sessao = painelEletronicoService.getSessaoById(sessaoId);
    const pauta = painelEletronicoService.getPautaSessao(sessaoId);
    const estatisticas = painelEletronicoService.getEstatisticasPresenca(sessaoId);
    const dispositivos = painelEletronicoService.getDispositivosConectados();

    return {
      sessao: sessao,
      presenca: estatisticas,
      pauta: {
        total: pauta.length,
        concluidos: pauta.filter(p => p.status !== 'pendente').length,
        emAndamento: pauta.filter(p => p.status === 'em_discussao').length,
        pendentes: pauta.filter(p => p.status === 'pendente').length
      },
      dispositivos: {
        total: dispositivos.length,
        conectados: dispositivos.filter(d => d.conectado).length,
        desconectados: dispositivos.filter(d => !d.conectado).length
      },
      tempo: {
        inicio: sessao?.horarioInicio,
        estimado: sessao?.informacoes.tempoEstimado,
        decorrido: sessao ? Math.floor((Date.now() - new Date(sessao.data).getTime()) / 60000) : 0
      }
    };
  }
};
