/**
 * Jobs de prazos legais — executados diariamente via cron.
 *
 * - RN-081: Sanção tácita após 15 dias úteis sem ação do Executivo
 * - RN-084: Alerta de apreciação de veto próximo ao prazo de 30 dias
 * - RN-122 (PNTP): Pautas não publicadas 48h antes da sessão
 * - RN-123 (PNTP): Atas aprovadas não publicadas em 15 dias
 * - RN-124 (PNTP): Contratos sem publicação em 24h após assinatura
 * - RN-140 (LAI): e-SIC com prazo de 20 dias úteis vencendo
 * - Pareceres de comissão próximos do prazo
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('jobs/prazos-legais')

const DIAS_UTEIS_SANCAO = 15
const DIAS_PRAZO_VETO = 30
const DIAS_ANTECEDENCIA_AVISO = 7
const DIAS_ANTECEDENCIA_PARECER = 3
const HORAS_PRAZO_PAUTA = 48
const DIAS_PRAZO_ATA = 15
const HORAS_PRAZO_CONTRATO = 24
const DIAS_UTEIS_ESIC = 20
const DIAS_ANTECEDENCIA_ESIC = 3

function diasUteis(from: Date, to: Date): number {
  let count = 0
  const current = new Date(from)
  while (current < to) {
    current.setDate(current.getDate() + 1)
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

/**
 * RN-081: Aplica sanção tácita em proposições APROVADAS com 15 dias úteis
 * sem ação do Executivo (sanção ou veto).
 */
export async function processarSancaoTacita(): Promise<{
  sancionadas: string[]
  total: number
}> {
  const proposicoes = await prisma.proposicao.findMany({
    where: { status: 'APROVADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true, dataVotacao: true }
  })

  const agora = new Date()
  const elegiveis = proposicoes.filter((prop) => {
    const dataBase = prop.dataVotacao || prop.updatedAt
    return diasUteis(dataBase, agora) >= DIAS_UTEIS_SANCAO
  })

  if (elegiveis.length > 0) {
    await prisma.proposicao.updateMany({
      where: { id: { in: elegiveis.map((p) => p.id) } },
      data: { status: 'SANCIONADA' }
    })
    logger.info(`Sanção tácita aplicada em ${elegiveis.length} proposição(ões)`, {
      ids: elegiveis.map((p) => p.id)
    })
  }

  return {
    sancionadas: elegiveis.map((p) => `${p.tipo} ${p.numero}/${p.ano}`),
    total: elegiveis.length
  }
}

/**
 * RN-084: Gera notificações para prazos próximos (pareceres e vetos).
 * Deduplica criando 1 notificação por entidade a cada 24h.
 */
export async function gerarNotificacoesPrazo(): Promise<{
  notificacoesCriadas: number
}> {
  const agora = new Date()
  const em3Dias = new Date(agora.getTime() + DIAS_ANTECEDENCIA_PARECER * 24 * 60 * 60 * 1000)
  const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
  let notificacoesCriadas = 0

  // 1. Pareceres próximos do prazo
  const pareceresPendentes = await prisma.parecer.findMany({
    where: {
      status: { in: ['RASCUNHO', 'AGUARDANDO_PAUTA', 'AGUARDANDO_VOTACAO'] },
      prazoEmissao: { not: null, lte: em3Dias }
    },
    select: {
      id: true,
      prazoEmissao: true,
      relatorId: true,
      proposicao: { select: { tipo: true, numero: true, ano: true } },
      comissao: { select: { sigla: true, nome: true } }
    }
  })

  if (pareceresPendentes.length > 0) {
    const notificacoesExistentes = await prisma.notificacaoMulticanal.findMany({
      where: {
        canal: 'SISTEMA',
        metadata: { path: ['entidadeTipo'], equals: 'PARECER' },
        createdAt: { gte: ontem }
      },
      select: { metadata: true }
    })
    const idsNotificados = new Set(
      notificacoesExistentes
        .map((n) => (n.metadata as Record<string, unknown>)?.entidadeId)
        .filter(Boolean)
    )

    const relatorIds = Array.from(
      new Set(pareceresPendentes.map((p) => p.relatorId).filter(Boolean))
    ) as string[]
    const usuarios =
      relatorIds.length > 0
        ? await prisma.user.findMany({
            where: { parlamentarId: { in: relatorIds }, ativo: true },
            select: { id: true, email: true, parlamentarId: true }
          })
        : []
    const usuarioPorParlamentar = new Map(usuarios.map((u) => [u.parlamentarId, u]))

    const notificacoesParaCriar: Prisma.NotificacaoMulticanalCreateManyInput[] = []
    for (const p of pareceresPendentes) {
      if (!p.relatorId || idsNotificados.has(p.id)) continue
      const dias = Math.ceil(
        ((p.prazoEmissao?.getTime() || 0) - agora.getTime()) / (1000 * 60 * 60 * 24)
      )
      const assunto =
        dias < 0
          ? `VENCIDO: Parecer ${p.comissao?.sigla} - ${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano}`
          : `Prazo em ${dias} dia(s): Parecer ${p.comissao?.sigla} - ${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano}`

      const usuario = usuarioPorParlamentar.get(p.relatorId)
      const destinatario = usuario?.email || p.relatorId

      notificacoesParaCriar.push({
        canal: 'SISTEMA' as const,
        destinatario,
        assunto,
        mensagem: `O prazo para emissão do parecer da ${p.comissao?.nome || 'comissão'} sobre ${p.proposicao?.tipo} ${p.proposicao?.numero}/${p.proposicao?.ano} ${dias < 0 ? 'está vencido' : `vence em ${dias} dia(s)`}.`,
        metadata: {
          tipo: 'ALERTA_PRAZO',
          entidadeId: p.id,
          entidadeTipo: 'PARECER',
          prioridade: dias < 0 ? 'ALTA' : 'MEDIA',
          destinatarioUserId: usuario?.id || null,
          diasRestantes: dias
        }
      })
    }

    if (notificacoesParaCriar.length > 0) {
      await prisma.notificacaoMulticanal.createMany({ data: notificacoesParaCriar })
      notificacoesCriadas += notificacoesParaCriar.length
    }
  }

  // 2. Vetos próximos dos 30 dias (RN-084)
  const vetosPendentes = await prisma.proposicao.findMany({
    where: { status: 'VETADA' },
    select: { id: true, numero: true, ano: true, tipo: true, updatedAt: true }
  })

  const vetosComPrazo = vetosPendentes.filter((v) => {
    const prazoVeto = new Date(v.updatedAt.getTime() + DIAS_PRAZO_VETO * 24 * 60 * 60 * 1000)
    const dias = Math.ceil((prazoVeto.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    return dias <= DIAS_ANTECEDENCIA_AVISO
  })

  if (vetosComPrazo.length > 0) {
    const notificacoesVetoExistentes = await prisma.notificacaoMulticanal.findMany({
      where: {
        canal: 'SISTEMA',
        metadata: { path: ['entidadeTipo'], equals: 'PROPOSICAO' },
        createdAt: { gte: ontem }
      },
      select: { metadata: true }
    })
    const idsVetoNotificados = new Set(
      notificacoesVetoExistentes
        .map((n) => (n.metadata as Record<string, unknown>)?.entidadeId)
        .filter(Boolean)
    )

    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SECRETARIA'] }, ativo: true },
      select: { id: true, email: true }
    })

    const notificacoesVetoCriar: Prisma.NotificacaoMulticanalCreateManyInput[] = []
    for (const v of vetosComPrazo) {
      if (idsVetoNotificados.has(v.id)) continue
      const prazoVeto = new Date(v.updatedAt.getTime() + DIAS_PRAZO_VETO * 24 * 60 * 60 * 1000)
      const dias = Math.ceil((prazoVeto.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))

      for (const admin of admins) {
        notificacoesVetoCriar.push({
          canal: 'SISTEMA' as const,
          destinatario: admin.email,
          assunto:
            dias < 0
              ? `URGENTE: Veto com prazo expirado - ${v.tipo} ${v.numero}/${v.ano}`
              : `Veto em ${dias} dia(s) - ${v.tipo} ${v.numero}/${v.ano}`,
          mensagem: `O prazo de ${DIAS_PRAZO_VETO} dias para apreciação do veto sobre ${v.tipo} ${v.numero}/${v.ano} ${dias < 0 ? 'está expirado (pauta trancada)' : `expira em ${dias} dia(s)`}.`,
          metadata: {
            tipo: 'ALERTA_PRAZO',
            entidadeId: v.id,
            entidadeTipo: 'PROPOSICAO',
            prioridade: dias < 0 ? 'URGENTE' : 'ALTA',
            destinatarioUserId: admin.id,
            diasRestantes: dias
          }
        })
      }
    }

    if (notificacoesVetoCriar.length > 0) {
      await prisma.notificacaoMulticanal.createMany({ data: notificacoesVetoCriar })
      notificacoesCriadas += notificacoesVetoCriar.length
    }
  }

  return { notificacoesCriadas }
}

/**
 * Busca IDs de entidades ja notificadas nas ultimas 24h para evitar duplicacao.
 */
async function buscarIdsNotificados(entidadeTipo: string): Promise<Set<string>> {
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existentes = await prisma.notificacaoMulticanal.findMany({
    where: {
      canal: 'SISTEMA',
      metadata: { path: ['entidadeTipo'], equals: entidadeTipo },
      createdAt: { gte: ontem }
    },
    select: { metadata: true }
  })
  return new Set(
    existentes
      .map((n) => (n.metadata as Record<string, unknown>)?.entidadeId)
      .filter(Boolean) as string[]
  )
}

async function buscarDestinatariosAdmin(): Promise<{ id: string; email: string }[]> {
  return prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SECRETARIA'] }, ativo: true },
    select: { id: true, email: true }
  })
}

/**
 * RN-122 (PNTP): Pautas de sessao devem estar publicadas 48h antes da sessao.
 * Alerta operadores quando sessao esta em <= 48h e pauta esta RASCUNHO ou sem dataPublicacao.
 */
export async function verificarPautasAtrasadas(): Promise<{
  pendentes: number
  notificacoesCriadas: number
}> {
  const agora = new Date()
  const limite48h = new Date(agora.getTime() + HORAS_PRAZO_PAUTA * 60 * 60 * 1000)

  const sessoes = await prisma.sessao.findMany({
    where: {
      data: { gte: agora, lte: limite48h },
      status: 'AGENDADA'
    },
    select: {
      id: true,
      numero: true,
      tipo: true,
      data: true,
      pautaSessao: {
        select: {
          id: true,
          status: true,
          dataPublicacao: true,
          _count: { select: { itens: true } }
        }
      }
    }
  })

  // RN-122 (M9 refinado): pauta vazia (0 itens) NAO conta como publicada,
  // mesmo com status APROVADA e dataPublicacao preenchidos. Pauta sem itens
  // viola o espirito da regra (cidadao precisa ver O QUE sera tratado).
  const pendentes = sessoes.filter(
    (s) =>
      !s.pautaSessao ||
      s.pautaSessao.status === 'RASCUNHO' ||
      !s.pautaSessao.dataPublicacao ||
      s.pautaSessao._count.itens === 0
  )

  if (pendentes.length === 0) return { pendentes: 0, notificacoesCriadas: 0 }

  const idsNotificados = await buscarIdsNotificados('SESSAO_PAUTA')
  const admins = await buscarDestinatariosAdmin()
  if (admins.length === 0) return { pendentes: pendentes.length, notificacoesCriadas: 0 }

  const notificacoes: Prisma.NotificacaoMulticanalCreateManyInput[] = []
  for (const s of pendentes) {
    if (idsNotificados.has(s.id)) continue
    const horas = Math.max(
      0,
      Math.floor((s.data.getTime() - agora.getTime()) / (1000 * 60 * 60))
    )
    for (const admin of admins) {
      notificacoes.push({
        canal: 'SISTEMA' as const,
        destinatario: admin.email,
        assunto: `PNTP: Pauta pendente - Sessao ${s.tipo} #${s.numero} em ${horas}h`,
        mensagem: `A pauta da sessao ${s.tipo} #${s.numero} (${s.data.toISOString().split('T')[0]}) ainda nao foi publicada e a sessao ocorre em ${horas}h. RN-122 PNTP exige publicacao 48h antes.`,
        metadata: {
          tipo: 'ALERTA_PRAZO_PNTP',
          entidadeId: s.id,
          entidadeTipo: 'SESSAO_PAUTA',
          prioridade: horas <= 12 ? 'URGENTE' : 'ALTA',
          destinatarioUserId: admin.id,
          horasRestantes: horas,
          regra: 'RN-122'
        }
      })
    }
  }

  if (notificacoes.length > 0) {
    await prisma.notificacaoMulticanal.createMany({ data: notificacoes })
    logger.info(`RN-122: ${notificacoes.length} notificacao(oes) de pauta atrasada criada(s)`)
  }

  return { pendentes: pendentes.length, notificacoesCriadas: notificacoes.length }
}

/**
 * RN-123 (PNTP): Atas devem ser publicadas ate 15 dias apos aprovacao.
 * Alerta quando existe ata APROVADA sem dataPublicacaoAta ha >= 15 dias.
 */
export async function verificarAtasAtrasadas(): Promise<{
  pendentes: number
  notificacoesCriadas: number
}> {
  const agora = new Date()
  const limite15d = new Date(agora.getTime() - DIAS_PRAZO_ATA * 24 * 60 * 60 * 1000)

  // RN-123 (M9 refinado): ata APROVADA precisa ter conteudo real (ata em texto OU
  // arquivoAtaAssinada anexado). statusAta=APROVADA com ambos NULL nao deveria
  // existir, mas se existir, e indicador de inconsistencia que tambem deve alertar.
  const sessoes = await prisma.sessao.findMany({
    where: {
      statusAta: 'APROVADA',
      dataPublicacaoAta: null,
      updatedAt: { lte: limite15d }
    },
    select: {
      id: true,
      numero: true,
      tipo: true,
      data: true,
      updatedAt: true,
      ata: true,
      arquivoAtaAssinada: true
    }
  })

  if (sessoes.length === 0) return { pendentes: 0, notificacoesCriadas: 0 }

  const idsNotificados = await buscarIdsNotificados('SESSAO_ATA')
  const admins = await buscarDestinatariosAdmin()
  if (admins.length === 0) return { pendentes: sessoes.length, notificacoesCriadas: 0 }

  const notificacoes: Prisma.NotificacaoMulticanalCreateManyInput[] = []
  for (const s of sessoes) {
    if (idsNotificados.has(s.id)) continue
    const diasAtraso = Math.floor(
      (agora.getTime() - s.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    ) - DIAS_PRAZO_ATA
    const semConteudo = !s.ata?.trim() && !s.arquivoAtaAssinada
    const motivoExtra = semConteudo ? ' [INCONSISTENCIA: ata sem texto e sem arquivo anexado]' : ''
    for (const admin of admins) {
      notificacoes.push({
        canal: 'SISTEMA' as const,
        destinatario: admin.email,
        assunto: `PNTP: Ata atrasada - Sessao ${s.tipo} #${s.numero} (${diasAtraso}d atraso)`,
        mensagem: `A ata da sessao ${s.tipo} #${s.numero} foi aprovada ha mais de 15 dias e nao foi publicada${motivoExtra}. RN-123 PNTP exige publicacao em 15 dias. Atraso atual: ${diasAtraso} dia(s).`,
        metadata: {
          tipo: 'ALERTA_PRAZO_PNTP',
          entidadeId: s.id,
          entidadeTipo: 'SESSAO_ATA',
          prioridade: diasAtraso > 7 ? 'URGENTE' : 'ALTA',
          destinatarioUserId: admin.id,
          diasAtraso,
          regra: 'RN-123'
        }
      })
    }
  }

  if (notificacoes.length > 0) {
    await prisma.notificacaoMulticanal.createMany({ data: notificacoes })
    logger.info(`RN-123: ${notificacoes.length} notificacao(oes) de ata atrasada criada(s)`)
  }

  return { pendentes: sessoes.length, notificacoesCriadas: notificacoes.length }
}

/**
 * RN-124 (PNTP): Contratos devem ser publicados em ate 24h apos assinatura.
 * Alerta quando existe contrato assinado ha >= 24h sem dataPublicacao.
 */
export async function verificarContratosAtrasados(): Promise<{
  pendentes: number
  notificacoesCriadas: number
}> {
  const agora = new Date()
  const limite24h = new Date(agora.getTime() - HORAS_PRAZO_CONTRATO * 60 * 60 * 1000)

  const contratos = await prisma.contrato.findMany({
    where: {
      dataPublicacao: null,
      dataAssinatura: { lte: limite24h }
    },
    select: {
      id: true,
      numero: true,
      ano: true,
      contratado: true,
      dataAssinatura: true
    }
  })

  if (contratos.length === 0) return { pendentes: 0, notificacoesCriadas: 0 }

  const idsNotificados = await buscarIdsNotificados('CONTRATO')
  const admins = await buscarDestinatariosAdmin()
  if (admins.length === 0) return { pendentes: contratos.length, notificacoesCriadas: 0 }

  const notificacoes: Prisma.NotificacaoMulticanalCreateManyInput[] = []
  for (const c of contratos) {
    if (idsNotificados.has(c.id)) continue
    const horasAtraso = Math.floor(
      (agora.getTime() - c.dataAssinatura.getTime()) / (1000 * 60 * 60)
    ) - HORAS_PRAZO_CONTRATO
    for (const admin of admins) {
      notificacoes.push({
        canal: 'SISTEMA' as const,
        destinatario: admin.email,
        assunto: `PNTP: Contrato ${c.numero}/${c.ano} sem publicacao (${horasAtraso}h atraso)`,
        mensagem: `O contrato ${c.numero}/${c.ano} com ${c.contratado} foi assinado em ${c.dataAssinatura.toISOString().split('T')[0]} e ainda nao tem dataPublicacao. RN-124 PNTP exige publicacao em 24h. Atraso atual: ${horasAtraso}h.`,
        metadata: {
          tipo: 'ALERTA_PRAZO_PNTP',
          entidadeId: c.id,
          entidadeTipo: 'CONTRATO',
          prioridade: horasAtraso > 72 ? 'URGENTE' : 'ALTA',
          destinatarioUserId: admin.id,
          horasAtraso,
          regra: 'RN-124'
        }
      })
    }
  }

  if (notificacoes.length > 0) {
    await prisma.notificacaoMulticanal.createMany({ data: notificacoes })
    logger.info(`RN-124: ${notificacoes.length} notificacao(oes) de contrato atrasado criada(s)`)
  }

  return { pendentes: contratos.length, notificacoesCriadas: notificacoes.length }
}

/**
 * RN-140 (LAI): e-SIC tem prazo de 20 dias uteis (prorrogavel por 10).
 * Alerta 3 dias antes do vencimento e marca como VENCIDO apos o prazo.
 */
export async function verificarPrazosESIC(): Promise<{
  proximosVencimento: number
  vencidos: number
  notificacoesCriadas: number
}> {
  const agora = new Date()
  const em3Dias = new Date(agora.getTime() + DIAS_ANTECEDENCIA_ESIC * 24 * 60 * 60 * 1000)

  // Status que ainda exigem resposta (LAI 12.527/2011): inclui recursos.
  // RESPONDIDO, NEGADO, ARQUIVADO sao terminais. Cada instancia tem seu proprio
  // prazo (LAI art. 15: 10 dias para 1a instancia; art. 16: 5 dias para 2a).
  const solicitacoes = await prisma.solicitacaoESIC.findMany({
    where: {
      status: {
        in: [
          'ABERTO',
          'EM_ANALISE',
          'PRORROGADO',
          'RECURSO',
          'RECURSO_PRIMEIRA_INSTANCIA',
          'RECURSO_SEGUNDA_INSTANCIA'
        ]
      },
      prazoResposta: { lte: em3Dias }
    },
    select: {
      id: true,
      protocolo: true,
      assunto: true,
      prazoResposta: true,
      respondidoPor: true,
      status: true
    }
  })

  if (solicitacoes.length === 0) {
    return { proximosVencimento: 0, vencidos: 0, notificacoesCriadas: 0 }
  }

  const idsNotificados = await buscarIdsNotificados('ESIC')
  const admins = await buscarDestinatariosAdmin()
  if (admins.length === 0) {
    return {
      proximosVencimento: solicitacoes.filter((s) => s.prazoResposta > agora).length,
      vencidos: solicitacoes.filter((s) => s.prazoResposta <= agora).length,
      notificacoesCriadas: 0
    }
  }

  const notificacoes: Prisma.NotificacaoMulticanalCreateManyInput[] = []
  let proximosVencimento = 0
  let vencidos = 0

  for (const s of solicitacoes) {
    const dias = Math.ceil((s.prazoResposta.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    if (dias < 0) vencidos++
    else proximosVencimento++

    if (idsNotificados.has(s.id)) continue

    // Mensagem contextualizada por status (LAI 12.527/2011)
    const contextoStatus = (() => {
      switch (s.status) {
        case 'RECURSO_PRIMEIRA_INSTANCIA':
          return 'em recurso de 1a instancia (LAI art. 15 - decidir em 5 dias)'
        case 'RECURSO_SEGUNDA_INSTANCIA':
          return 'em recurso de 2a instancia (LAI art. 16 - decidir em 5 dias)'
        case 'PRORROGADO':
          return 'com prazo prorrogado (LAI art. 11 §2 - +10 dias)'
        case 'RECURSO':
          return 'em recurso (legado)'
        default:
          return 'aguardando resposta inicial (LAI - 20 dias uteis)'
      }
    })()

    for (const admin of admins) {
      notificacoes.push({
        canal: 'SISTEMA' as const,
        destinatario: admin.email,
        assunto:
          dias < 0
            ? `LAI VENCIDO: e-SIC ${s.protocolo} (${Math.abs(dias)}d atraso)`
            : `LAI: e-SIC ${s.protocolo} vence em ${dias} dia(s)`,
        mensagem: `A solicitacao e-SIC ${s.protocolo} (${s.assunto}) esta ${contextoStatus} e ${dias < 0 ? `vencida ha ${Math.abs(dias)} dia(s)` : `vence em ${dias} dia(s)`}. Prazo limite: ${s.prazoResposta.toISOString().split('T')[0]}.`,
        metadata: {
          tipo: 'ALERTA_PRAZO_PNTP',
          entidadeId: s.id,
          entidadeTipo: 'ESIC',
          prioridade: dias < 0 ? 'URGENTE' : 'ALTA',
          destinatarioUserId: admin.id,
          diasRestantes: dias,
          regra: 'RN-140'
        }
      })
    }
  }

  if (notificacoes.length > 0) {
    await prisma.notificacaoMulticanal.createMany({ data: notificacoes })
    logger.info(`RN-140: ${notificacoes.length} notificacao(oes) de e-SIC criada(s)`)
  }

  return { proximosVencimento, vencidos, notificacoesCriadas: notificacoes.length }
}

// Valor DIAS_UTEIS_ESIC exposto para testes e documentacao
export const CONSTANTES_PRAZOS_PNTP = {
  HORAS_PRAZO_PAUTA,
  DIAS_PRAZO_ATA,
  HORAS_PRAZO_CONTRATO,
  DIAS_UTEIS_ESIC,
  DIAS_ANTECEDENCIA_ESIC
} as const
