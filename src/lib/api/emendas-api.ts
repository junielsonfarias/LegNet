/**
 * Cliente API para Emendas
 */

export interface EmendaApi {
  id: string
  proposicaoId: string
  autorId: string
  coautores: string[]
  tipo: string
  numero: string
  artigo?: string
  paragrafo?: string
  inciso?: string
  alinea?: string
  textoOriginal?: string
  textoNovo: string
  justificativa: string
  status: string
  turnoApresentacao: number
  dataVotacao?: string
  resultado?: string
  votos?: Record<string, number>
  parecerComissao?: string
  parecerTipo?: string
  parecerTexto?: string
  aglutinada: boolean
  emendaAglutinadaId?: string
  createdAt: string
  autor?: {
    id: string
    nome: string
    partido?: string
    foto?: string
  }
  proposicao?: {
    id: string
    numero: string
    ano: number
    titulo: string
    tipo: string
  }
  _count?: {
    votos: number
  }
}

export interface CriarEmendaInput {
  autorId: string
  coautores?: string[]
  tipo: 'ADITIVA' | 'MODIFICATIVA' | 'SUPRESSIVA' | 'SUBSTITUTIVA' | 'EMENDA_DE_REDACAO'
  artigo?: string
  paragrafo?: string
  inciso?: string
  alinea?: string
  textoOriginal?: string
  textoNovo: string
  justificativa: string
  turnoApresentacao?: number
}

export interface AtualizarEmendaInput {
  status?: 'APRESENTADA' | 'EM_ANALISE' | 'APROVADA' | 'REJEITADA' | 'PREJUDICADA' | 'RETIRADA' | 'INCORPORADA'
  parecerComissao?: string
  parecerTipo?: 'FAVORAVEL' | 'CONTRARIO' | 'FAVORAVEL_COM_RESSALVAS'
  parecerTexto?: string
}

export interface VotoEmendaInput {
  parlamentarId: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE' | 'OBSTRUCAO'
}

export interface AglutinarEmendasInput {
  proposicaoId: string
  emendasIds: string[]
  autorId: string
  textoNovo: string
  justificativa: string
}

export interface EstatisticasEmendas {
  total: number
  porStatus: Array<{ status: string; quantidade: number }>
  porTipo: Array<{ tipo: string; quantidade: number }>
}

export interface PrazoEmendas {
  prazoDeterminado: boolean
  prazo?: string
  podeCadastrar: boolean
  prazoVencido?: boolean
}

export interface TextoConsolidado {
  proposicao: {
    id: string
    numero: string
    ano: number
    titulo: string
    ementa: string
    textoIntegral?: string
  }
  textoOriginal?: string
  emendasAprovadas: number
  alteracoes: Array<{
    numero: string
    tipo: string
    referencia: string
    textoOriginal?: string
    textoNovo: string
    justificativa: string
  }>
  geradoEm: string
}

export interface ResultadoVotacaoEmenda {
  total: number
  votosValidos: number
  contagem: Record<string, number>
  aprovada: boolean
  resultado: string
}

const BASE_URL = '/api'

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Erro na requisição')
  }
  return data.data
}

/**
 * Lista emendas de uma proposição
 */
export async function listarEmendasProposicao(
  proposicaoId: string,
  turno?: number
): Promise<EmendaApi[]> {
  const params = new URLSearchParams()
  if (turno) params.set('turno', turno.toString())

  const response = await fetch(
    `${BASE_URL}/proposicoes/${proposicaoId}/emendas?${params.toString()}`
  )
  return handleResponse(response)
}

/**
 * Busca emenda por ID
 */
export async function buscarEmenda(id: string): Promise<EmendaApi> {
  const response = await fetch(`${BASE_URL}/emendas/${id}`)
  return handleResponse(response)
}

/**
 * Cria nova emenda
 */
export async function criarEmenda(
  proposicaoId: string,
  input: CriarEmendaInput
): Promise<EmendaApi> {
  const response = await fetch(`${BASE_URL}/proposicoes/${proposicaoId}/emendas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Atualiza emenda
 */
export async function atualizarEmenda(
  id: string,
  input: AtualizarEmendaInput
): Promise<EmendaApi> {
  const response = await fetch(`${BASE_URL}/emendas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Registra voto em emenda
 */
export async function votarEmenda(
  emendaId: string,
  input: VotoEmendaInput
): Promise<any> {
  const response = await fetch(`${BASE_URL}/emendas/${emendaId}?acao=votar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Finaliza votação de emenda
 */
export async function finalizarVotacaoEmenda(emendaId: string): Promise<{
  emenda: EmendaApi
  apuracao: ResultadoVotacaoEmenda
}> {
  const response = await fetch(`${BASE_URL}/emendas/${emendaId}?acao=finalizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return handleResponse(response)
}

/**
 * Apura resultado de votação
 */
export async function apurarVotacaoEmenda(
  emendaId: string
): Promise<ResultadoVotacaoEmenda> {
  const response = await fetch(`${BASE_URL}/emendas/${emendaId}?acao=apurar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return handleResponse(response)
}

/**
 * Retira emenda
 */
export async function retirarEmenda(
  emendaId: string,
  motivo?: string
): Promise<EmendaApi> {
  const response = await fetch(`${BASE_URL}/emendas/${emendaId}?acao=retirar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo })
  })
  return handleResponse(response)
}

/**
 * Marca emenda como prejudicada
 */
export async function prejudicarEmenda(
  emendaId: string,
  motivo?: string
): Promise<EmendaApi> {
  const response = await fetch(`${BASE_URL}/emendas/${emendaId}?acao=prejudicar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo })
  })
  return handleResponse(response)
}

/**
 * Aglutina emendas
 */
export async function aglutinarEmendas(
  input: AglutinarEmendasInput
): Promise<EmendaApi> {
  const response = await fetch(`${BASE_URL}/emendas/aglutinar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Busca estatísticas de emendas
 */
export async function getEstatisticasEmendas(
  proposicaoId: string
): Promise<EstatisticasEmendas> {
  const response = await fetch(
    `${BASE_URL}/proposicoes/${proposicaoId}/emendas?acao=estatisticas`
  )
  return handleResponse(response)
}

/**
 * Verifica prazo de emendas
 */
export async function verificarPrazoEmendas(
  proposicaoId: string
): Promise<PrazoEmendas> {
  const response = await fetch(
    `${BASE_URL}/proposicoes/${proposicaoId}/emendas?acao=prazo`
  )
  return handleResponse(response)
}

/**
 * Gera texto consolidado com emendas
 */
export async function getTextoConsolidado(
  proposicaoId: string
): Promise<TextoConsolidado> {
  const response = await fetch(
    `${BASE_URL}/proposicoes/${proposicaoId}/emendas?acao=texto-consolidado`
  )
  return handleResponse(response)
}

/**
 * Exclui emenda
 */
export async function excluirEmenda(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/emendas/${id}`, {
    method: 'DELETE'
  })
  await handleResponse(response)
}
