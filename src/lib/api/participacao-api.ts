/**
 * Cliente API para Participacao Cidada
 * Consultas Publicas e Sugestoes Legislativas
 */

// ============ TIPOS - CONSULTAS PUBLICAS ============

export interface ConsultaPublicaApi {
  id: string
  titulo: string
  descricao: string
  proposicaoId?: string
  dataInicio: string
  dataFim: string
  status: string
  permitirAnonimo: boolean
  requerCadastro: boolean
  moderacao: boolean
  createdAt: string
  updatedAt: string
  perguntas?: PerguntaConsultaApi[]
  _count?: {
    participacoes: number
    perguntas: number
  }
}

export interface PerguntaConsultaApi {
  id: string
  consultaId: string
  ordem: number
  texto: string
  tipo: string
  obrigatoria: boolean
  opcoes?: string
}

export interface ParticipacaoConsultaApi {
  id: string
  consultaId: string
  nome?: string
  email?: string
  cpfHash?: string
  bairro?: string
  createdAt: string
  respostas?: RespostaConsultaApi[]
}

export interface RespostaConsultaApi {
  id: string
  participacaoId: string
  perguntaId: string
  resposta: string
}

export interface ResultadoConsultaApi {
  consulta: {
    id: string
    titulo: string
    status: string
    dataInicio: string
    dataFim: string
  }
  totalParticipacoes: number
  resultadosPorPergunta: Array<{
    perguntaId: string
    texto: string
    tipo: string
    totalRespostas: number
    contagem: Array<{
      resposta: string
      quantidade: number
      percentual: number
    }>
  }>
  participacoesPorBairro: Array<{
    bairro: string
    quantidade: number
  }>
}

// ============ TIPOS - SUGESTOES LEGISLATIVAS ============

export interface SugestaoLegislativaApi {
  id: string
  nome: string
  email: string
  cpfHash: string
  bairro?: string
  telefone?: string
  titulo: string
  descricao: string
  justificativa: string
  categoria?: string
  status: string
  totalApoios: number
  motivoRecusa?: string
  proposicaoId?: string
  parlamentarResponsavelId?: string
  createdAt: string
  updatedAt: string
  parlamentarResponsavel?: {
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
    apoios: number
  }
}

export interface ApoioSugestaoApi {
  id: string
  sugestaoId: string
  nome: string
  email: string
  cpfHash: string
  createdAt: string
}

export interface EstatisticasSugestoesApi {
  total: number
  porStatus: Array<{ status: string; quantidade: number }>
  porCategoria: Array<{ categoria: string; quantidade: number }>
  maisApoiadas: Array<{
    id: string
    titulo: string
    totalApoios: number
    categoria?: string
  }>
}

// ============ INPUTS ============

export interface CriarConsultaInput {
  titulo: string
  descricao: string
  proposicaoId?: string
  dataInicio: string
  dataFim: string
  permitirAnonimo?: boolean
  requerCadastro?: boolean
  moderacao?: boolean
}

export interface CriarPerguntaInput {
  ordem: number
  texto: string
  tipo: 'TEXTO_LIVRE' | 'MULTIPLA_ESCOLHA' | 'ESCALA' | 'SIM_NAO'
  obrigatoria?: boolean
  opcoes?: string[]
}

export interface ParticiparConsultaInput {
  nome?: string
  email?: string
  cpf?: string
  bairro?: string
  respostas: Array<{
    perguntaId: string
    resposta: string
  }>
}

export interface CriarSugestaoInput {
  nome: string
  email: string
  cpf: string
  bairro?: string
  telefone?: string
  titulo: string
  descricao: string
  justificativa: string
  categoria?: string
}

export interface ModerarSugestaoInput {
  status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADA' | 'REJEITADA' | 'CONVERTIDA' | 'ARQUIVADA'
  motivoRecusa?: string
  parlamentarResponsavelId?: string
}

export interface ApoiarSugestaoInput {
  nome: string
  email: string
  cpf: string
}

export interface ConverterSugestaoInput {
  tipoProposicao: string
  autorId: string
}

// ============ FILTROS ============

export interface FiltrosConsulta {
  status?: string
  proposicaoId?: string
  page?: number
  limit?: number
}

export interface FiltrosSugestao {
  status?: string
  categoria?: string
  parlamentarResponsavelId?: string
  page?: number
  limit?: number
}

// ============ RESPONSES ============

export interface ListaConsultasResponse {
  consultas: ConsultaPublicaApi[]
  total: number
  page: number
  totalPages: number
}

export interface ListaSugestoesResponse {
  sugestoes: SugestaoLegislativaApi[]
  total: number
  page: number
  totalPages: number
}

// ============ API CLIENT ============

const BASE_URL = '/api/participacao'

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Erro na requisicao')
  }
  return data.data
}

// ============ CONSULTAS PUBLICAS ============

/**
 * Lista consultas publicas (admin)
 */
export async function listarConsultas(
  filtros?: FiltrosConsulta
): Promise<ListaConsultasResponse> {
  const params = new URLSearchParams()

  if (filtros?.status) params.set('status', filtros.status)
  if (filtros?.proposicaoId) params.set('proposicaoId', filtros.proposicaoId)
  if (filtros?.page) params.set('page', filtros.page.toString())
  if (filtros?.limit) params.set('limit', filtros.limit.toString())

  const response = await fetch(`${BASE_URL}/consultas?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Lista consultas abertas (publico)
 */
export async function listarConsultasAbertas(): Promise<ConsultaPublicaApi[]> {
  const response = await fetch(`${BASE_URL}/consultas?publico=true`)
  return handleResponse(response)
}

/**
 * Busca consulta por ID
 */
export async function buscarConsulta(id: string): Promise<ConsultaPublicaApi> {
  const response = await fetch(`${BASE_URL}/consultas/${id}`)
  return handleResponse(response)
}

/**
 * Cria nova consulta publica
 */
export async function criarConsulta(
  input: CriarConsultaInput
): Promise<ConsultaPublicaApi> {
  const response = await fetch(`${BASE_URL}/consultas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Atualiza status da consulta
 */
export async function atualizarStatusConsulta(
  id: string,
  status: string
): Promise<ConsultaPublicaApi> {
  const response = await fetch(`${BASE_URL}/consultas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  return handleResponse(response)
}

/**
 * Adiciona pergunta a consulta
 */
export async function adicionarPergunta(
  consultaId: string,
  input: CriarPerguntaInput
): Promise<PerguntaConsultaApi> {
  const response = await fetch(`${BASE_URL}/consultas/${consultaId}?acao=pergunta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Remove pergunta da consulta
 */
export async function removerPergunta(
  consultaId: string,
  perguntaId: string
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/consultas/${consultaId}?perguntaId=${perguntaId}`,
    { method: 'DELETE' }
  )
  await handleResponse(response)
}

/**
 * Participa de consulta publica
 */
export async function participarConsulta(
  consultaId: string,
  input: ParticiparConsultaInput
): Promise<ParticipacaoConsultaApi> {
  const response = await fetch(`${BASE_URL}/consultas/${consultaId}?acao=participar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Publica consulta
 */
export async function publicarConsulta(
  consultaId: string
): Promise<ConsultaPublicaApi> {
  const response = await fetch(`${BASE_URL}/consultas/${consultaId}?acao=publicar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return handleResponse(response)
}

/**
 * Encerra consulta
 */
export async function encerrarConsulta(
  consultaId: string
): Promise<ConsultaPublicaApi> {
  const response = await fetch(`${BASE_URL}/consultas/${consultaId}?acao=encerrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return handleResponse(response)
}

/**
 * Busca resultados da consulta
 */
export async function buscarResultadosConsulta(
  consultaId: string
): Promise<ResultadoConsultaApi> {
  const response = await fetch(`${BASE_URL}/consultas/${consultaId}?acao=resultados`)
  return handleResponse(response)
}

// ============ SUGESTOES LEGISLATIVAS ============

/**
 * Lista sugestoes (admin)
 */
export async function listarSugestoes(
  filtros?: FiltrosSugestao
): Promise<ListaSugestoesResponse> {
  const params = new URLSearchParams()

  if (filtros?.status) params.set('status', filtros.status)
  if (filtros?.categoria) params.set('categoria', filtros.categoria)
  if (filtros?.parlamentarResponsavelId) {
    params.set('parlamentarResponsavelId', filtros.parlamentarResponsavelId)
  }
  if (filtros?.page) params.set('page', filtros.page.toString())
  if (filtros?.limit) params.set('limit', filtros.limit.toString())

  const response = await fetch(`${BASE_URL}/sugestoes?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Lista sugestoes publicas (aprovadas)
 */
export async function listarSugestoesPublicas(
  page?: number,
  limit?: number
): Promise<ListaSugestoesResponse> {
  const params = new URLSearchParams()
  params.set('publico', 'true')
  if (page) params.set('page', page.toString())
  if (limit) params.set('limit', limit.toString())

  const response = await fetch(`${BASE_URL}/sugestoes?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Busca sugestao por ID
 */
export async function buscarSugestao(id: string): Promise<SugestaoLegislativaApi> {
  const response = await fetch(`${BASE_URL}/sugestoes/${id}`)
  return handleResponse(response)
}

/**
 * Cria nova sugestao legislativa (publico)
 */
export async function criarSugestao(
  input: CriarSugestaoInput
): Promise<SugestaoLegislativaApi> {
  const response = await fetch(`${BASE_URL}/sugestoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Modera sugestao (admin)
 */
export async function moderarSugestao(
  id: string,
  input: ModerarSugestaoInput
): Promise<SugestaoLegislativaApi> {
  const response = await fetch(`${BASE_URL}/sugestoes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Apoia sugestao (publico)
 */
export async function apoiarSugestao(
  sugestaoId: string,
  input: ApoiarSugestaoInput
): Promise<ApoioSugestaoApi> {
  const response = await fetch(`${BASE_URL}/sugestoes/${sugestaoId}?acao=apoiar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Remove apoio de sugestao
 */
export async function removerApoio(
  sugestaoId: string,
  cpf: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/sugestoes/${sugestaoId}?acao=remover-apoio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf })
  })
  await handleResponse(response)
}

/**
 * Converte sugestao em proposicao (admin)
 */
export async function converterSugestaoEmProposicao(
  sugestaoId: string,
  input: ConverterSugestaoInput
): Promise<any> {
  const response = await fetch(`${BASE_URL}/sugestoes/${sugestaoId}?acao=converter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Busca estatisticas de sugestoes
 */
export async function getEstatisticasSugestoes(): Promise<EstatisticasSugestoesApi> {
  const response = await fetch(`${BASE_URL}/sugestoes?acao=estatisticas`)
  return handleResponse(response)
}
