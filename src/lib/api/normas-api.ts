/**
 * Cliente API para Normas Juridicas
 */

export interface NormaJuridicaApi {
  id: string
  tipo: string
  numero: number
  ano: number
  data: string
  dataPublicacao?: string
  dataVigencia?: string
  ementa: string
  preambulo?: string
  texto: string
  textoCompilado?: string
  situacao: string
  assunto?: string
  indexacao?: string
  observacao?: string
  proposicaoOrigemId?: string
  createdAt: string
  updatedAt: string
  artigos?: ArtigoNormaApi[]
  versoes?: VersaoNormaApi[]
  alteracoesRecebidas?: AlteracaoNormaApi[]
  alteracoesFeitas?: AlteracaoNormaApi[]
  _count?: {
    artigos: number
    alteracoesRecebidas: number
    versoes: number
  }
}

export interface ArtigoNormaApi {
  id: string
  normaId: string
  numero: string
  caput: string
  vigente: boolean
  revogadoPor?: string
  alteradoPor?: string
  textoOriginal?: string
  paragrafos?: ParagrafoNormaApi[]
}

export interface ParagrafoNormaApi {
  id: string
  artigoId: string
  tipo: string
  numero?: string
  texto: string
  vigente: boolean
}

export interface AlteracaoNormaApi {
  id: string
  normaAlteradaId: string
  normaAlteradoraId: string
  tipoAlteracao: string
  artigoAlterado?: string
  descricao?: string
  dataAlteracao: string
  normaAlterada?: {
    id: string
    tipo: string
    numero: number
    ano: number
    ementa: string
  }
  normaAlteradora?: {
    id: string
    tipo: string
    numero: number
    ano: number
    ementa: string
  }
}

export interface VersaoNormaApi {
  id: string
  normaId: string
  versao: number
  textoCompleto: string
  motivoAlteracao?: string
  dataVersao: string
}

export interface CriarNormaInput {
  tipo: 'LEI_ORDINARIA' | 'LEI_COMPLEMENTAR' | 'DECRETO_LEGISLATIVO' | 'RESOLUCAO' | 'EMENDA_LEI_ORGANICA' | 'LEI_ORGANICA' | 'REGIMENTO_INTERNO'
  numero: string
  ano: number
  data: string
  dataPublicacao?: string
  dataVigencia?: string
  ementa: string
  preambulo?: string
  texto: string
  assunto?: string
  indexacao?: string
  observacao?: string
  proposicaoOrigemId?: string
}

export interface AtualizarNormaInput {
  situacao?: 'VIGENTE' | 'REVOGADA' | 'REVOGADA_PARCIALMENTE' | 'COM_ALTERACOES' | 'SUSPENSA'
  ementa?: string
  texto?: string
  textoCompilado?: string
  assunto?: string
  indexacao?: string
  observacao?: string
}

export interface CriarArtigoInput {
  numero: string
  caput: string
  vigente?: boolean
}

export interface CriarParagrafoInput {
  artigoId: string
  tipo: 'PARAGRAFO' | 'INCISO' | 'ALINEA'
  numero?: string
  texto: string
  vigente?: boolean
}

export interface RegistrarAlteracaoInput {
  normaAlteradoraId: string
  tipoAlteracao: 'REVOGACAO_TOTAL' | 'REVOGACAO_PARCIAL' | 'ALTERACAO' | 'ACRESCIMO'
  artigoAlterado?: string
  descricao: string
}

export interface FiltrosNorma {
  tipo?: string
  situacao?: string
  ano?: number
  busca?: string
  page?: number
  limit?: number
}

export interface ListaNormasResponse {
  normas: NormaJuridicaApi[]
  total: number
  page: number
  totalPages: number
}

export interface EstatisticasNormas {
  ano: number
  total: number
  porTipo: Array<{ tipo: string; quantidade: number }>
  porSituacao: Array<{ situacao: string; quantidade: number }>
}

export interface TextoCompiladoResponse {
  normaId: string
  tipo: string
  numero: string
  ano: number
  ementa: string
  preambulo?: string
  dispositivos: Array<{
    tipo: string
    numero?: string
    texto: string
    vigente: boolean
    alteradoPor?: string
    revogadoPor?: string
    filhos?: Array<{
      tipo: string
      numero?: string
      texto: string
      vigente: boolean
    }>
  }>
  textoCompleto: string
  alteracoes: Array<{
    normaAlteradora: string
    tipoAlteracao: string
    artigoAlterado?: string
    descricao: string
    data: string
  }>
  versao: number
  compiladoEm: string
}

export interface ComparacaoVersoesResponse {
  versaoAnterior: {
    versao: number
    data: string
    motivo?: string
  }
  versaoPosterior: {
    versao: number
    data: string
    motivo?: string
  }
  totalDiferencas: number
  diferencas: Array<{
    tipo: 'adicionado' | 'removido' | 'modificado'
    linha: number
    textoAnterior?: string
    textoNovo?: string
  }>
}

const BASE_URL = '/api/normas'

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Erro na requisicao')
  }
  return data.data
}

/**
 * Lista normas com filtros
 */
export async function listarNormas(
  filtros?: FiltrosNorma
): Promise<ListaNormasResponse> {
  const params = new URLSearchParams()

  if (filtros?.tipo) params.set('tipo', filtros.tipo)
  if (filtros?.situacao) params.set('situacao', filtros.situacao)
  if (filtros?.ano) params.set('ano', filtros.ano.toString())
  if (filtros?.busca) params.set('busca', filtros.busca)
  if (filtros?.page) params.set('page', filtros.page.toString())
  if (filtros?.limit) params.set('limit', filtros.limit.toString())

  const response = await fetch(`${BASE_URL}?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Busca norma por ID
 */
export async function buscarNorma(id: string): Promise<NormaJuridicaApi> {
  const response = await fetch(`${BASE_URL}/${id}`)
  return handleResponse(response)
}

/**
 * Cria nova norma juridica
 */
export async function criarNorma(
  input: CriarNormaInput
): Promise<NormaJuridicaApi> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Atualiza norma
 */
export async function atualizarNorma(
  id: string,
  input: AtualizarNormaInput
): Promise<NormaJuridicaApi> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Adiciona artigo a norma
 */
export async function adicionarArtigo(
  normaId: string,
  input: CriarArtigoInput
): Promise<ArtigoNormaApi> {
  const response = await fetch(`${BASE_URL}/${normaId}?acao=artigo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Adiciona paragrafo/inciso/alinea a um artigo
 */
export async function adicionarParagrafo(
  normaId: string,
  input: CriarParagrafoInput
): Promise<ParagrafoNormaApi> {
  const response = await fetch(`${BASE_URL}/${normaId}?acao=paragrafo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Registra alteracao em norma
 */
export async function registrarAlteracao(
  normaAlteradaId: string,
  input: RegistrarAlteracaoInput
): Promise<AlteracaoNormaApi> {
  const response = await fetch(`${BASE_URL}/${normaAlteradaId}?acao=alteracao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Busca texto compilado da norma
 */
export async function getTextoCompilado(
  normaId: string
): Promise<TextoCompiladoResponse> {
  const response = await fetch(`${BASE_URL}/${normaId}?acao=compilado`)
  return handleResponse(response)
}

/**
 * Executa compilacao da norma
 */
export async function compilarNorma(
  normaId: string
): Promise<TextoCompiladoResponse> {
  const response = await fetch(`${BASE_URL}/${normaId}?acao=compilar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return handleResponse(response)
}

/**
 * Busca historico de versoes
 */
export async function buscarVersoes(
  normaId: string
): Promise<VersaoNormaApi[]> {
  const response = await fetch(`${BASE_URL}/${normaId}?acao=versoes`)
  return handleResponse(response)
}

/**
 * Busca versao especifica
 */
export async function buscarVersao(
  normaId: string,
  versao: number
): Promise<VersaoNormaApi> {
  const response = await fetch(`${BASE_URL}/${normaId}?acao=versao&numero=${versao}`)
  return handleResponse(response)
}

/**
 * Compara duas versoes
 */
export async function compararVersoes(
  normaId: string,
  versaoA: number,
  versaoB: number
): Promise<ComparacaoVersoesResponse> {
  const response = await fetch(
    `${BASE_URL}/${normaId}?acao=comparar&versaoA=${versaoA}&versaoB=${versaoB}`
  )
  return handleResponse(response)
}

/**
 * Indexa norma para busca
 */
export async function indexarNorma(normaId: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/${normaId}?acao=indexar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  const result = await handleResponse<{ indexacao: string }>(response)
  return result.indexacao
}

/**
 * Busca full-text em normas (publico)
 */
export async function buscarNormasFullText(
  termo: string
): Promise<NormaJuridicaApi[]> {
  const response = await fetch(`${BASE_URL}?acao=busca&termo=${encodeURIComponent(termo)}`)
  return handleResponse(response)
}

/**
 * Busca estatisticas de normas
 */
export async function getEstatisticasNormas(
  ano?: number
): Promise<EstatisticasNormas> {
  const params = new URLSearchParams()
  params.set('acao', 'estatisticas')
  if (ano) params.set('ano', ano.toString())

  const response = await fetch(`${BASE_URL}?${params.toString()}`)
  return handleResponse(response)
}
