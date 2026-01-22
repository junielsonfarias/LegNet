/**
 * Serviço de Notificações
 * Implementa MEL-002: Sistema de notificações multicanal
 *
 * Funcionalidades:
 * - Notificações por email (templates)
 * - Notificações in-app
 * - Alertas de prazos vencendo
 * - Notificações de mudanças de tramitação
 * - Configuração de preferências por usuário
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { formatDateLong, differenceInDays, addDays } from '@/lib/utils/date'
import {
  sendNotificationEmail,
  sendSessaoConvocadaEmail,
  sendResultadoVotacaoEmail,
  isEmailConfigured
} from '@/lib/services/email-service'

const logger = createLogger('notificacao')

// Tipos de notificação
export type TipoNotificacao =
  | 'NOVA_PROPOSICAO'
  | 'PROPOSICAO_EM_PAUTA'
  | 'VOTACAO_AGENDADA'
  | 'RESULTADO_VOTACAO'
  | 'PRAZO_VENCENDO'
  | 'VETO_RECEBIDO'
  | 'TRAMITACAO_ATUALIZADA'
  | 'SESSAO_CONVOCADA'
  | 'PAUTA_PUBLICADA'
  | 'DOCUMENTO_PUBLICADO'
  | 'SISTEMA'

// Canais de notificação
export type CanalNotificacao = 'EMAIL' | 'IN_APP' | 'SMS' | 'PUSH'

// Prioridade da notificação
export type PrioridadeNotificacao = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'

// Status da notificação
export type StatusNotificacao = 'PENDENTE' | 'ENVIADA' | 'LIDA' | 'ERRO'

// Interface de notificação
export interface Notificacao {
  id?: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  destinatarioId?: string
  destinatarioEmail?: string
  canal: CanalNotificacao
  prioridade: PrioridadeNotificacao
  status: StatusNotificacao
  dados?: Record<string, unknown>
  link?: string
  dataEnvio?: Date
  dataLeitura?: Date
  erro?: string
}

// Preferências de notificação do usuário
export interface PreferenciasNotificacao {
  userId: string
  emailHabilitado: boolean
  inAppHabilitado: boolean
  tiposHabilitados: TipoNotificacao[]
  frequenciaResumo: 'IMEDIATO' | 'DIARIO' | 'SEMANAL'
  horarioResumo?: string
}

// Template de email
export interface EmailTemplate {
  assunto: string
  corpo: string
  variaveis: string[]
}

// Templates de email predefinidos
export const EMAIL_TEMPLATES: Record<TipoNotificacao, EmailTemplate> = {
  NOVA_PROPOSICAO: {
    assunto: 'Nova proposição apresentada: {{numero}}',
    corpo: `
      <h2>Nova Proposição</h2>
      <p><strong>Número:</strong> {{numero}}</p>
      <p><strong>Tipo:</strong> {{tipo}}</p>
      <p><strong>Autor:</strong> {{autor}}</p>
      <p><strong>Ementa:</strong> {{ementa}}</p>
      <p><a href="{{link}}">Ver detalhes</a></p>
    `,
    variaveis: ['numero', 'tipo', 'autor', 'ementa', 'link']
  },
  PROPOSICAO_EM_PAUTA: {
    assunto: 'Proposição incluída em pauta: {{numero}}',
    corpo: `
      <h2>Proposição em Pauta</h2>
      <p>A proposição <strong>{{numero}}</strong> foi incluída na pauta da sessão de {{dataSessao}}.</p>
      <p><strong>Ementa:</strong> {{ementa}}</p>
      <p><a href="{{link}}">Ver pauta completa</a></p>
    `,
    variaveis: ['numero', 'ementa', 'dataSessao', 'link']
  },
  VOTACAO_AGENDADA: {
    assunto: 'Votação agendada: {{numero}}',
    corpo: `
      <h2>Votação Agendada</h2>
      <p>A votação da proposição <strong>{{numero}}</strong> está agendada para {{dataVotacao}}.</p>
      <p><strong>Sessão:</strong> {{sessao}}</p>
      <p><strong>Tipo de quórum:</strong> {{tipoQuorum}}</p>
      <p><a href="{{link}}">Ver detalhes</a></p>
    `,
    variaveis: ['numero', 'dataVotacao', 'sessao', 'tipoQuorum', 'link']
  },
  RESULTADO_VOTACAO: {
    assunto: 'Resultado de votação: {{numero}} - {{resultado}}',
    corpo: `
      <h2>Resultado de Votação</h2>
      <p>A proposição <strong>{{numero}}</strong> foi <strong>{{resultado}}</strong>.</p>
      <p><strong>Votos a favor:</strong> {{votosSim}}</p>
      <p><strong>Votos contra:</strong> {{votosNao}}</p>
      <p><strong>Abstenções:</strong> {{abstencoes}}</p>
      <p><a href="{{link}}">Ver detalhes</a></p>
    `,
    variaveis: ['numero', 'resultado', 'votosSim', 'votosNao', 'abstencoes', 'link']
  },
  PRAZO_VENCENDO: {
    assunto: 'ATENÇÃO: Prazo vencendo - {{descricao}}',
    corpo: `
      <h2>Prazo Vencendo</h2>
      <p><strong>{{descricao}}</strong></p>
      <p><strong>Prazo:</strong> {{prazo}}</p>
      <p><strong>Dias restantes:</strong> {{diasRestantes}}</p>
      <p><a href="{{link}}">Tomar providências</a></p>
    `,
    variaveis: ['descricao', 'prazo', 'diasRestantes', 'link']
  },
  VETO_RECEBIDO: {
    assunto: 'Veto recebido: {{numero}}',
    corpo: `
      <h2>Veto Recebido</h2>
      <p>A proposição <strong>{{numero}}</strong> foi vetada pelo Executivo.</p>
      <p><strong>Tipo de veto:</strong> {{tipoVeto}}</p>
      <p><strong>Motivo:</strong> {{motivo}}</p>
      <p><strong>Prazo para apreciação:</strong> {{prazoApreciacao}}</p>
      <p><a href="{{link}}">Ver razões do veto</a></p>
    `,
    variaveis: ['numero', 'tipoVeto', 'motivo', 'prazoApreciacao', 'link']
  },
  TRAMITACAO_ATUALIZADA: {
    assunto: 'Tramitação atualizada: {{numero}}',
    corpo: `
      <h2>Tramitação Atualizada</h2>
      <p>A proposição <strong>{{numero}}</strong> teve sua tramitação atualizada.</p>
      <p><strong>Nova unidade:</strong> {{unidade}}</p>
      <p><strong>Despacho:</strong> {{despacho}}</p>
      <p><a href="{{link}}">Ver histórico completo</a></p>
    `,
    variaveis: ['numero', 'unidade', 'despacho', 'link']
  },
  SESSAO_CONVOCADA: {
    assunto: 'Sessão convocada: {{tipo}} - {{data}}',
    corpo: `
      <h2>Sessão Convocada</h2>
      <p>Uma sessão <strong>{{tipo}}</strong> foi convocada.</p>
      <p><strong>Data:</strong> {{data}}</p>
      <p><strong>Horário:</strong> {{horario}}</p>
      <p><strong>Local:</strong> {{local}}</p>
      <p><a href="{{link}}">Ver detalhes</a></p>
    `,
    variaveis: ['tipo', 'data', 'horario', 'local', 'link']
  },
  PAUTA_PUBLICADA: {
    assunto: 'Pauta publicada: Sessão de {{data}}',
    corpo: `
      <h2>Pauta Publicada</h2>
      <p>A pauta da sessão de <strong>{{data}}</strong> foi publicada.</p>
      <p><strong>Total de itens:</strong> {{totalItens}}</p>
      <p><a href="{{link}}">Ver pauta completa</a></p>
    `,
    variaveis: ['data', 'totalItens', 'link']
  },
  DOCUMENTO_PUBLICADO: {
    assunto: 'Novo documento publicado: {{titulo}}',
    corpo: `
      <h2>Documento Publicado</h2>
      <p><strong>{{titulo}}</strong></p>
      <p><strong>Tipo:</strong> {{tipo}}</p>
      <p><strong>Data:</strong> {{data}}</p>
      <p><a href="{{link}}">Acessar documento</a></p>
    `,
    variaveis: ['titulo', 'tipo', 'data', 'link']
  },
  SISTEMA: {
    assunto: '{{assunto}}',
    corpo: `
      <h2>{{titulo}}</h2>
      <p>{{mensagem}}</p>
    `,
    variaveis: ['assunto', 'titulo', 'mensagem']
  }
}

/**
 * Cria uma notificação
 */
export async function criarNotificacao(
  notificacao: Omit<Notificacao, 'id' | 'status'>
): Promise<string> {
  // Por enquanto, salvamos em log (futuramente em tabela própria)
  const notificacaoCompleta: Notificacao = {
    ...notificacao,
    id: crypto.randomUUID(),
    status: 'PENDENTE'
  }

  logger.info('Notificação criada', {
    action: 'criar_notificacao',
    tipo: notificacao.tipo,
    canal: notificacao.canal,
    destinatarioId: notificacao.destinatarioId
  })

  // Tenta enviar imediatamente se for urgente
  if (notificacao.prioridade === 'URGENTE') {
    await enviarNotificacao(notificacaoCompleta)
  }

  return notificacaoCompleta.id!
}

/**
 * Envia uma notificação
 */
export async function enviarNotificacao(
  notificacao: Notificacao
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    switch (notificacao.canal) {
      case 'EMAIL':
        return await enviarEmail(notificacao)
      case 'IN_APP':
        return await salvarNotificacaoInApp(notificacao)
      case 'SMS':
        logger.warn('Canal SMS não implementado')
        return { sucesso: false, erro: 'Canal SMS não implementado' }
      case 'PUSH':
        logger.warn('Canal PUSH não implementado')
        return { sucesso: false, erro: 'Canal PUSH não implementado' }
      default:
        return { sucesso: false, erro: 'Canal desconhecido' }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    logger.error('Erro ao enviar notificação', { error: errorMessage })
    return { sucesso: false, erro: errorMessage }
  }
}

/**
 * Envia email usando o serviço de email (Resend)
 */
async function enviarEmail(
  notificacao: Notificacao
): Promise<{ sucesso: boolean; erro?: string }> {
  if (!notificacao.destinatarioEmail) {
    return { sucesso: false, erro: 'Email do destinatário não informado' }
  }

  // Verificar se email está configurado
  if (!isEmailConfigured()) {
    logger.warn('Serviço de email não configurado', {
      action: 'enviar_email_skip',
      para: notificacao.destinatarioEmail
    })
    // Em desenvolvimento, considera como enviado
    return { sucesso: true }
  }

  try {
    // Determinar link de ação
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const actionUrl = notificacao.link ? `${APP_URL}${notificacao.link}` : undefined

    // Enviar via serviço de email
    const result = await sendNotificationEmail(
      notificacao.destinatarioEmail,
      notificacao.titulo,
      notificacao.titulo,
      notificacao.mensagem,
      actionUrl,
      'Ver Detalhes'
    )

    if (result.success) {
      logger.info('Email enviado com sucesso', {
        action: 'enviar_email',
        para: notificacao.destinatarioEmail,
        assunto: notificacao.titulo,
        messageId: result.messageId
      })
      return { sucesso: true }
    } else {
      logger.error('Falha ao enviar email', {
        action: 'enviar_email_error',
        para: notificacao.destinatarioEmail,
        erro: result.error
      })
      return { sucesso: false, erro: result.error }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    logger.error('Exceção ao enviar email', {
      action: 'enviar_email_exception',
      para: notificacao.destinatarioEmail,
      erro: errorMessage
    })
    return { sucesso: false, erro: errorMessage }
  }
}

/**
 * Salva notificação in-app
 */
async function salvarNotificacaoInApp(
  notificacao: Notificacao
): Promise<{ sucesso: boolean; erro?: string }> {
  if (!notificacao.destinatarioId) {
    return { sucesso: false, erro: 'ID do destinatário não informado' }
  }

  // Aqui salvaria em tabela de notificações do usuário
  logger.info('Notificação in-app salva', {
    action: 'salvar_notificacao_inapp',
    userId: notificacao.destinatarioId,
    tipo: notificacao.tipo
  })

  return { sucesso: true }
}

/**
 * Renderiza template de email com variáveis
 */
export function renderizarTemplate(
  tipo: TipoNotificacao,
  variaveis: Record<string, string>
): { assunto: string; corpo: string } {
  const template = EMAIL_TEMPLATES[tipo]

  let assunto = template.assunto
  let corpo = template.corpo

  for (const [chave, valor] of Object.entries(variaveis)) {
    const regex = new RegExp(`{{${chave}}}`, 'g')
    assunto = assunto.replace(regex, valor)
    corpo = corpo.replace(regex, valor)
  }

  return { assunto, corpo }
}

/**
 * Notifica sobre nova proposição
 */
export async function notificarNovaProposicao(
  proposicaoId: string
): Promise<void> {
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    include: {
      autor: { select: { nome: true } }
    }
  })

  if (!proposicao) return

  const variaveis = {
    numero: proposicao.numero,
    tipo: proposicao.tipo,
    autor: proposicao.autor?.nome || 'Não informado',
    ementa: proposicao.ementa,
    link: `/legislativo/proposicoes/${proposicaoId}`
  }

  const { assunto, corpo } = renderizarTemplate('NOVA_PROPOSICAO', variaveis)

  // Notifica todos os usuários interessados (simplificado)
  await criarNotificacao({
    tipo: 'NOVA_PROPOSICAO',
    titulo: assunto,
    mensagem: corpo,
    canal: 'IN_APP',
    prioridade: 'NORMAL',
    dados: { proposicaoId },
    link: variaveis.link
  })

  logger.info('Notificação de nova proposição enviada', {
    action: 'notificar_nova_proposicao',
    proposicaoId
  })
}

/**
 * Notifica sobre proposição em pauta
 */
export async function notificarProposicaoEmPauta(
  proposicaoId: string,
  sessaoId: string
): Promise<void> {
  const [proposicao, sessao] = await Promise.all([
    prisma.proposicao.findUnique({ where: { id: proposicaoId } }),
    prisma.sessao.findUnique({ where: { id: sessaoId } })
  ])

  if (!proposicao || !sessao) return

  const variaveis = {
    numero: proposicao.numero,
    ementa: proposicao.ementa,
    dataSessao: formatDateLong(sessao.data),
    link: `/legislativo/sessoes/${sessaoId}/pauta`
  }

  const { assunto, corpo } = renderizarTemplate('PROPOSICAO_EM_PAUTA', variaveis)

  // Notifica autor da proposição
  if (proposicao.autorId) {
    const autor = await prisma.parlamentar.findUnique({
      where: { id: proposicao.autorId },
      include: { usuario: true }
    })

    if (autor?.usuario?.email) {
      await criarNotificacao({
        tipo: 'PROPOSICAO_EM_PAUTA',
        titulo: assunto,
        mensagem: corpo,
        destinatarioId: autor.usuario.id,
        destinatarioEmail: autor.usuario.email,
        canal: 'EMAIL',
        prioridade: 'ALTA',
        dados: { proposicaoId, sessaoId },
        link: variaveis.link
      })
    }
  }
}

/**
 * Notifica sobre resultado de votação
 */
export async function notificarResultadoVotacao(
  proposicaoId: string,
  resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE',
  votacao: { sim: number; nao: number; abstencoes: number }
): Promise<void> {
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId }
  })

  if (!proposicao) return

  const variaveis = {
    numero: proposicao.numero,
    resultado,
    votosSim: String(votacao.sim),
    votosNao: String(votacao.nao),
    abstencoes: String(votacao.abstencoes),
    link: `/legislativo/proposicoes/${proposicaoId}`
  }

  const { assunto, corpo } = renderizarTemplate('RESULTADO_VOTACAO', variaveis)

  await criarNotificacao({
    tipo: 'RESULTADO_VOTACAO',
    titulo: assunto,
    mensagem: corpo,
    canal: 'IN_APP',
    prioridade: 'ALTA',
    dados: { proposicaoId, resultado, votacao },
    link: variaveis.link
  })
}

/**
 * Verifica e notifica prazos vencendo
 */
export async function verificarPrazosVencendo(): Promise<{
  notificacoesEnviadas: number
  prazosVencendo: Array<{ tipo: string; descricao: string; prazo: Date }>
}> {
  const prazosVencendo: Array<{ tipo: string; descricao: string; prazo: Date }> = []
  let notificacoesEnviadas = 0

  // Verifica vetos com prazo vencendo (30 dias)
  const proposicoesVetadas = await prisma.proposicao.findMany({
    where: { status: 'VETADA' }
  })

  for (const prop of proposicoesVetadas) {
    const dataVeto = prop.dataVotacao || prop.updatedAt
    const prazoFinal = addDays(dataVeto, 30)
    const diasRestantes = differenceInDays(prazoFinal, new Date())

    if (diasRestantes <= 7 && diasRestantes >= 0) {
      prazosVencendo.push({
        tipo: 'VETO',
        descricao: `Apreciação de veto - ${prop.numero}`,
        prazo: prazoFinal || new Date()
      })

      await criarNotificacao({
        tipo: 'PRAZO_VENCENDO',
        titulo: `URGENTE: Veto ${prop.numero} - ${diasRestantes} dias restantes`,
        mensagem: `O prazo para apreciação do veto da proposição ${prop.numero} vence em ${diasRestantes} dias.`,
        canal: 'IN_APP',
        prioridade: diasRestantes <= 3 ? 'URGENTE' : 'ALTA',
        dados: { proposicaoId: prop.id, diasRestantes, prazoFinal },
        link: `/legislativo/proposicoes/${prop.id}`
      })

      notificacoesEnviadas++
    }
  }

  // Verifica tramitações com prazo vencendo
  const tramitacoes = await prisma.tramitacao.findMany({
    where: {
      prazoVencimento: {
        lte: addDays(new Date(), 7) || new Date(),
        gte: new Date()
      }
    },
    include: {
      proposicao: true
    }
  })

  for (const tram of tramitacoes) {
    if (tram.prazoVencimento) {
      const diasRestantes = differenceInDays(tram.prazoVencimento, new Date())

      prazosVencendo.push({
        tipo: 'TRAMITACAO',
        descricao: `Tramitação - ${tram.proposicao.numero}`,
        prazo: tram.prazoVencimento
      })

      await criarNotificacao({
        tipo: 'PRAZO_VENCENDO',
        titulo: `Prazo de tramitação vencendo - ${tram.proposicao.numero}`,
        mensagem: `O prazo de tramitação da proposição ${tram.proposicao.numero} vence em ${diasRestantes} dias.`,
        canal: 'IN_APP',
        prioridade: diasRestantes <= 3 ? 'ALTA' : 'NORMAL',
        dados: { tramitacaoId: tram.id, proposicaoId: tram.proposicaoId, diasRestantes },
        link: `/legislativo/proposicoes/${tram.proposicaoId}`
      })

      notificacoesEnviadas++
    }
  }

  logger.info('Verificação de prazos concluída', {
    action: 'verificar_prazos',
    prazosEncontrados: prazosVencendo.length,
    notificacoesEnviadas
  })

  return { notificacoesEnviadas, prazosVencendo }
}

/**
 * Notifica sobre sessão convocada
 */
export async function notificarSessaoConvocada(
  sessaoId: string
): Promise<void> {
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) return

  const variaveis = {
    tipo: sessao.tipo,
    data: formatDateLong(sessao.data),
    horario: sessao.horario || '14:00',
    local: sessao.local || 'Plenário da Câmara Municipal',
    link: `/legislativo/sessoes/${sessaoId}`
  }

  const { assunto, corpo } = renderizarTemplate('SESSAO_CONVOCADA', variaveis)

  // Notifica todos os parlamentares ativos
  const parlamentares = await prisma.parlamentar.findMany({
    where: { ativo: true },
    include: { usuario: true }
  })

  for (const parlamentar of parlamentares) {
    if (parlamentar.usuario?.email) {
      await criarNotificacao({
        tipo: 'SESSAO_CONVOCADA',
        titulo: assunto,
        mensagem: corpo,
        destinatarioId: parlamentar.usuario.id,
        destinatarioEmail: parlamentar.usuario.email,
        canal: 'EMAIL',
        prioridade: sessao.tipo === 'EXTRAORDINARIA' ? 'URGENTE' : 'ALTA',
        dados: { sessaoId },
        link: variaveis.link
      })
    }
  }

  logger.info('Notificações de sessão convocada enviadas', {
    action: 'notificar_sessao_convocada',
    sessaoId,
    parlamentaresNotificados: parlamentares.length
  })
}

/**
 * Notifica sobre pauta publicada
 */
export async function notificarPautaPublicada(
  pautaId: string
): Promise<void> {
  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      sessao: true,
      itens: true
    }
  })

  if (!pauta || !pauta.sessao) return

  const variaveis = {
    data: formatDateLong(pauta.sessao.data),
    totalItens: String(pauta.itens.length),
    link: `/legislativo/sessoes/${pauta.sessaoId}/pauta`
  }

  const { assunto, corpo } = renderizarTemplate('PAUTA_PUBLICADA', variaveis)

  await criarNotificacao({
    tipo: 'PAUTA_PUBLICADA',
    titulo: assunto,
    mensagem: corpo,
    canal: 'IN_APP',
    prioridade: 'NORMAL',
    dados: { pautaId, sessaoId: pauta.sessaoId },
    link: variaveis.link
  })
}

/**
 * Resumo das funcionalidades de notificação
 */
export const FUNCIONALIDADES_NOTIFICACAO = {
  'criarNotificacao': 'Cria uma nova notificação',
  'enviarNotificacao': 'Envia notificação pelo canal especificado',
  'notificarNovaProposicao': 'Notifica sobre nova proposição apresentada',
  'notificarProposicaoEmPauta': 'Notifica autor sobre inclusão em pauta',
  'notificarResultadoVotacao': 'Notifica sobre resultado de votação',
  'verificarPrazosVencendo': 'Verifica e notifica prazos vencendo',
  'notificarSessaoConvocada': 'Notifica parlamentares sobre sessão',
  'notificarPautaPublicada': 'Notifica sobre publicação de pauta'
}
