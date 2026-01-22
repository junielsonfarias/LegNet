/**
 * Cliente API para Protocolo Administrativo
 */

export interface ProtocoloApi {
  id: string
  numero: number
  ano: number
  tipo: string
  nomeRemetente: string
  cpfCnpjRemetente?: string
  tipoRemetente: string
  enderecoRemetente?: string
  telefoneRemetente?: string
  emailRemetente?: string
  assunto: string
  descricao?: string
  tipoDocumento?: string
  numeroDocOrigem?: string
  situacao: string
  prazoResposta?: string
  prioridade: string
  sigiloso: boolean
  etiquetaCodigo: string
  dataRecebimento: string
  dataResposta?: string
  createdAt: string
  updatedAt: string
  anexos?: ProtocoloAnexoApi[]
  tramitacoes?: ProtocoloTramitacaoApi[]
  _count?: {
    anexos: number
    tramitacoes: number
  }
}

export interface ProtocoloAnexoApi {
  id: string
  protocoloId: string
  titulo: string
  arquivo: string
  tamanho?: number
  tipoMime?: string
  dataUpload: string
}

export interface ProtocoloTramitacaoApi {
  id: string
  protocoloId: string
  data: string
  unidadeOrigem: string
  unidadeDestino: string
  acao: string
  despacho?: string
  usuarioId?: string
}

export interface CriarProtocoloInput {
  tipo: 'ENTRADA' | 'SAIDA' | 'INTERNO'
  nomeRemetente: string
  cpfCnpjRemetente?: string
  tipoRemetente?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA' | 'ORGAO_PUBLICO' | 'PARLAMENTAR' | 'EXECUTIVO'
  enderecoRemetente?: string
  telefoneRemetente?: string
  emailRemetente?: string
  assunto: string
  descricao?: string
  tipoDocumento?: string
  numeroDocOrigem?: string
  prazoResposta?: string
  prioridade?: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  sigiloso?: boolean
}

export interface AtualizarProtocoloInput {
  situacao?: 'ABERTO' | 'EM_TRAMITACAO' | 'RESPONDIDO' | 'ARQUIVADO' | 'DEVOLVIDO' | 'CANCELADO'
  prazoResposta?: string
  prioridade?: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  descricao?: string
}

export interface TramitarProtocoloInput {
  unidadeOrigem: string
  unidadeDestino: string
  acao: string
  despacho?: string
}

export interface FiltrosProtocolo {
  tipo?: string
  situacao?: string
  prioridade?: string
  ano?: number
  dataInicio?: string
  dataFim?: string
  busca?: string
  page?: number
  limit?: number
}

export interface ListaProtocolosResponse {
  protocolos: ProtocoloApi[]
  total: number
  page: number
  totalPages: number
}

export interface EstatisticasProtocolo {
  ano: number
  total: number
  porTipo: Array<{ tipo: string; quantidade: number }>
  porSituacao: Array<{ situacao: string; quantidade: number }>
  porPrioridade: Array<{ prioridade: string; quantidade: number }>
}

export interface ProtocoloCriado {
  id: string
  numero: number
  ano: number
  etiquetaCodigo: string
}

const BASE_URL = '/api/protocolo'

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Erro na requisicao')
  }
  return data.data
}

/**
 * Lista protocolos com filtros
 */
export async function listarProtocolos(
  filtros?: FiltrosProtocolo
): Promise<ListaProtocolosResponse> {
  const params = new URLSearchParams()

  if (filtros?.tipo) params.set('tipo', filtros.tipo)
  if (filtros?.situacao) params.set('situacao', filtros.situacao)
  if (filtros?.prioridade) params.set('prioridade', filtros.prioridade)
  if (filtros?.ano) params.set('ano', filtros.ano.toString())
  if (filtros?.dataInicio) params.set('dataInicio', filtros.dataInicio)
  if (filtros?.dataFim) params.set('dataFim', filtros.dataFim)
  if (filtros?.busca) params.set('busca', filtros.busca)
  if (filtros?.page) params.set('page', filtros.page.toString())
  if (filtros?.limit) params.set('limit', filtros.limit.toString())

  const response = await fetch(`${BASE_URL}?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Busca protocolo por ID
 */
export async function buscarProtocolo(id: string): Promise<ProtocoloApi> {
  const response = await fetch(`${BASE_URL}/${id}`)
  return handleResponse(response)
}

/**
 * Busca protocolo por codigo de etiqueta
 */
export async function buscarProtocoloPorCodigo(codigo: string): Promise<ProtocoloApi> {
  const response = await fetch(`${BASE_URL}/${codigo}`)
  return handleResponse(response)
}

/**
 * Cria novo protocolo
 */
export async function criarProtocolo(
  input: CriarProtocoloInput
): Promise<ProtocoloCriado> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Atualiza protocolo
 */
export async function atualizarProtocolo(
  id: string,
  input: AtualizarProtocoloInput
): Promise<ProtocoloApi> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Tramita protocolo para outra unidade
 */
export async function tramitarProtocolo(
  id: string,
  input: TramitarProtocoloInput
): Promise<{ tramitacao: ProtocoloTramitacaoApi; protocolo: ProtocoloApi }> {
  const response = await fetch(`${BASE_URL}/${id}?acao=tramitar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Arquiva protocolo
 */
export async function arquivarProtocolo(
  id: string,
  motivo?: string
): Promise<ProtocoloApi> {
  const response = await fetch(`${BASE_URL}/${id}?acao=arquivar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo })
  })
  return handleResponse(response)
}

/**
 * Adiciona anexo ao protocolo
 */
export async function adicionarAnexo(
  protocoloId: string,
  titulo: string,
  arquivo: string,
  tamanho?: number,
  tipoMime?: string
): Promise<ProtocoloAnexoApi> {
  const response = await fetch(`${BASE_URL}/${protocoloId}?acao=anexo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, arquivo, tamanho, tipoMime })
  })
  return handleResponse(response)
}

/**
 * Converte protocolo em proposicao
 */
export async function converterEmProposicao(
  protocoloId: string,
  tipoProposicao: string,
  autorId: string
): Promise<any> {
  const response = await fetch(`${BASE_URL}/${protocoloId}?acao=converter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipoProposicao, autorId })
  })
  return handleResponse(response)
}

/**
 * Busca estatisticas de protocolos
 */
export async function getEstatisticasProtocolo(
  ano?: number
): Promise<EstatisticasProtocolo> {
  const params = new URLSearchParams()
  params.set('acao', 'estatisticas')
  if (ano) params.set('ano', ano.toString())

  const response = await fetch(`${BASE_URL}?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Lista protocolos pendentes de resposta
 */
export async function listarProtocolosPendentes(): Promise<ProtocoloApi[]> {
  const response = await fetch(`${BASE_URL}?acao=pendentes`)
  return handleResponse(response)
}

/**
 * Lista protocolos com prazo vencido
 */
export async function listarProtocolosVencidos(): Promise<ProtocoloApi[]> {
  const response = await fetch(`${BASE_URL}?acao=vencidos`)
  return handleResponse(response)
}
