/**
 * Matriz oficial de criterios PNTP 2026 aplicaveis a Camaras Municipais.
 * Fonte: docs/PNTP/criterios_de_avaliacao_pntp_2026/Matriz de Criterios 2026 (Final).xlsx
 * Total: 83 criterios em 16 dimensoes (60 COMUM + 8 COMUM-exc-Estatais +
 * 4 COMUM-exc-Estatais-Indep + 11 PODER LEGISLATIVO).
 *
 * Pesos das dimensoes (definidos pela Atricon):
 *  Receita, Despesa, Planejamento = 4
 *  RH, Licitacoes, Contratos, Atividades Finalisticas = 3
 *  Prioritarias, Institucionais, Obras, SIC = 2
 *  Convenios, Diarias, Acessibilidade, Ouvidoria, LGPD = 1
 *
 * Pesos das classificacoes:
 *  Essencial = 2  |  Obrigatoria = 1.5  |  Recomendada = 1
 *
 * Pesos dos itens de verificacao:
 *  Disponibilidade = 30%  (eliminatorio do criterio)
 *  Atualidade = 30%
 *  Serie Historica = 20%
 *  Gravacao de Relatorios = 10%
 *  Filtro de Pesquisa = 10%
 */

export type Classificacao = 'ESSENCIAL' | 'OBRIGATORIA' | 'RECOMENDADA'

export interface Criterio {
  id: string
  dimensao: number
  dimensaoNome: string
  classificacao: Classificacao
  titulo: string
  itensVerificacao: {
    disponibilidade: boolean
    atualidade: boolean
    serieHistorica: boolean
    gravacaoRelatorios: boolean
    filtroPesquisa: boolean
  }
}

const SO_DISP = {
  disponibilidade: true,
  atualidade: false,
  serieHistorica: false,
  gravacaoRelatorios: false,
  filtroPesquisa: false,
} as const

const TODOS = {
  disponibilidade: true,
  atualidade: true,
  serieHistorica: true,
  gravacaoRelatorios: true,
  filtroPesquisa: true,
} as const

const DAFG = {
  disponibilidade: true,
  atualidade: true,
  serieHistorica: false,
  gravacaoRelatorios: true,
  filtroPesquisa: true,
} as const

const DASF = {
  disponibilidade: true,
  atualidade: true,
  serieHistorica: true,
  gravacaoRelatorios: false,
  filtroPesquisa: true,
} as const

export const DIMENSOES: Record<number, { nome: string; peso: number }> = {
  1: { nome: 'Informacoes Prioritarias', peso: 2 },
  2: { nome: 'Informacoes Institucionais', peso: 2 },
  3: { nome: 'Receita', peso: 4 },
  4: { nome: 'Despesa', peso: 4 },
  5: { nome: 'Convenios e Transferencias', peso: 1 },
  6: { nome: 'Recursos Humanos', peso: 3 },
  7: { nome: 'Diarias', peso: 1 },
  8: { nome: 'Licitacoes', peso: 3 },
  9: { nome: 'Contratos', peso: 3 },
  10: { nome: 'Obras', peso: 2 },
  11: { nome: 'Planejamento e Prestacao de Contas', peso: 4 },
  12: { nome: 'Servico de Informacao ao Cidadao', peso: 2 },
  13: { nome: 'Acessibilidade', peso: 1 },
  14: { nome: 'Ouvidoria', peso: 1 },
  15: { nome: 'LGPD e Governo Digital', peso: 1 },
  20: { nome: 'Atividades Finalisticas - Poder Legislativo', peso: 3 },
}

export const CRITERIOS_PNTP_CAMARA: Criterio[] = [
  // Dimensao 1 - Informacoes Prioritarias
  { id: '1.1', dimensao: 1, dimensaoNome: 'Informacoes Prioritarias', classificacao: 'ESSENCIAL', titulo: 'Possui sitio oficial proprio na internet?', itensVerificacao: SO_DISP },
  { id: '1.2', dimensao: 1, dimensaoNome: 'Informacoes Prioritarias', classificacao: 'ESSENCIAL', titulo: 'Possui portal da transparencia proprio ou compartilhado?', itensVerificacao: SO_DISP },
  { id: '1.3', dimensao: 1, dimensaoNome: 'Informacoes Prioritarias', classificacao: 'OBRIGATORIA', titulo: 'O acesso ao portal transparencia esta visivel na capa do site?', itensVerificacao: SO_DISP },
  { id: '1.4', dimensao: 1, dimensaoNome: 'Informacoes Prioritarias', classificacao: 'OBRIGATORIA', titulo: 'O site e o portal contem ferramenta de pesquisa de conteudo?', itensVerificacao: SO_DISP },
  // Dimensao 2 - Institucionais
  { id: '2.1', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'OBRIGATORIA', titulo: 'Divulga estrutura organizacional e a norma que a institui?', itensVerificacao: SO_DISP },
  { id: '2.2', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'OBRIGATORIA', titulo: 'Divulga competencias e/ou atribuicoes?', itensVerificacao: SO_DISP },
  { id: '2.3', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'OBRIGATORIA', titulo: 'Identifica responsaveis pela gestao do Poder/Orgao?', itensVerificacao: SO_DISP },
  { id: '2.4', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'OBRIGATORIA', titulo: 'Divulga enderecos, telefones e emails institucionais?', itensVerificacao: SO_DISP },
  { id: '2.5', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'OBRIGATORIA', titulo: 'Divulga horario de atendimento?', itensVerificacao: SO_DISP },
  { id: '2.6', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'OBRIGATORIA', titulo: 'Divulga atos normativos proprios?', itensVerificacao: SO_DISP },
  { id: '2.7', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'OBRIGATORIA', titulo: 'Divulga perguntas e respostas frequentes (FAQ)?', itensVerificacao: SO_DISP },
  { id: '2.8', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'RECOMENDADA', titulo: 'Participa em redes sociais com link no site?', itensVerificacao: SO_DISP },
  { id: '2.9', dimensao: 2, dimensaoNome: 'Informacoes Institucionais', classificacao: 'RECOMENDADA', titulo: 'Inclui botao do Radar da Transparencia Publica?', itensVerificacao: SO_DISP },
  // Dimensao 3 - Receita
  { id: '3.1', dimensao: 3, dimensaoNome: 'Receita', classificacao: 'ESSENCIAL', titulo: 'Divulga receitas evidenciando previsao e realizacao?', itensVerificacao: TODOS },
  // Dimensao 4 - Despesa (essenciais)
  { id: '4.1', dimensao: 4, dimensaoNome: 'Despesa', classificacao: 'ESSENCIAL', titulo: 'Divulga total das despesas empenhadas, liquidadas e pagas?', itensVerificacao: TODOS },
  { id: '4.2', dimensao: 4, dimensaoNome: 'Despesa', classificacao: 'ESSENCIAL', titulo: 'Divulga despesas por classificacao orcamentaria?', itensVerificacao: TODOS },
  { id: '4.3', dimensao: 4, dimensaoNome: 'Despesa', classificacao: 'ESSENCIAL', titulo: 'Possibilita consulta de empenhos com beneficiario, valor e licitacao?', itensVerificacao: TODOS },
  // Dimensao 5 - Convenios
  { id: '5.1', dimensao: 5, dimensaoNome: 'Convenios e Transferencias', classificacao: 'OBRIGATORIA', titulo: 'Divulga transferencias recebidas?', itensVerificacao: TODOS },
  { id: '5.2', dimensao: 5, dimensaoNome: 'Convenios e Transferencias', classificacao: 'OBRIGATORIA', titulo: 'Divulga transferencias realizadas?', itensVerificacao: TODOS },
  { id: '5.3', dimensao: 5, dimensaoNome: 'Convenios e Transferencias', classificacao: 'OBRIGATORIA', titulo: 'Divulga acordos sem transferencia financeira?', itensVerificacao: TODOS },
  // Dimensao 6 - RH
  { id: '6.1', dimensao: 6, dimensaoNome: 'Recursos Humanos', classificacao: 'OBRIGATORIA', titulo: 'Divulga relacao nominal de servidores/autoridades/membros?', itensVerificacao: DASF },
  { id: '6.2', dimensao: 6, dimensaoNome: 'Recursos Humanos', classificacao: 'OBRIGATORIA', titulo: 'Divulga remuneracao nominal?', itensVerificacao: DASF },
  { id: '6.3', dimensao: 6, dimensaoNome: 'Recursos Humanos', classificacao: 'OBRIGATORIA', titulo: 'Divulga tabela com padrao remuneratorio dos cargos?', itensVerificacao: SO_DISP },
  { id: '6.4', dimensao: 6, dimensaoNome: 'Recursos Humanos', classificacao: 'RECOMENDADA', titulo: 'Divulga lista de estagiarios?', itensVerificacao: DASF },
  { id: '6.5', dimensao: 6, dimensaoNome: 'Recursos Humanos', classificacao: 'RECOMENDADA', titulo: 'Publica lista de terceirizados?', itensVerificacao: DASF },
  { id: '6.6', dimensao: 6, dimensaoNome: 'Recursos Humanos', classificacao: 'OBRIGATORIA', titulo: 'Divulga integra dos editais de concursos publicos?', itensVerificacao: TODOS },
  { id: '6.7', dimensao: 6, dimensaoNome: 'Recursos Humanos', classificacao: 'OBRIGATORIA', titulo: 'Divulga demais atos dos concursos publicos?', itensVerificacao: TODOS },
  // Dimensao 7 - Diarias
  { id: '7.1', dimensao: 7, dimensaoNome: 'Diarias', classificacao: 'OBRIGATORIA', titulo: 'Divulga diarias com beneficiario, motivo, destino?', itensVerificacao: TODOS },
  { id: '7.2', dimensao: 7, dimensaoNome: 'Diarias', classificacao: 'OBRIGATORIA', titulo: 'Divulga tabela com valores das diarias?', itensVerificacao: SO_DISP },
  // Dimensao 8 - Licitacoes
  { id: '8.1', dimensao: 8, dimensaoNome: 'Licitacoes', classificacao: 'OBRIGATORIA', titulo: 'Divulga relacao das licitacoes em ordem sequencial?', itensVerificacao: TODOS },
  { id: '8.2', dimensao: 8, dimensaoNome: 'Licitacoes', classificacao: 'OBRIGATORIA', titulo: 'Divulga integra dos editais de licitacao?', itensVerificacao: TODOS },
  { id: '8.3', dimensao: 8, dimensaoNome: 'Licitacoes', classificacao: 'OBRIGATORIA', titulo: 'Divulga integra dos documentos das fases interna e externa?', itensVerificacao: TODOS },
  { id: '8.4', dimensao: 8, dimensaoNome: 'Licitacoes', classificacao: 'OBRIGATORIA', titulo: 'Divulga documentos de dispensa e inexigibilidade?', itensVerificacao: TODOS },
  { id: '8.5', dimensao: 8, dimensaoNome: 'Licitacoes', classificacao: 'OBRIGATORIA', titulo: 'Divulga integra das Atas de Adesao a SRP?', itensVerificacao: TODOS },
  { id: '8.6', dimensao: 8, dimensaoNome: 'Licitacoes', classificacao: 'RECOMENDADA', titulo: 'Divulga plano de contratacoes anual (PCA)?', itensVerificacao: TODOS },
  { id: '8.7', dimensao: 8, dimensaoNome: 'Licitacoes', classificacao: 'RECOMENDADA', titulo: 'Divulga relacao dos licitantes/contratados sancionados?', itensVerificacao: TODOS },
  // Dimensao 9 - Contratos
  { id: '9.1', dimensao: 9, dimensaoNome: 'Contratos', classificacao: 'OBRIGATORIA', titulo: 'Divulga relacao dos contratos celebrados?', itensVerificacao: TODOS },
  { id: '9.2', dimensao: 9, dimensaoNome: 'Contratos', classificacao: 'OBRIGATORIA', titulo: 'Divulga integra dos contratos e termos aditivos?', itensVerificacao: TODOS },
  { id: '9.3', dimensao: 9, dimensaoNome: 'Contratos', classificacao: 'OBRIGATORIA', titulo: 'Divulga lista dos fiscais de cada contrato?', itensVerificacao: SO_DISP },
  { id: '9.4', dimensao: 9, dimensaoNome: 'Contratos', classificacao: 'OBRIGATORIA', titulo: 'Divulga ordem cronologica de pagamentos?', itensVerificacao: TODOS },
  // Dimensao 10 - Obras
  { id: '10.1', dimensao: 10, dimensaoNome: 'Obras', classificacao: 'RECOMENDADA', titulo: 'Divulga informacoes sobre as obras?', itensVerificacao: TODOS },
  { id: '10.2', dimensao: 10, dimensaoNome: 'Obras', classificacao: 'OBRIGATORIA', titulo: 'Divulga quantitativos, precos unitarios e totais contratados?', itensVerificacao: SO_DISP },
  { id: '10.3', dimensao: 10, dimensaoNome: 'Obras', classificacao: 'OBRIGATORIA', titulo: 'Divulga quantitativos executados e precos efetivamente pagos?', itensVerificacao: SO_DISP },
  { id: '10.4', dimensao: 10, dimensaoNome: 'Obras', classificacao: 'OBRIGATORIA', titulo: 'Divulga relacao das obras paralisadas?', itensVerificacao: SO_DISP },
  // Dimensao 11 - Planejamento
  { id: '11.1', dimensao: 11, dimensaoNome: 'Planejamento e Prestacao de Contas', classificacao: 'OBRIGATORIA', titulo: 'Publica Prestacao de Contas do Ano Anterior (Balanco Geral)?', itensVerificacao: DASF },
  { id: '11.2', dimensao: 11, dimensaoNome: 'Planejamento e Prestacao de Contas', classificacao: 'OBRIGATORIA', titulo: 'Divulga Relatorio de Gestao ou Atividades?', itensVerificacao: DASF },
  { id: '11.3', dimensao: 11, dimensaoNome: 'Planejamento e Prestacao de Contas', classificacao: 'OBRIGATORIA', titulo: 'Divulga integra da decisao do TC sobre as contas?', itensVerificacao: DASF },
  { id: '11.5', dimensao: 11, dimensaoNome: 'Planejamento e Prestacao de Contas', classificacao: 'ESSENCIAL', titulo: 'Divulga Relatorio de Gestao Fiscal (RGF)?', itensVerificacao: DASF },
  { id: '11.7', dimensao: 11, dimensaoNome: 'Planejamento e Prestacao de Contas', classificacao: 'RECOMENDADA', titulo: 'Divulga plano estrategico institucional?', itensVerificacao: SO_DISP },
  // Dimensao 12 - SIC
  { id: '12.1', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'OBRIGATORIA', titulo: 'Existe o SIC no portal com unidade responsavel?', itensVerificacao: SO_DISP },
  { id: '12.2', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'OBRIGATORIA', titulo: 'Indica endereco fisico, telefone, email e horario do SIC?', itensVerificacao: SO_DISP },
  { id: '12.3', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'OBRIGATORIA', titulo: 'Possibilita pedidos de informacao eletronicos (e-SIC)?', itensVerificacao: SO_DISP },
  { id: '12.4', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'OBRIGATORIA', titulo: 'A solicitacao por e-SIC e simples (sem barreiras)?', itensVerificacao: SO_DISP },
  { id: '12.5', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'OBRIGATORIA', titulo: 'Divulga instrumento normativo local que regulamenta a LAI?', itensVerificacao: SO_DISP },
  { id: '12.6', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'RECOMENDADA', titulo: 'Divulga prazos de resposta, recurso e autoridades competentes?', itensVerificacao: SO_DISP },
  { id: '12.7', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'OBRIGATORIA', titulo: 'Divulga relatorio anual estatistico do SIC?', itensVerificacao: SO_DISP },
  { id: '12.8', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'OBRIGATORIA', titulo: 'Divulga lista de documentos classificados?', itensVerificacao: SO_DISP },
  { id: '12.9', dimensao: 12, dimensaoNome: 'SIC', classificacao: 'OBRIGATORIA', titulo: 'Divulga lista de informacoes desclassificadas nos ultimos 12 meses?', itensVerificacao: SO_DISP },
  // Dimensao 13 - Acessibilidade
  { id: '13.1', dimensao: 13, dimensaoNome: 'Acessibilidade', classificacao: 'OBRIGATORIA', titulo: 'O site contem simbolo de acessibilidade em destaque?', itensVerificacao: SO_DISP },
  { id: '13.2', dimensao: 13, dimensaoNome: 'Acessibilidade', classificacao: 'OBRIGATORIA', titulo: 'Contem exibicao do caminho de paginas (breadcrumb)?', itensVerificacao: SO_DISP },
  { id: '13.3', dimensao: 13, dimensaoNome: 'Acessibilidade', classificacao: 'OBRIGATORIA', titulo: 'Contem opcao de alto contraste?', itensVerificacao: SO_DISP },
  { id: '13.4', dimensao: 13, dimensaoNome: 'Acessibilidade', classificacao: 'OBRIGATORIA', titulo: 'Contem ferramenta de redimensionamento de texto?', itensVerificacao: SO_DISP },
  { id: '13.5', dimensao: 13, dimensaoNome: 'Acessibilidade', classificacao: 'RECOMENDADA', titulo: 'Contem mapa do site institucional?', itensVerificacao: SO_DISP },
  // Dimensao 14 - Ouvidoria
  { id: '14.1', dimensao: 14, dimensaoNome: 'Ouvidoria', classificacao: 'OBRIGATORIA', titulo: 'Ha informacoes sobre atendimento presencial?', itensVerificacao: SO_DISP },
  { id: '14.2', dimensao: 14, dimensaoNome: 'Ouvidoria', classificacao: 'OBRIGATORIA', titulo: 'Ha canal eletronico de acesso a ouvidoria?', itensVerificacao: SO_DISP },
  { id: '14.3', dimensao: 14, dimensaoNome: 'Ouvidoria', classificacao: 'OBRIGATORIA', titulo: 'Divulga Carta de Servicos ao Usuario?', itensVerificacao: SO_DISP },
  // Dimensao 15 - LGPD
  { id: '15.1', dimensao: 15, dimensaoNome: 'LGPD e Governo Digital', classificacao: 'OBRIGATORIA', titulo: 'Identifica o encarregado (DPO) e canal de contato?', itensVerificacao: SO_DISP },
  { id: '15.2', dimensao: 15, dimensaoNome: 'LGPD e Governo Digital', classificacao: 'RECOMENDADA', titulo: 'Publica Politica de Privacidade e Protecao de Dados?', itensVerificacao: SO_DISP },
  { id: '15.3', dimensao: 15, dimensaoNome: 'LGPD e Governo Digital', classificacao: 'OBRIGATORIA', titulo: 'Possibilita demanda e acesso a servicos por meio digital?', itensVerificacao: SO_DISP },
  { id: '15.4', dimensao: 15, dimensaoNome: 'LGPD e Governo Digital', classificacao: 'OBRIGATORIA', titulo: 'Possibilita acesso automatizado em dados abertos com regras?', itensVerificacao: SO_DISP },
  { id: '15.5', dimensao: 15, dimensaoNome: 'LGPD e Governo Digital', classificacao: 'RECOMENDADA', titulo: 'Regulamenta Lei 14.129/2021 (Governo Digital) e divulga?', itensVerificacao: SO_DISP },
  { id: '15.6', dimensao: 15, dimensaoNome: 'LGPD e Governo Digital', classificacao: 'OBRIGATORIA', titulo: 'Realiza e divulga resultados de pesquisas de satisfacao?', itensVerificacao: SO_DISP },
  // Dimensao 20 - PODER LEGISLATIVO
  { id: '20.1', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'OBRIGATORIA', titulo: 'Divulga composicao da Casa com biografia dos parlamentares?', itensVerificacao: SO_DISP },
  { id: '20.2', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'OBRIGATORIA', titulo: 'Divulga leis e atos infralegais produzidos?', itensVerificacao: DASF },
  { id: '20.3', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'OBRIGATORIA', titulo: 'Divulga projetos de leis e respectivas tramitacoes?', itensVerificacao: DASF },
  { id: '20.4', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'OBRIGATORIA', titulo: 'Divulga pauta das sessoes do Plenario?', itensVerificacao: DAFG },
  { id: '20.5', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'OBRIGATORIA', titulo: 'Divulga pauta das Comissoes?', itensVerificacao: DAFG },
  { id: '20.6', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'OBRIGATORIA', titulo: 'Divulga atas das sessoes com presenca dos parlamentares?', itensVerificacao: TODOS },
  { id: '20.7', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'RECOMENDADA', titulo: 'Divulga lista das votacoes nominais?', itensVerificacao: TODOS },
  { id: '20.8', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'OBRIGATORIA', titulo: 'Divulga ato que aprecia as Contas do Chefe do Executivo?', itensVerificacao: DASF },
  { id: '20.9', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'RECOMENDADA', titulo: 'Ha transmissao de sessoes via radio/TV/internet?', itensVerificacao: SO_DISP },
  { id: '20.10', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'RECOMENDADA', titulo: 'Divulga regulamentacao e valores das cotas/verba indenizatoria?', itensVerificacao: TODOS },
  { id: '20.11', dimensao: 20, dimensaoNome: 'Atividades Finalisticas - PL', classificacao: 'RECOMENDADA', titulo: 'Divulga dados sobre atividades legislativas dos parlamentares?', itensVerificacao: DASF },
]

export const PESO_CLASSIFICACAO: Record<Classificacao, number> = {
  ESSENCIAL: 2,
  OBRIGATORIA: 1.5,
  RECOMENDADA: 1,
}

export const PESO_ITEM = {
  disponibilidade: 30,
  atualidade: 30,
  serieHistorica: 20,
  gravacaoRelatorios: 10,
  filtroPesquisa: 10,
} as const

export interface AvaliacaoCriterio {
  criterioId: string
  disponibilidade?: boolean
  atualidade?: boolean
  serieHistorica?: boolean
  gravacaoRelatorios?: boolean
  filtroPesquisa?: boolean
  detalhes?: string
}

/**
 * Calcula a pontuacao de um criterio (0 a 100) considerando os pesos dos
 * itens de verificacao. Itens nao-aplicaveis tem seu peso rateado entre os
 * demais. Se `disponibilidade` for false, o criterio recebe 0.
 */
export function pontuarCriterio(criterio: Criterio, avaliacao: AvaliacaoCriterio): number {
  if (!avaliacao.disponibilidade) return 0
  let pesoTotalAplicavel = 0
  let pontosObtidos = 0
  const itens = criterio.itensVerificacao
  if (itens.disponibilidade) {
    pesoTotalAplicavel += PESO_ITEM.disponibilidade
    if (avaliacao.disponibilidade) pontosObtidos += PESO_ITEM.disponibilidade
  }
  if (itens.atualidade) {
    pesoTotalAplicavel += PESO_ITEM.atualidade
    if (avaliacao.atualidade) pontosObtidos += PESO_ITEM.atualidade
  }
  if (itens.serieHistorica) {
    pesoTotalAplicavel += PESO_ITEM.serieHistorica
    if (avaliacao.serieHistorica) pontosObtidos += PESO_ITEM.serieHistorica
  }
  if (itens.gravacaoRelatorios) {
    pesoTotalAplicavel += PESO_ITEM.gravacaoRelatorios
    if (avaliacao.gravacaoRelatorios) pontosObtidos += PESO_ITEM.gravacaoRelatorios
  }
  if (itens.filtroPesquisa) {
    pesoTotalAplicavel += PESO_ITEM.filtroPesquisa
    if (avaliacao.filtroPesquisa) pontosObtidos += PESO_ITEM.filtroPesquisa
  }
  if (pesoTotalAplicavel === 0) return 100
  return Math.round((pontosObtidos / pesoTotalAplicavel) * 100)
}

export interface ResultadoDimensao {
  dimensao: number
  nome: string
  peso: number
  totalCriterios: number
  pontuacao: number
  criterios: Array<{
    id: string
    titulo: string
    classificacao: Classificacao
    pontuacao: number
    detalhes?: string
  }>
}

export interface ResultadoGeral {
  pontuacao: number
  nivel: 'DIAMANTE' | 'OURO' | 'PRATA' | 'ELEVADO' | 'INTERMEDIARIO' | 'BASICO' | 'INICIAL' | 'INEXISTENTE'
  essenciaisFaltantes: string[]
  dimensoes: ResultadoDimensao[]
  totalCriterios: number
  criteriosConformes: number
}

/**
 * Calcula a pontuacao geral conforme metodologia oficial da Atricon:
 * pontuacao_final = somatorio(peso_dim × peso_class × pontuacao_criterio) /
 *                   somatorio(peso_dim × peso_class × 100)
 *
 * Niveis: Diamante 95-100% (+ todos os essenciais), Ouro 85-94%, Prata 75-84%,
 * Elevado >75% sem todos os essenciais, etc.
 */
export function calcularResultadoGeral(
  avaliacoes: Record<string, AvaliacaoCriterio>,
): ResultadoGeral {
  const dimensoesMap = new Map<number, ResultadoDimensao>()
  let somaPesada = 0
  let pesoTotal = 0
  const essenciaisFaltantes: string[] = []
  let criteriosConformes = 0

  for (const criterio of CRITERIOS_PNTP_CAMARA) {
    const av = avaliacoes[criterio.id] || { criterioId: criterio.id }
    const pontuacao = pontuarCriterio(criterio, av)
    const pesoClass = PESO_CLASSIFICACAO[criterio.classificacao]
    const pesoDim = DIMENSOES[criterio.dimensao]?.peso || 1
    const pesoFinal = pesoClass * pesoDim
    somaPesada += pesoFinal * pontuacao
    pesoTotal += pesoFinal * 100
    if (pontuacao >= 70) criteriosConformes += 1
    if (criterio.classificacao === 'ESSENCIAL' && pontuacao < 100) {
      essenciaisFaltantes.push(criterio.id)
    }
    if (!dimensoesMap.has(criterio.dimensao)) {
      dimensoesMap.set(criterio.dimensao, {
        dimensao: criterio.dimensao,
        nome: DIMENSOES[criterio.dimensao]?.nome || criterio.dimensaoNome,
        peso: pesoDim,
        totalCriterios: 0,
        pontuacao: 0,
        criterios: [],
      })
    }
    const d = dimensoesMap.get(criterio.dimensao)!
    d.totalCriterios += 1
    d.criterios.push({
      id: criterio.id,
      titulo: criterio.titulo,
      classificacao: criterio.classificacao,
      pontuacao,
      detalhes: av.detalhes,
    })
  }

  // Media simples por dimensao (para apresentacao — score geral usa ponderacao)
  dimensoesMap.forEach((d) => {
    const soma = d.criterios.reduce((acc: number, c: ResultadoDimensao['criterios'][number]) => acc + c.pontuacao, 0)
    d.pontuacao = d.criterios.length > 0 ? Math.round(soma / d.criterios.length) : 0
  })

  const pontuacaoFinal = pesoTotal > 0 ? Math.round((somaPesada / pesoTotal) * 100) / 100 : 0
  let nivel: ResultadoGeral['nivel'] = 'INEXISTENTE'
  const todosEssenciaisOk = essenciaisFaltantes.length === 0
  if (pontuacaoFinal >= 95 && todosEssenciaisOk) nivel = 'DIAMANTE'
  else if (pontuacaoFinal >= 85 && todosEssenciaisOk) nivel = 'OURO'
  else if (pontuacaoFinal >= 75 && todosEssenciaisOk) nivel = 'PRATA'
  else if (pontuacaoFinal >= 75) nivel = 'ELEVADO'
  else if (pontuacaoFinal >= 50) nivel = 'INTERMEDIARIO'
  else if (pontuacaoFinal >= 30) nivel = 'BASICO'
  else if (pontuacaoFinal >= 1) nivel = 'INICIAL'

  return {
    pontuacao: pontuacaoFinal,
    nivel,
    essenciaisFaltantes,
    dimensoes: Array.from(dimensoesMap.values()).sort((a, b) => a.dimensao - b.dimensao),
    totalCriterios: CRITERIOS_PNTP_CAMARA.length,
    criteriosConformes,
  }
}
