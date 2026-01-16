import { mockData } from './db'
import {
  TipoProposicao,
  TipoOrgao,
  TipoTramitacao,
  Tramitacao,
  RegraTramitacao,
  HistoricoTramitacao,
  ConfiguracaoTramitacao,
  StatusTramitacao,
  ResultadoTramitacao
} from './types/tramitacao'

type RegraTramitacaoEtapa = {
  id: string
  regraId: string
  ordem: number
  nome: string
  descricao?: string
  tipoTramitacaoId?: string | null
  unidadeId?: string | null
  notificacoes?: any
  alertas?: any
  prazoDias?: number | null
  createdAt?: string
  updatedAt?: string
}

type TramitacaoNotificacao = {
  id: string
  tramitacaoId: string
  canal: string
  destinatario: string
  enviadoEm?: string | null
  status?: string | null
  mensagem?: string | null
  parametros?: any
  createdAt?: string
  updatedAt?: string
}

const nowISO = () => new Date().toISOString()

const ensureCollection = <T = any>(key: string): T[] => {
  const storage = mockData as Record<string, any>
  if (!storage[key]) {
    storage[key] = []
  }
  return storage[key] as T[]
}

const tipoProposicaoStore = () => ensureCollection<TipoProposicao>('tramitacaoTipoProposicoes')
const unidadeStore = () => ensureCollection<TipoOrgao>('tramitacaoUnidades')
const tipoTramitacaoStore = () => ensureCollection<TipoTramitacao>('tramitacaoTipos')
const tramitacaoStore = () => ensureCollection<Tramitacao>('tramitacoes')
const historicoStore = () => ensureCollection<HistoricoTramitacao>('tramitacaoHistoricos')
const notificacaoStore = () => ensureCollection<TramitacaoNotificacao>('tramitacaoNotificacoes')
const regraStore = () => ensureCollection<RegraTramitacao>('tramitacaoRegras')
const regraEtapaStore = () => ensureCollection<RegraTramitacaoEtapa>('tramitacaoRegraEtapas')
const configuracaoStore = () => ensureCollection<ConfiguracaoTramitacao>('tramitacaoConfiguracoes')

const normaliseTipoTramitacao = (tipo: TipoTramitacao): TipoTramitacao => {
  const unidadeResponsavelId = tipo.unidadeResponsavelId ?? tipo.unidadeResponsavel ?? null
  return {
    ...tipo,
    unidadeResponsavelId: unidadeResponsavelId ?? undefined,
    unidadeResponsavel: unidadeResponsavelId ?? undefined
  }
}

const matchesStatus = (value: string | StatusTramitacao | undefined, expected: StatusTramitacao) => {
  if (!value) return false
  if (typeof value === 'string') {
    return value === expected || value === expected.toString()
  }
  return value === expected
}

const matchesResultado = (value: string | ResultadoTramitacao | undefined, expected: ResultadoTramitacao) => {
  if (!value) return false
  if (typeof value === 'string') {
    return value === expected || value === expected.toString()
  }
  return value === expected
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const toUpperUnidadeTipo = (tipo: TipoOrgao['tipo']) => {
  if (!tipo) return tipo
  return (typeof tipo === 'string' ? tipo.toUpperCase() : tipo) as TipoOrgao['tipo']
}

const setTimestampsForCreate = <T extends object>(entity: T): T & { createdAt: string; updatedAt: string } => ({
  ...entity,
  createdAt: (entity as any).createdAt ?? nowISO(),
  updatedAt: (entity as any).updatedAt ?? nowISO()
})

const setTimestampsForUpdate = <T extends object>(entity: T, existing: T): T & { createdAt: string; updatedAt: string } => ({
  ...existing,
  ...entity,
  createdAt: (existing as any).createdAt ?? (entity as any).createdAt ?? nowISO(),
  updatedAt: nowISO()
})

const calcularDiasVencidos = (prazoVencimento?: string | null): number | undefined => {
  if (!prazoVencimento) {
    return undefined
  }
  const prazoDate = new Date(prazoVencimento)
  if (Number.isNaN(prazoDate.getTime())) {
    return undefined
  }
  const diffMs = Date.now() - prazoDate.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDias > 0 ? diffDias : 0
}

const adicionarDiasUteis = (dias: number) => {
  if (!dias || dias <= 0) {
    return null
  }
  const data = new Date()
  let adicionados = 0
  while (adicionados < dias) {
    data.setDate(data.getDate() + 1)
    const diaSemana = data.getDay()
    if (diaSemana >= 1 && diaSemana <= 5) {
      adicionados += 1
    }
  }
  return data
}

const calcularPrazoDestino = (tipoTramitacaoId?: string | null, prazoDias?: number | null) => {
  if (prazoDias && prazoDias > 0) {
    const alvo = adicionarDiasUteis(prazoDias)
    return alvo ? alvo.toISOString() : undefined
  }
  if (!tipoTramitacaoId) {
    return undefined
  }
  const tipo = tipoTramitacaoStore().find(t => t.id === tipoTramitacaoId)
  if (!tipo || !tipo.prazoRegimental || tipo.prazoRegimental <= 0) {
    return undefined
  }
  const alvo = adicionarDiasUteis(tipo.prazoRegimental)
  return alvo ? alvo.toISOString() : undefined
}

const persistTramitacaoAtualizada = (atual: Tramitacao, dados: Partial<Tramitacao>): Tramitacao => {
  const store = tramitacaoStore()
  const index = store.findIndex(tramitacao => tramitacao.id === atual.id)
  if (index === -1) {
    throw new Error('Tramitação não encontrada')
  }
  const mesclado = setTimestampsForUpdate({ ...atual, ...dados } as any, store[index] as any)
  store[index] = mesclado
  return mesclado
}

const ensureUnidadeDestino = (tipoTramitacaoId: string, fallback?: string): string => {
  const tipo = tiposTramitacaoService.getById(tipoTramitacaoId)
  const candidatos = [
    tipo?.unidadeResponsavelId,
    tipo?.unidadeResponsavel,
    fallback
  ].filter(Boolean)
  const unidadeId = candidatos.length ? (candidatos[0] as string) : undefined
  if (!unidadeId) {
    const primeiraUnidade = tiposOrgaosService.getAll()[0]
    if (primeiraUnidade) {
      return primeiraUnidade.id
    }
    throw new Error('Unidade de destino não encontrada para a tramitação.')
  }
  return unidadeId
}

const buildNotificacoesFromEtapa = (
  tramitacaoId: string,
  etapa: RegraTramitacaoEtapa | null | undefined,
  regra: RegraTramitacao | null | undefined
) => {
  const notificacoesGeradas: any[] = []
  if (!etapa) {
    return notificacoesGeradas
  }

  const notificacoes = Array.isArray(etapa.notificacoes) ? etapa.notificacoes : etapa.notificacoes ? [etapa.notificacoes] : []
  const alertas = Array.isArray(etapa.alertas) ? etapa.alertas : etapa.alertas ? [etapa.alertas] : []

  if (!notificacoes.length && !alertas.length) {
    return notificacoesGeradas
  }

  const payloads = [...notificacoes.map(item => ({ tipo: 'notificacao', dados: item })), ...alertas.map(item => ({ tipo: 'alerta', dados: item }))]

  payloads.forEach((item, index) => {
    const destino =
      typeof item.dados === 'object' && item.dados !== null && 'destinatario' in item.dados
        ? (item.dados as { destinatario?: string }).destinatario ?? `destinatario-${index + 1}`
        : `destinatario-${index + 1}`

    const canal =
      typeof item.dados === 'object' && item.dados !== null && 'canal' in item.dados
        ? String((item.dados as { canal?: string }).canal ?? 'sistema')
        : item.tipo === 'alerta'
          ? 'alerta'
          : 'sistema'

    notificacoesGeradas.push(
      tramitacaoNotificacoesService.create({
        tramitacaoId,
        canal,
        destinatario: destino,
        status: 'pendente',
        mensagem:
          item.tipo === 'alerta'
            ? 'Alerta automático gerado pela regra de tramitação.'
            : 'Notificação automática gerada pela regra de tramitação.',
        parametros: {
          regraId: regra?.id,
          etapaId: etapa.id,
          payload: item.dados
        }
      })
    )
  })

  return notificacoesGeradas
}

const regraAtendeContexto = (regra: RegraTramitacao, contexto: Record<string, unknown>) => {
  if (!regra.condicoes || typeof regra.condicoes !== 'object') {
    return true
  }

  return Object.entries(regra.condicoes as Record<string, unknown>).every(([chave, valor]) => {
    if (valor === null || valor === undefined) {
      return true
    }

    const contextoValor = contexto[chave]

    if (Array.isArray(valor)) {
      if (valor.length === 0) {
        return true
      }
      return valor.some(item => String(item).toLowerCase() === String(contextoValor ?? '').toLowerCase())
    }

    if (typeof valor === 'object') {
      const objeto = valor as Record<string, unknown>
      if ('equals' in objeto) {
        return String(objeto.equals).toLowerCase() === String(contextoValor ?? '').toLowerCase()
      }
      if ('not' in objeto) {
        return String(objeto.not).toLowerCase() !== String(contextoValor ?? '').toLowerCase()
      }
    }

    return String(valor).toLowerCase() === String(contextoValor ?? '').toLowerCase()
  })
}

interface RegraResolvida {
  regra: RegraTramitacao | null
  etapas: RegraTramitacaoEtapa[]
  etapaAtualIndex: number
}

const resolverRegraParaTramitacao = (
  tramitacao: Tramitacao,
  opcoes?: { regraId?: string; etapaId?: string }
): RegraResolvida => {
  const ativo = regraStore().filter(regra => regra.ativo !== false)

  let regra = opcoes?.regraId ? regraStore().find(item => item.id === opcoes.regraId) ?? null : null
  if (!regra) {
    const contexto = {
      proposicaoId: tramitacao.proposicaoId,
      tipoTramitacaoId: tramitacao.tipoTramitacaoId,
      unidadeId: tramitacao.unidadeId,
      status: tramitacao.status,
      resultado: tramitacao.resultado,
      automatica: tramitacao.automatica
    }
    regra = ativo.find(item => regraAtendeContexto(item, contexto)) ?? null
  }

  if (!regra) {
    return { regra: null, etapas: [], etapaAtualIndex: -1 }
  }

  const etapas = regrasTramitacaoEtapasService.getByRegra(regra.id)
  if (!etapas.length) {
    return { regra, etapas: [], etapaAtualIndex: -1 }
  }

  if (opcoes?.etapaId) {
    const index = etapas.findIndex(item => item.id === opcoes.etapaId)
    return { regra, etapas, etapaAtualIndex: index }
  }

  const indexPeloTipo = etapas.findIndex(
    etapa =>
      etapa.tipoTramitacaoId === tramitacao.tipoTramitacaoId &&
      (etapa.unidadeId ?? null) === (tramitacao.unidadeId ?? null)
  )

  if (indexPeloTipo >= 0) {
    return { regra, etapas, etapaAtualIndex: indexPeloTipo }
  }

  return { regra, etapas, etapaAtualIndex: -1 }
}

interface AvancoTramitacaoOptions {
  usuarioId?: string
  comentario?: string | null
  regraId?: string
  etapaId?: string
}

interface AvancoTramitacaoResultado {
  etapaFinalizada: Tramitacao
  novaEtapa?: Tramitacao | null
  regraAplicada?: RegraTramitacao | null
  etapaDestino?: RegraTramitacaoEtapa | null
  historicos: HistoricoTramitacao[]
  notificacoes: TramitacaoNotificacao[]
}

const tipoProposicaoCreate = (data: Omit<TipoProposicao, 'id' | 'createdAt' | 'updatedAt'>): TipoProposicao => {
  const novo = setTimestampsForCreate({
    ...data,
    id: generateId('tipo-proposicao')
  })
  tipoProposicaoStore().push(novo)
  return novo
}

const tipoOrgaoCreate = (data: Omit<TipoOrgao, 'id' | 'createdAt' | 'updatedAt'>): TipoOrgao => {
  const novo = setTimestampsForCreate({
    ...data,
    id: generateId('tipo-orgao'),
    tipo: toUpperUnidadeTipo(data.tipo)
  })
  unidadeStore().push(novo)
  return novo
}

const tipoTramitacaoCreate = (data: Omit<TipoTramitacao, 'id' | 'createdAt' | 'updatedAt'>): TipoTramitacao => {
  const unidadeResponsavelId = data.unidadeResponsavelId ?? data.unidadeResponsavel ?? null
  const novo = setTimestampsForCreate({
    ...data,
    id: generateId('tipo-tramitacao'),
    unidadeResponsavelId: unidadeResponsavelId ?? undefined,
    unidadeResponsavel: unidadeResponsavelId ?? undefined
  })
  tipoTramitacaoStore().push(novo)
  return normaliseTipoTramitacao(novo)
}

export const tiposProposicoesService = {
  getAll: (): TipoProposicao[] => [...tipoProposicaoStore()],
  getById: (id: string) => tipoProposicaoStore().find(tipo => tipo.id === id),
  getBySigla: (sigla: string) => tipoProposicaoStore().find(tipo => tipo.sigla === sigla),
  getAtivos: () => tipoProposicaoStore().filter(tipo => tipo.ativo),
  create: tipoProposicaoCreate,
  update: (tipoAtualizado: TipoProposicao) => {
    const store = tipoProposicaoStore()
    const index = store.findIndex(tipo => tipo.id === tipoAtualizado.id)
    if (index === -1) {
      throw new Error('Tipo de proposição não encontrado')
    }
    const atualizado = setTimestampsForUpdate(tipoAtualizado, store[index])
    store[index] = atualizado
    return atualizado
  },
  delete: (id: string) => {
    const store = tipoProposicaoStore()
    const index = store.findIndex(tipo => tipo.id === id)
    if (index === -1) {
      throw new Error('Tipo de proposição não encontrado')
    }
    store.splice(index, 1)
  }
}

export const tiposOrgaosService = {
  getAll: (): TipoOrgao[] => unidadeStore().map(orgao => ({ ...orgao, tipo: toUpperUnidadeTipo(orgao.tipo) })),
  getById: (id: string) => unidadeStore().find(orgao => orgao.id === id),
  getByTipo: (tipo: string) => unidadeStore().filter(orgao => toUpperUnidadeTipo(orgao.tipo) === tipo.toUpperCase()),
  getAtivos: () => unidadeStore().filter(orgao => orgao.ativo),
  create: tipoOrgaoCreate,
  update: (orgaoAtualizado: TipoOrgao) => {
    const store = unidadeStore()
    const index = store.findIndex(orgao => orgao.id === orgaoAtualizado.id)
    if (index === -1) {
      throw new Error('Tipo de órgão não encontrado')
    }
    const atualizado = setTimestampsForUpdate({ ...orgaoAtualizado, tipo: toUpperUnidadeTipo(orgaoAtualizado.tipo) }, store[index])
    store[index] = atualizado
    return atualizado
  },
  delete: (id: string) => {
    const store = unidadeStore()
    const index = store.findIndex(orgao => orgao.id === id)
    if (index === -1) {
      throw new Error('Tipo de órgão não encontrado')
    }
    store.splice(index, 1)
  }
}

export const tiposTramitacaoService = {
  getAll: (): TipoTramitacao[] => tipoTramitacaoStore().map(normaliseTipoTramitacao),
  getById: (id: string) => {
    const tipo = tipoTramitacaoStore().find(item => item.id === id)
    return tipo ? normaliseTipoTramitacao(tipo) : undefined
  },
  getByUnidade: (unidadeId: string) => tipoTramitacaoStore()
    .filter(tipo => {
      const unidadeResponsavelId = tipo.unidadeResponsavelId ?? tipo.unidadeResponsavel
      return unidadeResponsavelId === unidadeId
    })
    .map(normaliseTipoTramitacao),
  getAtivos: () => tipoTramitacaoStore().filter(tipo => tipo.ativo).map(normaliseTipoTramitacao),
  create: tipoTramitacaoCreate,
  update: (tipoAtualizado: TipoTramitacao) => {
    const store = tipoTramitacaoStore()
    const index = store.findIndex(tipo => tipo.id === tipoAtualizado.id)
    if (index === -1) {
      throw new Error('Tipo de tramitação não encontrado')
    }
    const unidadeResponsavelId = tipoAtualizado.unidadeResponsavelId ?? tipoAtualizado.unidadeResponsavel ?? store[index].unidadeResponsavelId ?? store[index].unidadeResponsavel
    const atualizado = setTimestampsForUpdate({
      ...tipoAtualizado,
      unidadeResponsavelId: unidadeResponsavelId ?? undefined,
      unidadeResponsavel: unidadeResponsavelId ?? undefined
    }, store[index])
    store[index] = atualizado
    return normaliseTipoTramitacao(atualizado)
  },
  delete: (id: string) => {
    const store = tipoTramitacaoStore()
    const index = store.findIndex(tipo => tipo.id === id)
    if (index === -1) {
      throw new Error('Tipo de tramitação não encontrado')
    }
    store.splice(index, 1)
  }
}

const ordenarPorDataEntradaDesc = (a: Tramitacao, b: Tramitacao) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime()
const ordenarPorDataEntradaAsc = (a: Tramitacao, b: Tramitacao) => new Date(a.dataEntrada).getTime() - new Date(b.dataEntrada).getTime()

export const tramitacoesService = {
  getAll: (): Tramitacao[] => [...tramitacaoStore()],
  getById: (id: string) => tramitacaoStore().find(tramitacao => tramitacao.id === id) ?? null,
  getByProposicao: (proposicaoId: string) => tramitacaoStore().filter(tramitacao => tramitacao.proposicaoId === proposicaoId),
  getStatusAtual: (proposicaoId: string): Tramitacao | null => {
    const ordenadas = tramitacaoStore()
      .filter(t => t.proposicaoId === proposicaoId)
      .sort(ordenarPorDataEntradaDesc)
    return ordenadas.length ? ordenadas[0] : null
  },
  getHistorico: (proposicaoId: string): Tramitacao[] => tramitacaoStore()
    .filter(t => t.proposicaoId === proposicaoId)
    .sort(ordenarPorDataEntradaAsc),
  getStatusDetalhado: (proposicaoId: string) => {
    const tramitacaoAtual = tramitacoesService.getStatusAtual(proposicaoId)
    if (!tramitacaoAtual) {
      return {
        status: 'NÃO_TRAMITADA',
        localizacao: 'Não iniciada',
        descricao: 'Proposição ainda não foi protocolada',
        prazo: null,
        proximoPasso: 'Protocolo na Mesa Diretora'
      }
    }

    const tipoTramitacao = tiposTramitacaoService.getById(tramitacaoAtual.tipoTramitacaoId)
    const unidade = tiposOrgaosService.getById(tramitacaoAtual.unidadeId)

    let status: string | StatusTramitacao | undefined = tramitacaoAtual.status
    let localizacao = unidade?.nome || 'Órgão não identificado'
    let descricao = tramitacaoAtual.observacoes || ''
    let proximoPasso = ''

    if (tipoTramitacao?.id === '5') {
      status = StatusTramitacao.EM_ANDAMENTO
      localizacao = 'Plenário - Aguardando Pauta'
      descricao = 'Pronta para votação, aguardando inclusão na pauta'
      proximoPasso = 'Inclusão na pauta de votação'
    } else if (tipoTramitacao?.id === '6') {
      status = StatusTramitacao.EM_ANDAMENTO
      localizacao = `${unidade?.nome} - Aguardando Resposta`
      descricao = 'Aguardando resposta do órgão competente'
      proximoPasso = 'Resposta do órgão responsável'
    } else if (tipoTramitacao?.id === '3') {
      status = StatusTramitacao.EM_ANDAMENTO
      localizacao = `${unidade?.nome} - Em Análise`
      descricao = 'Sendo analisada pela comissão competente'
      proximoPasso = 'Conclusão da análise técnica'
    } else if (matchesStatus(tramitacaoAtual.status, StatusTramitacao.CONCLUIDA) && matchesResultado(tramitacaoAtual.resultado, ResultadoTramitacao.APROVADO)) {
      status = StatusTramitacao.CONCLUIDA
      localizacao = `${unidade?.nome} - Aprovada`
      descricao = 'Aprovada pela unidade competente'
      proximoPasso = 'Próxima etapa do processo'
    }

    return {
      status,
      localizacao,
      descricao,
      prazo: tramitacaoAtual.prazoVencimento || null,
      proximoPasso,
      tramitacaoAtual,
      tipoTramitacao,
      unidade
    }
  },
  getAtivas: () => tramitacaoStore().filter(tramitacao => matchesStatus(tramitacao.status, StatusTramitacao.EM_ANDAMENTO)),
  getVencidas: () => {
    const hoje = new Date()
    return tramitacaoStore().filter(tramitacao => {
      if (!tramitacao.prazoVencimento || !matchesStatus(tramitacao.status, StatusTramitacao.EM_ANDAMENTO)) {
        return false
      }
      return new Date(tramitacao.prazoVencimento) < hoje
    })
  },
  create: (novaTramitacao: Omit<Tramitacao, 'id' | 'createdAt' | 'updatedAt'>): Tramitacao => {
    const prazoVencimento = novaTramitacao.prazoVencimento ?? calcularPrazoDestino(novaTramitacao.tipoTramitacaoId)
    const tramitacao = setTimestampsForCreate({
      ...novaTramitacao,
      prazoVencimento: prazoVencimento ?? undefined,
      diasVencidos: novaTramitacao.diasVencidos ?? calcularDiasVencidos(prazoVencimento),
      id: generateId('tramitacao')
    })
    tramitacaoStore().push(tramitacao)
    return tramitacao
  },
  update: (tramitacaoAtualizada: Tramitacao): Tramitacao => {
    const store = tramitacaoStore()
    const index = store.findIndex(tramitacao => tramitacao.id === tramitacaoAtualizada.id)
    if (index === -1) {
      throw new Error('Tramitação não encontrada')
    }
    const dados = {
      ...tramitacaoAtualizada,
      diasVencidos:
        tramitacaoAtualizada.diasVencidos === undefined
          ? calcularDiasVencidos(tramitacaoAtualizada.prazoVencimento)
          : tramitacaoAtualizada.diasVencidos
    }
    const atualizado = setTimestampsForUpdate(dados, store[index])
    store[index] = atualizado
    return atualizado
  },
  delete: (id: string) => {
    const store = tramitacaoStore()
    const index = store.findIndex(tramitacao => tramitacao.id === id)
    if (index === -1) {
      throw new Error('Tramitação não encontrada')
    }
    store.splice(index, 1)
  },
  finalize: (id: string, opcoes?: { resultado?: string | null; observacoes?: string | null; usuarioId?: string | null }) => {
    const atual = tramitacoesService.getById(id)
    if (!atual) {
      throw new Error('Tramitação não encontrada')
    }

    const atualizado = persistTramitacaoAtualizada(atual, {
      status: StatusTramitacao.CONCLUIDA,
      resultado: (opcoes?.resultado ?? atual.resultado) as ResultadoTramitacao | undefined,
      observacoes: opcoes?.observacoes ?? atual.observacoes,
      dataSaida: nowISO(),
      diasVencidos: calcularDiasVencidos(atual.prazoVencimento)
    })

    const historico = tramitacaoHistoricosService.create({
      tramitacaoId: atualizado.id,
      acao: 'FINALIZACAO',
      descricao: opcoes?.observacoes ?? 'Tramitação finalizada',
      usuarioId: opcoes?.usuarioId ?? undefined,
      proposicaoId: atualizado.proposicaoId,
      dadosAnteriores: atual,
      dadosNovos: atualizado
    })

    return {
      tramitacao: atualizado,
      historico
    }
  },
  finalizar: (id: string, resultado?: string, observacoes?: string) => {
    const { tramitacao } = tramitacoesService.finalize(id, { resultado, observacoes })
    return tramitacao
  },
  reopen: (id: string, opcoes?: { usuarioId?: string | null; observacoes?: string | null }) => {
    const atual = tramitacoesService.getById(id)
    if (!atual) {
      throw new Error('Tramitação não encontrada')
    }

    const prazo = calcularPrazoDestino(atual.tipoTramitacaoId)

    const atualizado = persistTramitacaoAtualizada(atual, {
      status: StatusTramitacao.EM_ANDAMENTO,
      dataSaida: undefined,
      resultado: undefined,
      observacoes: opcoes?.observacoes ?? atual.observacoes,
      diasVencidos: 0,
      prazoVencimento: prazo ?? atual.prazoVencimento
    })

    const historico = tramitacaoHistoricosService.create({
      tramitacaoId: atualizado.id,
      acao: 'REABERTURA',
      descricao: opcoes?.observacoes ?? 'Tramitação reaberta',
      usuarioId: opcoes?.usuarioId ?? undefined,
      proposicaoId: atualizado.proposicaoId,
      dadosAnteriores: atual,
      dadosNovos: atualizado
    })

    return { tramitacao: atualizado, historico }
  },
  advance: (id: string, opcoes?: AvancoTramitacaoOptions): AvancoTramitacaoResultado => {
    const atual = tramitacoesService.getById(id)
    if (!atual) {
      throw new Error('Tramitação não encontrada')
    }

    const { regra, etapas, etapaAtualIndex } = resolverRegraParaTramitacao(atual, {
      regraId: opcoes?.regraId,
      etapaId: opcoes?.etapaId
    })

    const etapaDestino =
      etapaAtualIndex >= 0 && etapaAtualIndex + 1 < etapas.length ? etapas[etapaAtualIndex + 1] : etapas[0] ?? null

    const atualFinalizada = persistTramitacaoAtualizada(atual, {
      status: StatusTramitacao.CONCLUIDA,
      dataSaida: nowISO(),
      diasVencidos: calcularDiasVencidos(atual.prazoVencimento)
    })

    const historicos: HistoricoTramitacao[] = [
      tramitacaoHistoricosService.create({
        tramitacaoId: atualFinalizada.id,
        acao: 'FINALIZACAO_ETAPA',
        descricao: opcoes?.comentario ?? 'Etapa finalizada',
        usuarioId: opcoes?.usuarioId ?? undefined,
        proposicaoId: atualFinalizada.proposicaoId,
        dadosAnteriores: atual,
        dadosNovos: atualFinalizada
      })
    ]

    if (!etapaDestino) {
      return {
        etapaFinalizada: atualFinalizada,
        novaEtapa: null,
        regraAplicada: regra,
        etapaDestino: null,
        historicos,
        notificacoes: []
      }
    }

    const tipoDestinoId = etapaDestino.tipoTramitacaoId ?? atual.tipoTramitacaoId
    const unidadeDestinoId = ensureUnidadeDestino(tipoDestinoId, etapaDestino.unidadeId ?? atual.unidadeId)
    const prazoVencimento = calcularPrazoDestino(tipoDestinoId, etapaDestino.prazoDias ?? undefined)

    const novaEtapa: Tramitacao = setTimestampsForCreate({
      id: generateId('tramitacao'),
      proposicaoId: atual.proposicaoId,
      tipoTramitacaoId: tipoDestinoId,
      unidadeId: unidadeDestinoId,
      dataEntrada: nowISO(),
      status: StatusTramitacao.EM_ANDAMENTO,
      observacoes: etapaDestino.descricao ?? opcoes?.comentario ?? undefined,
      parecer: undefined,
      resultado: undefined,
      responsavelId: atual.responsavelId,
      prazoVencimento: prazoVencimento ?? undefined,
      diasVencidos: 0,
      automatica: true
    })

    tramitacaoStore().push(novaEtapa)

    historicos.push(
      tramitacaoHistoricosService.create({
        tramitacaoId: novaEtapa.id,
        acao: 'NOVA_ETAPA',
        descricao: etapaDestino.nome ?? 'Nova etapa gerada automaticamente',
        usuarioId: opcoes?.usuarioId ?? undefined,
        proposicaoId: novaEtapa.proposicaoId,
        dadosAnteriores: null,
        dadosNovos: novaEtapa
      })
    )

    const notificacoes = buildNotificacoesFromEtapa(novaEtapa.id, etapaDestino, regra)

    return {
      etapaFinalizada: atualFinalizada,
      novaEtapa,
      regraAplicada: regra,
      etapaDestino,
      historicos,
      notificacoes
    }
  },
  calcularPrazoVencimento: (tipoTramitacaoId: string): Date => {
    const tipoTramitacao = tipoTramitacaoStore().find(t => t.id === tipoTramitacaoId)
    if (!tipoTramitacao) {
      return new Date()
    }

    const diasUteis = tipoTramitacao.prazoRegimental
    const dataVencimento = new Date()
    let diasAdicionados = 0

    while (diasAdicionados < diasUteis) {
      dataVencimento.setDate(dataVencimento.getDate() + 1)
      const diaSemana = dataVencimento.getDay()
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasAdicionados++
      }
    }

    return dataVencimento
  }
}

export const tramitacaoHistoricosService = {
  getAll: () => [...historicoStore()],
  getByTramitacao: (tramitacaoId: string) => historicoStore().filter(item => item.tramitacaoId === tramitacaoId),
  create: (novoHistorico: Omit<HistoricoTramitacao, 'id' | 'data'>) => {
    const historico = {
      ...novoHistorico,
      id: generateId('tramitacao-historico'),
      data: nowISO()
    }
    historicoStore().push(historico)
    return historico
  },
  deleteByTramitacao: (tramitacaoId: string) => {
    const store = historicoStore()
    for (let i = store.length - 1; i >= 0; i -= 1) {
      if (store[i].tramitacaoId === tramitacaoId) {
        store.splice(i, 1)
      }
    }
  }
}

export const tramitacaoNotificacoesService = {
  getAll: () => [...notificacaoStore()],
  getByTramitacao: (tramitacaoId: string) => notificacaoStore().filter(item => item.tramitacaoId === tramitacaoId),
  create: (novaNotificacao: Omit<TramitacaoNotificacao, 'id' | 'createdAt' | 'updatedAt'>) => {
    const notificacao = setTimestampsForCreate({
      ...novaNotificacao,
      id: generateId('tramitacao-notificacao')
    })
    notificacaoStore().push(notificacao)
    return notificacao
  },
  deleteByTramitacao: (tramitacaoId: string) => {
    const store = notificacaoStore()
    for (let i = store.length - 1; i >= 0; i -= 1) {
      if (store[i].tramitacaoId === tramitacaoId) {
        store.splice(i, 1)
      }
    }
  }
}

export const regrasTramitacaoService = {
  getAll: () => [...regraStore()],
  getById: (id: string) => regraStore().find(regra => regra.id === id) ?? null,
  create: (regra: Omit<RegraTramitacao, 'id' | 'createdAt' | 'updatedAt'>) => {
    const novaRegra = setTimestampsForCreate({
      ...regra,
      id: generateId('regra-tramitacao')
    })
    regraStore().push(novaRegra)
    return novaRegra
  },
  update: (regraAtualizada: RegraTramitacao) => {
    const store = regraStore()
    const index = store.findIndex(regra => regra.id === regraAtualizada.id)
    if (index === -1) {
      throw new Error('Regra de tramitação não encontrada')
    }
    const atualizada = setTimestampsForUpdate(regraAtualizada, store[index])
    store[index] = atualizada
    return atualizada
  },
  delete: (id: string) => {
    const store = regraStore()
    const index = store.findIndex(regra => regra.id === id)
    if (index === -1) {
      throw new Error('Regra de tramitação não encontrada')
    }
    store.splice(index, 1)
  }
}

export const regrasTramitacaoEtapasService = {
  getByRegra: (regraId: string) => regraEtapaStore().filter(etapa => etapa.regraId === regraId).sort((a, b) => a.ordem - b.ordem),
  create: (etapa: Omit<RegraTramitacaoEtapa, 'id' | 'createdAt' | 'updatedAt'>) => {
    const novaEtapa = setTimestampsForCreate({
      ...etapa,
      id: generateId('regra-tramitacao-etapa')
    })
    regraEtapaStore().push(novaEtapa)
    return novaEtapa
  },
  update: (etapaAtualizada: RegraTramitacaoEtapa) => {
    const store = regraEtapaStore()
    const index = store.findIndex(etapa => etapa.id === etapaAtualizada.id)
    if (index === -1) {
      throw new Error('Etapa de regra de tramitação não encontrada')
    }
    const atualizada = setTimestampsForUpdate(etapaAtualizada, store[index])
    store[index] = atualizada
    return atualizada
  },
  deleteByRegra: (regraId: string) => {
    const store = regraEtapaStore()
    for (let i = store.length - 1; i >= 0; i -= 1) {
      if (store[i].regraId === regraId) {
        store.splice(i, 1)
      }
    }
  },
  delete: (id: string) => {
    const store = regraEtapaStore()
    const index = store.findIndex(etapa => etapa.id === id)
    if (index === -1) {
      throw new Error('Etapa de regra de tramitação não encontrada')
    }
    store.splice(index, 1)
  }
}

export const configuracoesTramitacaoService = {
  getAll: () => [...configuracaoStore()],
  getByChave: (chave: string) => configuracaoStore().find(config => config.chave === chave) ?? null,
  upsert: (configuracao: Omit<ConfiguracaoTramitacao, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const store = configuracaoStore()
    const index = configuracao.id ? store.findIndex(config => config.id === configuracao.id) : -1
    if (index === -1) {
      const novaConfiguracao = setTimestampsForCreate({
        ...configuracao,
        id: configuracao.id ?? generateId('config-tramitacao')
      })
      store.push(novaConfiguracao)
      return novaConfiguracao
    }

    const atualizada = setTimestampsForUpdate(configuracao as ConfiguracaoTramitacao, store[index])
    store[index] = atualizada
    return atualizada
  }
}
