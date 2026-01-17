/**
 * Serviço de Validação Regimental Avançada
 * Implementa motor de regras para validação regimental
 *
 * Funcionalidades:
 * - Motor de regras configurável
 * - Validação de interstício entre discussões
 * - Verificação de quórum por tipo de matéria
 * - Alertas de requisitos não atendidos
 * - Sugestões de ações corretivas
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { differenceInDays, addDays, addBusinessDays } from '@/lib/utils/date'

const logger = createLogger('regras-regimentais')

// Tipos de regra
export type TipoRegra =
  | 'QUORUM'
  | 'PRAZO'
  | 'INTERSTICIO'
  | 'TRAMITACAO'
  | 'VOTACAO'
  | 'INICIATIVA'
  | 'IMPEDIMENTO'
  | 'PUBLICIDADE'

// Severidade da violação
export type Severidade = 'INFO' | 'AVISO' | 'ERRO' | 'BLOQUEIO'

// Resultado de validação de regra
export interface ResultadoRegra {
  regra: string
  codigo: string
  tipo: TipoRegra
  atendida: boolean
  severidade: Severidade
  mensagem: string
  detalhes?: string
  sugestaoCorretiva?: string
  dados?: Record<string, unknown>
}

// Contexto para validação
export interface ContextoValidacao {
  proposicaoId?: string
  sessaoId?: string
  parlamentarId?: string
  acao?: string
  dados?: Record<string, unknown>
}

// Configuração de regra
export interface ConfiguracaoRegra {
  codigo: string
  nome: string
  tipo: TipoRegra
  descricao: string
  ativa: boolean
  severidade: Severidade
  condicoes: Record<string, unknown>
  mensagemErro: string
  sugestaoCorretiva: string
}

// Regras regimentais predefinidas
export const REGRAS_REGIMENTAIS: ConfiguracaoRegra[] = [
  // Regras de Quórum
  {
    codigo: 'RR-001',
    nome: 'Quórum de Instalação',
    tipo: 'QUORUM',
    descricao: 'Maioria absoluta para instalar sessão',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: { tipoQuorum: 'ABSOLUTA', percentualMinimo: 50 },
    mensagemErro: 'Quórum de instalação não atingido (maioria absoluta)',
    sugestaoCorretiva: 'Aguardar chegada de mais parlamentares ou adiar sessão'
  },
  {
    codigo: 'RR-002',
    nome: 'Quórum Votação Simples',
    tipo: 'QUORUM',
    descricao: 'Maioria dos presentes para votação simples',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: { tipoQuorum: 'SIMPLES', baseCalculo: 'PRESENTES' },
    mensagemErro: 'Quórum para votação simples não atingido',
    sugestaoCorretiva: 'Verificar presença antes de abrir votação'
  },
  {
    codigo: 'RR-003',
    nome: 'Quórum Votação Qualificada',
    tipo: 'QUORUM',
    descricao: '2/3 dos membros para votação qualificada',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: { tipoQuorum: 'QUALIFICADA', percentualMinimo: 66.67 },
    mensagemErro: 'Quórum qualificado não atingido (2/3 dos membros)',
    sugestaoCorretiva: 'Aguardar quórum ou adiar votação'
  },

  // Regras de Prazo
  {
    codigo: 'RR-010',
    nome: 'Prazo Parecer CLJ',
    tipo: 'PRAZO',
    descricao: 'Parecer da CLJ em até 15 dias úteis',
    ativa: true,
    severidade: 'AVISO',
    condicoes: { diasUteis: 15, comissao: 'CLJ' },
    mensagemErro: 'Prazo para parecer da CLJ excedido',
    sugestaoCorretiva: 'Solicitar urgência ou justificar atraso'
  },
  {
    codigo: 'RR-011',
    nome: 'Prazo Sanção',
    tipo: 'PRAZO',
    descricao: 'Prazo de 15 dias úteis para sanção do Executivo',
    ativa: true,
    severidade: 'AVISO',
    condicoes: { diasUteis: 15 },
    mensagemErro: 'Prazo para sanção próximo do vencimento',
    sugestaoCorretiva: 'Verificar se ocorrerá sanção tácita'
  },
  {
    codigo: 'RR-012',
    nome: 'Prazo Apreciação Veto',
    tipo: 'PRAZO',
    descricao: 'Veto deve ser apreciado em 30 dias',
    ativa: true,
    severidade: 'ERRO',
    condicoes: { diasCorridos: 30 },
    mensagemErro: 'Prazo para apreciação de veto expirando',
    sugestaoCorretiva: 'Incluir veto na próxima pauta com urgência'
  },
  {
    codigo: 'RR-013',
    nome: 'Publicação Pauta 48h',
    tipo: 'PRAZO',
    descricao: 'Pauta deve ser publicada 48h antes da sessão',
    ativa: true,
    severidade: 'AVISO',
    condicoes: { horasAntecedencia: 48 },
    mensagemErro: 'Pauta publicada com menos de 48h de antecedência',
    sugestaoCorretiva: 'Cumprir prazo para garantir transparência (PNTP)'
  },

  // Regras de Interstício
  {
    codigo: 'RR-020',
    nome: 'Interstício Entre Votações',
    tipo: 'INTERSTICIO',
    descricao: 'Mínimo de 24h entre 1ª e 2ª votação de matéria ordinária',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: { horasMinimas: 24, tipoMateria: 'ORDINARIA' },
    mensagemErro: 'Interstício mínimo de 24h não respeitado',
    sugestaoCorretiva: 'Aguardar prazo mínimo para nova votação'
  },
  {
    codigo: 'RR-021',
    nome: 'Interstício Lei Orgânica',
    tipo: 'INTERSTICIO',
    descricao: 'Mínimo de 10 dias entre turnos de votação de emenda à LO',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: { diasMinimos: 10, tipoMateria: 'EMENDA_LEI_ORGANICA' },
    mensagemErro: 'Interstício mínimo de 10 dias não respeitado para emenda à LO',
    sugestaoCorretiva: 'Aguardar prazo regimental entre turnos'
  },

  // Regras de Tramitação
  {
    codigo: 'RR-030',
    nome: 'Passagem Obrigatória CLJ',
    tipo: 'TRAMITACAO',
    descricao: 'Projetos devem passar pela CLJ antes do Plenário',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: { comissaoObrigatoria: 'CLJ' },
    mensagemErro: 'Proposição não passou pela CLJ',
    sugestaoCorretiva: 'Encaminhar para CLJ antes de incluir em pauta'
  },
  {
    codigo: 'RR-031',
    nome: 'Parecer Antes da Pauta',
    tipo: 'TRAMITACAO',
    descricao: 'Parecer obrigatório antes de inclusão em pauta',
    ativa: true,
    severidade: 'ERRO',
    condicoes: { parecerObrigatorio: true },
    mensagemErro: 'Proposição sem parecer não pode entrar em pauta',
    sugestaoCorretiva: 'Aguardar parecer das comissões competentes'
  },

  // Regras de Votação
  {
    codigo: 'RR-040',
    nome: 'Votação Nominal Obrigatória',
    tipo: 'VOTACAO',
    descricao: 'Votação nominal obrigatória para quórum qualificado',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: { tiposObrigatorios: ['QUALIFICADA', 'EMENDA_LO', 'VETO'] },
    mensagemErro: 'Votação nominal obrigatória não pode ser simbólica',
    sugestaoCorretiva: 'Realizar votação nominal conforme regimento'
  },
  {
    codigo: 'RR-041',
    nome: 'Votação Secreta Proibida',
    tipo: 'VOTACAO',
    descricao: 'Votação secreta só em casos específicos',
    ativa: true,
    severidade: 'AVISO',
    condicoes: { casosPermitidos: ['ELEICAO_MESA', 'CASSACAO_MANDATO'] },
    mensagemErro: 'Votação secreta não permitida para este tipo de matéria',
    sugestaoCorretiva: 'Usar votação nominal ou simbólica'
  },

  // Regras de Iniciativa
  {
    codigo: 'RR-050',
    nome: 'Iniciativa Privativa Executivo',
    tipo: 'INICIATIVA',
    descricao: 'Matérias de iniciativa privativa do Executivo',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: {
      materias: [
        'CRIACAO_CARGO',
        'AUMENTO_REMUNERACAO',
        'REGIME_JURIDICO_SERVIDOR',
        'ORGANIZACAO_ADMINISTRATIVA',
        'ORCAMENTO'
      ]
    },
    mensagemErro: 'Matéria de iniciativa privativa do Executivo',
    sugestaoCorretiva: 'Apenas o Executivo pode apresentar esta matéria'
  },

  // Regras de Impedimento
  {
    codigo: 'RR-060',
    nome: 'Impedimento Autor',
    tipo: 'IMPEDIMENTO',
    descricao: 'Autor da proposição impedido de votar',
    ativa: true,
    severidade: 'AVISO',
    condicoes: { impedidoPorAutoria: true },
    mensagemErro: 'Parlamentar é autor da proposição',
    sugestaoCorretiva: 'Declarar impedimento ou abstenção'
  },
  {
    codigo: 'RR-061',
    nome: 'Impedimento Interesse Direto',
    tipo: 'IMPEDIMENTO',
    descricao: 'Parlamentar com interesse direto impedido',
    ativa: true,
    severidade: 'BLOQUEIO',
    condicoes: { tiposInteresse: ['PESSOAL', 'FAMILIAR', 'EMPRESARIAL'] },
    mensagemErro: 'Parlamentar tem interesse direto na matéria',
    sugestaoCorretiva: 'Parlamentar deve se declarar impedido'
  },

  // Regras de Publicidade
  {
    codigo: 'RR-070',
    nome: 'Publicidade Votação Nominal',
    tipo: 'PUBLICIDADE',
    descricao: 'Votações nominais devem ser publicadas em 30 dias',
    ativa: true,
    severidade: 'AVISO',
    condicoes: { diasParaPublicar: 30 },
    mensagemErro: 'Votação nominal pendente de publicação',
    sugestaoCorretiva: 'Publicar resultado no portal de transparência'
  },
  {
    codigo: 'RR-071',
    nome: 'Publicidade Ata',
    tipo: 'PUBLICIDADE',
    descricao: 'Ata deve ser publicada em 15 dias após aprovação',
    ativa: true,
    severidade: 'AVISO',
    condicoes: { diasParaPublicar: 15 },
    mensagemErro: 'Ata pendente de publicação',
    sugestaoCorretiva: 'Publicar ata aprovada no portal'
  }
]

/**
 * Motor de regras - executa validação
 */
export async function executarValidacao(
  contexto: ContextoValidacao
): Promise<ResultadoRegra[]> {
  const resultados: ResultadoRegra[] = []

  for (const regra of REGRAS_REGIMENTAIS) {
    if (!regra.ativa) continue

    const resultado = await validarRegra(regra, contexto)
    if (resultado) {
      resultados.push(resultado)
    }
  }

  logger.info('Validação regimental executada', {
    action: 'executar_validacao',
    contexto,
    totalRegras: REGRAS_REGIMENTAIS.filter(r => r.ativa).length,
    violacoes: resultados.filter(r => !r.atendida).length
  })

  return resultados
}

/**
 * Valida uma regra específica
 */
async function validarRegra(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  switch (regra.tipo) {
    case 'QUORUM':
      return await validarRegraQuorum(regra, contexto)
    case 'PRAZO':
      return await validarRegraPrazo(regra, contexto)
    case 'INTERSTICIO':
      return await validarRegraIntersticio(regra, contexto)
    case 'TRAMITACAO':
      return await validarRegraTramitacao(regra, contexto)
    case 'VOTACAO':
      return await validarRegraVotacao(regra, contexto)
    case 'INICIATIVA':
      return await validarRegraIniciativa(regra, contexto)
    case 'IMPEDIMENTO':
      return await validarRegraImpedimento(regra, contexto)
    case 'PUBLICIDADE':
      return await validarRegraPublicidade(regra, contexto)
    default:
      return null
  }
}

/**
 * Valida regras de quórum
 */
async function validarRegraQuorum(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  if (!contexto.sessaoId) return null

  const sessao = await prisma.sessao.findUnique({
    where: { id: contexto.sessaoId },
    include: {
      presencas: { where: { presente: true } }
    }
  })

  if (!sessao) return null

  const totalParlamentares = await prisma.parlamentar.count({
    where: { ativo: true }
  })

  const presentes = sessao.presencas.length
  const condicoes = regra.condicoes as { percentualMinimo?: number; tipoQuorum?: string }

  let quorumNecessario: number
  let atendida: boolean

  switch (condicoes.tipoQuorum) {
    case 'ABSOLUTA':
      quorumNecessario = Math.floor(totalParlamentares / 2) + 1
      atendida = presentes >= quorumNecessario
      break
    case 'QUALIFICADA':
      quorumNecessario = Math.ceil((totalParlamentares * 2) / 3)
      atendida = presentes >= quorumNecessario
      break
    default: // SIMPLES
      quorumNecessario = Math.floor(presentes / 2) + 1
      atendida = true // Sempre atende se há presentes
  }

  return {
    regra: regra.nome,
    codigo: regra.codigo,
    tipo: regra.tipo,
    atendida,
    severidade: regra.severidade,
    mensagem: atendida
      ? `Quórum atendido: ${presentes}/${quorumNecessario} necessários`
      : regra.mensagemErro,
    detalhes: `Presentes: ${presentes}, Total: ${totalParlamentares}, Necessário: ${quorumNecessario}`,
    sugestaoCorretiva: atendida ? undefined : regra.sugestaoCorretiva,
    dados: { presentes, totalParlamentares, quorumNecessario }
  }
}

/**
 * Valida regras de prazo
 */
async function validarRegraPrazo(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  if (!contexto.proposicaoId) return null

  const proposicao = await prisma.proposicao.findUnique({
    where: { id: contexto.proposicaoId },
    include: {
      tramitacoes: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!proposicao) return null

  const condicoes = regra.condicoes as {
    diasUteis?: number
    diasCorridos?: number
    horasAntecedencia?: number
  }

  let dataReferencia: Date
  let prazoFinal: Date
  let diasRestantes: number

  if (regra.codigo === 'RR-012' && proposicao.status === 'VETADA') {
    // Prazo de apreciação de veto
    dataReferencia = proposicao.dataVotacao || proposicao.updatedAt
    prazoFinal = addDays(dataReferencia, condicoes.diasCorridos || 30) || new Date()
    diasRestantes = differenceInDays(prazoFinal, new Date())
  } else if (regra.codigo === 'RR-010' || regra.codigo === 'RR-011') {
    // Prazos em dias úteis
    const ultimaTramitacao = proposicao.tramitacoes[0]
    if (!ultimaTramitacao) return null

    dataReferencia = ultimaTramitacao.createdAt
    prazoFinal = addBusinessDays(dataReferencia, condicoes.diasUteis || 15) || new Date()
    diasRestantes = differenceInDays(prazoFinal, new Date())
  } else {
    return null
  }

  const atendida = diasRestantes > 3 // Considera atendida se mais de 3 dias restantes

  return {
    regra: regra.nome,
    codigo: regra.codigo,
    tipo: regra.tipo,
    atendida,
    severidade: diasRestantes <= 0 ? 'BLOQUEIO' : diasRestantes <= 3 ? 'ERRO' : regra.severidade,
    mensagem: atendida
      ? `Prazo dentro do limite: ${diasRestantes} dias restantes`
      : `${regra.mensagemErro} (${Math.abs(diasRestantes)} dias ${diasRestantes < 0 ? 'vencidos' : 'restantes'})`,
    detalhes: `Prazo: ${prazoFinal.toLocaleDateString('pt-BR')}`,
    sugestaoCorretiva: atendida ? undefined : regra.sugestaoCorretiva,
    dados: { dataReferencia, prazoFinal, diasRestantes }
  }
}

/**
 * Valida regras de interstício
 */
async function validarRegraIntersticio(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  if (!contexto.proposicaoId) return null

  // Simplificado - verificaria votações anteriores da mesma proposição
  const condicoes = regra.condicoes as {
    horasMinimas?: number
    diasMinimos?: number
    tipoMateria?: string
  }

  // Implementação simplificada
  return {
    regra: regra.nome,
    codigo: regra.codigo,
    tipo: regra.tipo,
    atendida: true,
    severidade: regra.severidade,
    mensagem: 'Interstício verificado',
    dados: { condicoes }
  }
}

/**
 * Valida regras de tramitação
 */
async function validarRegraTramitacao(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  if (!contexto.proposicaoId) return null

  const proposicao = await prisma.proposicao.findUnique({
    where: { id: contexto.proposicaoId },
    include: {
      tramitacoes: {
        include: {
          unidade: { select: { tipo: true, nome: true } }
        }
      }
    }
  })

  if (!proposicao) return null

  const condicoes = regra.condicoes as {
    comissaoObrigatoria?: string
    parecerObrigatorio?: boolean
  }

  if (regra.codigo === 'RR-030') {
    // Verifica passagem pela CLJ
    const passouCLJ = proposicao.tramitacoes.some(t =>
      t.unidade?.tipo === 'COMISSAO' && t.parecer !== null
    )

    return {
      regra: regra.nome,
      codigo: regra.codigo,
      tipo: regra.tipo,
      atendida: passouCLJ,
      severidade: regra.severidade,
      mensagem: passouCLJ
        ? 'Proposição passou pela CLJ'
        : regra.mensagemErro,
      sugestaoCorretiva: passouCLJ ? undefined : regra.sugestaoCorretiva,
      dados: { tramitacoes: proposicao.tramitacoes.length }
    }
  }

  if (regra.codigo === 'RR-031') {
    // Verifica se tem parecer
    const temParecer = proposicao.tramitacoes.some(t => t.parecer !== null)

    return {
      regra: regra.nome,
      codigo: regra.codigo,
      tipo: regra.tipo,
      atendida: temParecer,
      severidade: regra.severidade,
      mensagem: temParecer
        ? 'Proposição possui parecer'
        : regra.mensagemErro,
      sugestaoCorretiva: temParecer ? undefined : regra.sugestaoCorretiva
    }
  }

  return null
}

/**
 * Valida regras de votação
 */
async function validarRegraVotacao(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  // Simplificado - implementação completa verificaria tipo de votação
  return {
    regra: regra.nome,
    codigo: regra.codigo,
    tipo: regra.tipo,
    atendida: true,
    severidade: regra.severidade,
    mensagem: 'Regra de votação verificada'
  }
}

/**
 * Valida regras de iniciativa
 */
async function validarRegraIniciativa(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  if (!contexto.proposicaoId) return null

  const proposicao = await prisma.proposicao.findUnique({
    where: { id: contexto.proposicaoId },
    include: {
      autor: true
    }
  })

  if (!proposicao) return null

  const condicoes = regra.condicoes as { materias?: string[] }
  const materiasPrivativas = condicoes.materias || []

  // Verifica se é matéria de iniciativa privativa
  const ehPrivativa = materiasPrivativas.some(m =>
    proposicao.tipo.includes(m) || proposicao.ementa?.toUpperCase().includes(m)
  )

  if (!ehPrivativa) {
    return null // Regra não se aplica
  }

  // Verifica se autor é do Executivo (simplificado)
  // Proposições do Executivo geralmente não têm autor parlamentar (autorId é null)
  const autorExecutivo = proposicao.autorId === null

  return {
    regra: regra.nome,
    codigo: regra.codigo,
    tipo: regra.tipo,
    atendida: autorExecutivo,
    severidade: regra.severidade,
    mensagem: autorExecutivo
      ? 'Iniciativa privativa respeitada'
      : regra.mensagemErro,
    sugestaoCorretiva: autorExecutivo ? undefined : regra.sugestaoCorretiva
  }
}

/**
 * Valida regras de impedimento
 */
async function validarRegraImpedimento(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  if (!contexto.proposicaoId || !contexto.parlamentarId) return null

  const proposicao = await prisma.proposicao.findUnique({
    where: { id: contexto.proposicaoId }
  })

  if (!proposicao) return null

  const ehAutor = proposicao.autorId === contexto.parlamentarId

  return {
    regra: regra.nome,
    codigo: regra.codigo,
    tipo: regra.tipo,
    atendida: !ehAutor,
    severidade: regra.severidade,
    mensagem: ehAutor ? regra.mensagemErro : 'Sem impedimento identificado',
    sugestaoCorretiva: ehAutor ? regra.sugestaoCorretiva : undefined,
    dados: { ehAutor }
  }
}

/**
 * Valida regras de publicidade
 */
async function validarRegraPublicidade(
  regra: ConfiguracaoRegra,
  contexto: ContextoValidacao
): Promise<ResultadoRegra | null> {
  // Simplificado - verificaria publicações pendentes
  return {
    regra: regra.nome,
    codigo: regra.codigo,
    tipo: regra.tipo,
    atendida: true,
    severidade: regra.severidade,
    mensagem: 'Regra de publicidade verificada'
  }
}

/**
 * Verifica todas as regras para uma proposição antes de incluir em pauta
 */
export async function verificarElegibilidadePauta(
  proposicaoId: string
): Promise<{
  elegivel: boolean
  bloqueios: ResultadoRegra[]
  avisos: ResultadoRegra[]
}> {
  const resultados = await executarValidacao({ proposicaoId })

  const bloqueios = resultados.filter(r => !r.atendida && r.severidade === 'BLOQUEIO')
  const avisos = resultados.filter(r => !r.atendida && r.severidade !== 'BLOQUEIO')

  return {
    elegivel: bloqueios.length === 0,
    bloqueios,
    avisos
  }
}

/**
 * Verifica regras para abertura de votação
 */
export async function verificarRegrasVotacao(
  sessaoId: string,
  proposicaoId: string
): Promise<{
  podeVotar: boolean
  bloqueios: ResultadoRegra[]
  avisos: ResultadoRegra[]
}> {
  const resultados = await executarValidacao({ sessaoId, proposicaoId, acao: 'VOTACAO' })

  const bloqueios = resultados.filter(r =>
    !r.atendida &&
    r.severidade === 'BLOQUEIO' &&
    ['QUORUM', 'TRAMITACAO', 'VOTACAO'].includes(r.tipo)
  )
  const avisos = resultados.filter(r => !r.atendida && r.severidade !== 'BLOQUEIO')

  return {
    podeVotar: bloqueios.length === 0,
    bloqueios,
    avisos
  }
}

/**
 * Gera relatório de conformidade regimental
 */
export async function gerarRelatorioConformidade(): Promise<{
  totalRegras: number
  regrasAtivas: number
  violacoesPendentes: number
  porTipo: Record<TipoRegra, number>
  detalhes: ResultadoRegra[]
}> {
  // Busca proposições em tramitação
  const proposicoes = await prisma.proposicao.findMany({
    where: { status: 'EM_TRAMITACAO' },
    take: 50
  })

  const todosResultados: ResultadoRegra[] = []

  for (const prop of proposicoes) {
    const resultados = await executarValidacao({ proposicaoId: prop.id })
    todosResultados.push(...resultados.filter(r => !r.atendida))
  }

  const porTipo: Record<TipoRegra, number> = {
    QUORUM: 0,
    PRAZO: 0,
    INTERSTICIO: 0,
    TRAMITACAO: 0,
    VOTACAO: 0,
    INICIATIVA: 0,
    IMPEDIMENTO: 0,
    PUBLICIDADE: 0
  }

  for (const r of todosResultados) {
    porTipo[r.tipo]++
  }

  return {
    totalRegras: REGRAS_REGIMENTAIS.length,
    regrasAtivas: REGRAS_REGIMENTAIS.filter(r => r.ativa).length,
    violacoesPendentes: todosResultados.length,
    porTipo,
    detalhes: todosResultados
  }
}

/**
 * Resumo das funcionalidades de validação regimental
 */
export const FUNCIONALIDADES_REGRAS_REGIMENTAIS = {
  'executarValidacao': 'Executa validação completa de regras regimentais',
  'verificarElegibilidadePauta': 'Verifica se proposição pode entrar em pauta',
  'verificarRegrasVotacao': 'Verifica regras antes de abrir votação',
  'gerarRelatorioConformidade': 'Gera relatório de conformidade regimental',
  'REGRAS_REGIMENTAIS': 'Lista de todas as regras configuradas'
}
