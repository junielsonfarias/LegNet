import { 
  PautaSessao, 
  ItemCorrespondencia, 
  ItemExpediente, 
  ItemMateriaExpediente, 
  ItemOrdemDoDia,
  PautaStats,
  PautaSessaoFormData 
} from './types/pauta-sessao'
import { parlamentaresService } from './parlamentares-data'

// Dados mock das pautas das sessões
const pautasData: PautaSessao[] = [
  {
    id: 'pauta-001',
    sessaoId: 'sessao-001',
    numero: '001',
    data: '2025-01-15',
    tipo: 'ORDINARIA',
    status: 'PUBLICADA',
    titulo: '59ª Sessão Ordinária da 1ª Sessão Legislativa da 18ª Legislatura',
    descricao: 'Sessão ordinária com pauta completa incluindo correspondências, expedientes e matérias legislativas.',
    
    presidente: 'Lindomar Rodrigo Brandão - PP',
    secretario: 'Secretário da Mesa',
    horarioInicio: '13:30',
    horarioFim: '14:55',
    
    correspondencias: [
      {
        id: 'corr-001',
        numero: 1,
        tipo: 'RECEBIDA',
        categoria: 'OUT',
        numeroDocumento: 'OUT Nº 044/2025',
        data: '2025-01-19',
        interessado: 'Presidente da Câmara e Vereadores',
        assunto: 'Memorando nº 2.684/2025 - APAE Pato Branco',
        descricao: 'Solicitação de protocolo de 7 (sete) ofícios da Associação de Pais e Amigos dos Excepcionais de Pato Branco – APAE, com solicitações de emendas impositivas para diversos projetos sociais.',
        status: 'PROTOCOLADA'
      }
    ],
    
    expedientes: [
      {
        id: 'exp-001',
        numero: 1,
        titulo: 'ABERTURA DA SESSÃO',
        tipo: 'ABERTURA',
        descricao: 'Sob a presidência do vereador Lindomar Rodrigo Brandão - PP, foi declarada aberta a Sessão Ordinária do dia 15 de janeiro de 2025, atendendo ao disposto no § 5º do art. 74 do Regimento Interno.',
        responsavel: 'Presidente',
        duracaoEstimada: 5,
        status: 'CONCLUIDO'
      },
      {
        id: 'exp-002',
        numero: 2,
        titulo: 'LEITURA DE UM TRECHO BÍBLICO',
        tipo: 'LEITURA_BIBLICA',
        descricao: 'Realizada pelo vereador Francisco Pantoja - MDB.',
        responsavel: 'Vereador Francisco Pantoja',
        duracaoEstimada: 3,
        status: 'CONCLUIDO'
      },
      {
        id: 'exp-003',
        numero: 3,
        titulo: 'LEITURA E VOTAÇÃO DA ATA DA SESSÃO ANTERIOR',
        tipo: 'ATA_ANTERIOR',
        descricao: 'Ata da Sessão Ordinária do dia 10 de janeiro de 2025, a qual foi aprovada por unanimidade dos vereadores.',
        responsavel: 'Secretário',
        duracaoEstimada: 5,
        status: 'CONCLUIDO'
      },
      {
        id: 'exp-004',
        numero: 4,
        titulo: 'LEITURA DAS CORRESPONDÊNCIAS RECEBIDAS',
        tipo: 'CORRESPONDENCIAS',
        descricao: 'Convite para 3º Seminário Municipal de Convivência Familiar e Comunitária.',
        responsavel: 'Secretário',
        duracaoEstimada: 10,
        status: 'CONCLUIDO'
      },
      {
        id: 'exp-005',
        numero: 7,
        titulo: 'GRANDE EXPEDIENTE',
        tipo: 'GRANDE_EXPEDIENTE',
        descricao: 'Fez uso da palavra no espaço do Grande Expediente o vereador Lindomar Rodrigo Brandão (PP), para explanar sobre "Estacionamento Rotativo".',
        responsavel: 'Vereador Lindomar Rodrigo Brandão',
        duracaoEstimada: 15,
        status: 'CONCLUIDO'
      },
      {
        id: 'exp-006',
        numero: 8,
        titulo: 'LIDERANÇAS PARTIDÁRIAS',
        tipo: 'LIDERANCAS',
        descricao: 'Fizeram uso da palavra os líderes partidários para manifestações.',
        duracaoEstimada: 20,
        status: 'CONCLUIDO'
      },
      {
        id: 'exp-007',
        numero: 9,
        titulo: 'PARTICIPAÇÃO DE CONVIDADOS',
        tipo: 'PARTICIPACAO_CONVIDADOS',
        descricao: 'Foi concedida a palavra ao Senhor Heber Sutili, Presidente da Comissão Municipal de Justiça Desportiva.',
        responsavel: 'Convidado',
        duracaoEstimada: 10,
        status: 'CONCLUIDO'
      }
    ],
    
    materiasExpediente: [
      {
        id: 'mat-exp-001',
        numero: 1,
        tipo: 'REQUERIMENTO',
        numeroMateria: '001/2025',
        autor: 'Francisco Pantoja',
        ementa: 'Requer ao Executivo Municipal informações sobre o andamento das obras de pavimentação no bairro Centro.',
        status: 'APROVADO',
        turno: 'DELIBERAÇÃO'
      },
      {
        id: 'mat-exp-002',
        numero: 2,
        tipo: 'INDICACAO',
        numeroMateria: '002/2025',
        autor: 'Diego Silva',
        ementa: 'Indica ao Executivo Municipal a instalação de semáforos na Avenida Principal.',
        status: 'APROVADO',
        turno: 'LEITURA'
      },
      {
        id: 'mat-exp-003',
        numero: 3,
        tipo: 'REQUERIMENTO',
        numeroMateria: '003/2025',
        autor: 'Mickael Aguiar',
        ementa: 'Requer informações sobre o programa de coleta seletiva no município.',
        status: 'APROVADO',
        turno: 'DELIBERAÇÃO'
      }
    ],
    
    ordemDoDia: [
      {
        id: 'od-001',
        numero: 1,
        tipo: 'PROJETO_LEI',
        numeroMateria: '171/2025',
        processo: '171/2025',
        autor: 'Francisco Pantoja',
        ementa: 'Denomina via pública de "Sabina Rachwal".',
        status: 'APROVADO',
        turno: 'LEITURA',
        quorumVotacao: 'MAIORIA_SIMPLES'
      },
      {
        id: 'od-002',
        numero: 2,
        tipo: 'MOÇÃO',
        numeroMateria: '017/2025',
        processo: '-',
        autor: 'Diego Silva',
        ementa: 'A ser concedida ao Treinador Maycon Diego da Rosa e ao maratonista Paulo Henrique Tumelero, pelas conquistas em competições por todo o Brasil.',
        status: 'APROVADO',
        turno: 'UNICO',
        quorumVotacao: 'MAIORIA_SIMPLES'
      },
      {
        id: 'od-003',
        numero: 3,
        tipo: 'PROJETO_LEI',
        numeroMateria: '025/2025',
        processo: '25/2025',
        autor: 'Mickael Aguiar',
        ementa: 'Dispõe sobre a obrigatoriedade da oferta de palestras e cursos básicos de primeiros socorros para alunos do ensino fundamental das escolas públicas.',
        status: 'APROVADO',
        turno: 'SEGUNDO',
        quorumVotacao: 'MAIORIA_SIMPLES'
      }
    ],
    
    observacoes: 'Sessão realizada com quórum completo. Todas as matérias foram apreciadas conforme a ordem da pauta.',
    criadaEm: '2025-01-10T10:00:00Z',
    atualizadaEm: '2025-01-15T15:00:00Z',
    publicadaEm: '2025-01-12T09:00:00Z',
    aprovadaEm: '2025-01-15T15:00:00Z'
  }
]

// Serviço de pautas das sessões
export const pautasSessoesService = {
  // Obter todas as pautas
  getAll: (): PautaSessao[] => {
    return pautasData
  },

  // Obter pauta por ID
  getById: (id: string): PautaSessao | undefined => {
    return pautasData.find(pauta => pauta.id === id)
  },

  // Obter pautas por sessão
  getBySessao: (sessaoId: string): PautaSessao[] => {
    return pautasData.filter(pauta => pauta.sessaoId === sessaoId)
  },

  // Obter pautas por status
  getByStatus: (status: string): PautaSessao[] => {
    return pautasData.filter(pauta => pauta.status === status)
  },

  // Obter pautas por tipo
  getByTipo: (tipo: string): PautaSessao[] => {
    return pautasData.filter(pauta => pauta.tipo === tipo)
  },

  // Obter pautas publicadas
  getPublicadas: (): PautaSessao[] => {
    return pautasData.filter(pauta => pauta.status === 'PUBLICADA')
  },

  // Obter rascunhos
  getRascunhos: (): PautaSessao[] => {
    return pautasData.filter(pauta => pauta.status === 'RASCUNHO')
  },

  // Criar nova pauta
  create: (formData: PautaSessaoFormData): PautaSessao => {
    const novaPauta: PautaSessao = {
      id: `pauta-${Date.now()}`,
      sessaoId: formData.sessaoId,
      numero: formData.numero,
      data: formData.data,
      tipo: formData.tipo,
      status: 'RASCUNHO',
      titulo: formData.titulo,
      descricao: formData.descricao,
      presidente: formData.presidente,
      secretario: formData.secretario,
      horarioInicio: formData.horarioInicio,
      observacoes: formData.observacoes,
      correspondencias: [],
      expedientes: [],
      materiasExpediente: [],
      ordemDoDia: [],
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    }

    pautasData.push(novaPauta)
    return novaPauta
  },

  // Atualizar pauta
  update: (id: string, updates: Partial<PautaSessao>): PautaSessao | undefined => {
    const index = pautasData.findIndex(pauta => pauta.id === id)
    if (index === -1) return undefined

    pautasData[index] = {
      ...pautasData[index],
      ...updates,
      atualizadaEm: new Date().toISOString()
    }

    return pautasData[index]
  },

  // Excluir pauta
  delete: (id: string): boolean => {
    const index = pautasData.findIndex(pauta => pauta.id === id)
    if (index === -1) return false

    pautasData.splice(index, 1)
    return true
  },

  // Publicar pauta
  publicar: (id: string): PautaSessao | undefined => {
    const pauta = pautasSessoesService.getById(id)
    if (!pauta) return undefined

    return pautasSessoesService.update(id, {
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString()
    })
  },

  // Iniciar sessão
  iniciarSessao: (id: string): PautaSessao | undefined => {
    return pautasSessoesService.update(id, {
      status: 'EM_ANDAMENTO'
    })
  },

  // Finalizar sessão
  finalizarSessao: (id: string): PautaSessao | undefined => {
    return pautasSessoesService.update(id, {
      status: 'CONCLUIDA',
      aprovadaEm: new Date().toISOString()
    })
  },

  // Adicionar correspondência
  addCorrespondencia: (pautaId: string, correspondencia: Omit<ItemCorrespondencia, 'id' | 'numero'>): PautaSessao | undefined => {
    const pauta = pautasSessoesService.getById(pautaId)
    if (!pauta) return undefined

    const novaCorrespondencia: ItemCorrespondencia = {
      ...correspondencia,
      id: `corr-${Date.now()}`,
      numero: pauta.correspondencias.length + 1
    }

    return pautasSessoesService.update(pautaId, {
      correspondencias: [...pauta.correspondencias, novaCorrespondencia]
    })
  },

  // Adicionar item do expediente
  addExpediente: (pautaId: string, expediente: Omit<ItemExpediente, 'id' | 'numero'>): PautaSessao | undefined => {
    const pauta = pautasSessoesService.getById(pautaId)
    if (!pauta) return undefined

    const novoExpediente: ItemExpediente = {
      ...expediente,
      id: `exp-${Date.now()}`,
      numero: pauta.expedientes.length + 1
    }

    return pautasSessoesService.update(pautaId, {
      expedientes: [...pauta.expedientes, novoExpediente]
    })
  },

  // Adicionar matéria do expediente
  addMateriaExpediente: (pautaId: string, materia: Omit<ItemMateriaExpediente, 'id' | 'numero'>): PautaSessao | undefined => {
    const pauta = pautasSessoesService.getById(pautaId)
    if (!pauta) return undefined

    const novaMateria: ItemMateriaExpediente = {
      ...materia,
      id: `mat-exp-${Date.now()}`,
      numero: pauta.materiasExpediente.length + 1
    }

    return pautasSessoesService.update(pautaId, {
      materiasExpediente: [...pauta.materiasExpediente, novaMateria]
    })
  },

  // Adicionar item da ordem do dia
  addOrdemDoDia: (pautaId: string, item: Omit<ItemOrdemDoDia, 'id' | 'numero'>): PautaSessao | undefined => {
    const pauta = pautasSessoesService.getById(pautaId)
    if (!pauta) return undefined

    const novoItem: ItemOrdemDoDia = {
      ...item,
      id: `od-${Date.now()}`,
      numero: pauta.ordemDoDia.length + 1
    }

    return pautasSessoesService.update(pautaId, {
      ordemDoDia: [...pauta.ordemDoDia, novoItem]
    })
  },

  // Reordenar itens
  reordenar: (pautaId: string, secao: 'correspondencias' | 'expedientes' | 'materiasExpediente' | 'ordemDoDia', novosIds: string[]): PautaSessao | undefined => {
    const pauta = pautasSessoesService.getById(pautaId)
    if (!pauta) return undefined

    const items = pauta[secao] as any[]
    const reordenados = novosIds.map((id, index) => {
      const item = items.find(i => i.id === id)
      return item ? { ...item, numero: index + 1 } : null
    }).filter(Boolean)

    return pautasSessoesService.update(pautaId, {
      [secao]: reordenados
    })
  },

  // Obter estatísticas
  getStats: (): PautaStats => {
    const total = pautasData.length
    const publicadas = pautasData.filter(p => p.status === 'PUBLICADA').length
    const rascunhos = pautasData.filter(p => p.status === 'RASCUNHO').length
    const emAndamento = pautasData.filter(p => p.status === 'EM_ANDAMENTO').length
    const concluidas = pautasData.filter(p => p.status === 'CONCLUIDA').length
    const ordinarias = pautasData.filter(p => p.tipo === 'ORDINARIA').length
    const extraordinarias = pautasData.filter(p => p.tipo === 'EXTRAORDINARIA').length
    const especiais = pautasData.filter(p => p.tipo === 'ESPECIAL').length
    const solenes = pautasData.filter(p => p.tipo === 'SOLENE').length

    return {
      total,
      publicadas,
      rascunhos,
      emAndamento,
      concluidas,
      ordinarias,
      extraordinarias,
      especiais,
      solenes
    }
  },

  // Gerar número automático
  gerarNumeroAutomatico: (tipo: string, ano: number): string => {
    const pautasDoTipoAno = pautasData.filter(p =>
      p.tipo === tipo && p.data.includes(ano.toString())
    )
    
    return (pautasDoTipoAno.length + 1).toString().padStart(3, '0')
  },

  // Obter parlamentares para seleção
  getParlamentares: () => {
    return parlamentaresService.getAll()
  }
}

export { pautasData }
