import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  UnauthorizedError
} from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * Fase 3 / C8 - Proposicao retroativa
 *
 * Cria uma proposicao para uma sessao ja CONCLUIDA, marcando como
 * `entradaRetroativa = true`. Pula validacoes regimentais (RN-020 iniciativa,
 * RN-030 parecer CLJ, RN-032 prazos), mantendo audit log com `motivoRetroativo`
 * obrigatorio.
 *
 * Caso de uso: digitalizar proposicoes do sistema antigo, registrar
 * historico de gestoes anteriores, importar dados em massa.
 *
 * Permissoes: ADMIN ou SECRETARIA (verificado em runtime alem do withAuth).
 */
const SchemaProposicaoRetroativa = z.object({
  tipo: z.string().min(2).max(50),
  numero: z.union([z.string().min(1), z.number().int().min(1)]).transform(String),
  ano: z.number().int().min(1900).max(2100),
  titulo: z.string().min(3).max(500),
  ementa: z.string().min(5).max(5000),
  texto: z.string().nullish().transform(v => v ?? undefined),
  urlDocumento: z.string().url().nullish().transform(v => v ?? undefined),
  autorId: z.string().nullish().transform(v => v ?? undefined),
  autorEntidadeId: z.string().nullish().transform(v => v ?? undefined),
  // Resultado ja decidido
  resultado: z.enum(['APROVADA', 'REJEITADA', 'ADIADA', 'RETIRADA', 'LEITURA']),
  // Motivo obrigatorio para auditoria
  motivo: z.string().min(5, 'Motivo e obrigatorio (minimo 5 caracteres)').max(500),
  // Secao da pauta opcional (default ORDEM_DO_DIA para votacoes, EXPEDIENTE para leituras)
  secao: z.string().optional()
})

const STATUS_BY_RESULTADO: Record<string, string> = {
  APROVADA: 'APROVADA',
  REJEITADA: 'REJEITADA',
  ADIADA: 'EM_TRAMITACAO',
  RETIRADA: 'ARQUIVADA',
  LEITURA: 'EM_TRAMITACAO'
}

const STATUS_ITEM_BY_RESULTADO: Record<string, string> = {
  APROVADA: 'APROVADO',
  REJEITADA: 'REJEITADO',
  ADIADA: 'ADIADO',
  RETIRADA: 'RETIRADO',
  LEITURA: 'CONCLUIDO'
}

export const POST = withAuth(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }, session: Session) => {
    // Permissao adicional: somente ADMIN ou SECRETARIA podem criar entradas retroativas
    const role = (session.user as { role?: string })?.role
    if (role !== 'ADMIN' && role !== 'SECRETARIA') {
      throw new UnauthorizedError('Apenas ADMIN ou SECRETARIA podem criar proposicao retroativa')
    }

    const { id } = await context.params
    const sessaoId = await resolverSessaoId(id)

    const body = await request.json()
    const data = SchemaProposicaoRetroativa.parse(body)

    // Sessao precisa existir e estar CONCLUIDA (entrada retroativa de dados pretericos)
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      select: { id: true, numero: true, tipo: true, data: true, status: true, finalizada: true }
    })
    if (!sessao) throw new NotFoundError('Sessao')
    if (sessao.status !== 'CONCLUIDA') {
      throw new ValidationError(
        'Proposicao retroativa so pode ser registrada em sessoes CONCLUIDAS. ' +
        `Sessao atual: ${sessao.status}.`
      )
    }

    // Numero ja existe para o tipo+ano? evita colisao
    const conflito = await prisma.proposicao.findFirst({
      where: { tipo: data.tipo, numero: String(data.numero), ano: data.ano },
      select: { id: true }
    })
    if (conflito) {
      throw new ValidationError(
        `Ja existe proposicao ${data.tipo} ${data.numero}/${data.ano}. ` +
        'Use outro numero ou edite a proposicao existente.'
      )
    }

    const dataSessao = new Date(sessao.data)
    const status = STATUS_BY_RESULTADO[data.resultado] as
      | 'APROVADA' | 'REJEITADA' | 'EM_TRAMITACAO' | 'ARQUIVADA'
    const statusItem = STATUS_ITEM_BY_RESULTADO[data.resultado]

    // Garantir que existe PautaSessao (pode nao ter sido criada para a sessao)
    const pauta = await prisma.pautaSessao.upsert({
      where: { sessaoId },
      create: { sessaoId, status: 'CONCLUIDA' },
      update: {}
    })

    // Resultado da proposicao (campo Proposicao.resultado)
    const resultadoVotacao =
      data.resultado === 'APROVADA' ? 'APROVADA'
        : data.resultado === 'REJEITADA' ? 'REJEITADA'
        : data.resultado === 'ADIADA' ? 'ADIADA'
        : data.resultado === 'RETIRADA' ? 'RETIRADA'
        : null

    const secaoFinal = data.secao || (data.resultado === 'LEITURA' ? 'EXPEDIENTE' : 'ORDEM_DO_DIA')
    const tipoAcaoFinal = data.resultado === 'LEITURA' ? 'LEITURA' : 'VOTACAO'

    // Cria proposicao + tramitacao + item de pauta em transacao
    const result = await prisma.$transaction(async (tx) => {
      // Calcula proxima ordem
      const ultimoItem = await tx.pautaItem.findFirst({
        where: { pautaId: pauta.id, secao: secaoFinal },
        orderBy: { ordem: 'desc' },
        select: { ordem: true }
      })
      const proximaOrdem = (ultimoItem?.ordem ?? 0) + 1

      const proposicao = await tx.proposicao.create({
        data: {
          tipo: data.tipo,
          numero: String(data.numero),
          ano: data.ano,
          titulo: data.titulo,
          ementa: data.ementa,
          texto: data.texto,
          urlDocumento: data.urlDocumento,
          status: status as never,
          dataApresentacao: dataSessao,
          dataVotacao: data.resultado === 'LEITURA' ? null : dataSessao,
          dataLeitura: data.resultado === 'LEITURA' ? dataSessao : null,
          resultado: resultadoVotacao as never,
          sessaoId,
          sessaoVotacaoId: data.resultado === 'LEITURA' ? null : sessaoId,
          autorId: data.autorId,
          autorEntidadeId: data.autorEntidadeId,
          entradaRetroativa: true,
          motivoRetroativo: data.motivo
        }
      })

      // Item de pauta com status final ja decidido
      const item = await tx.pautaItem.create({
        data: {
          pautaId: pauta.id,
          ordem: proximaOrdem,
          secao: secaoFinal,
          titulo: `${data.tipo} ${data.numero}/${data.ano} — ${data.titulo}`,
          tipoAcao: tipoAcaoFinal as never,
          tipoVotacao: data.resultado === 'LEITURA' ? 'LEITURA' as never : 'NOMINAL' as never,
          status: statusItem as never,
          proposicaoId: proposicao.id
        }
      })

      return { proposicao, item }
    })

    await logAudit({
      request,
      session,
      action: 'PROPOSICAO_RETROATIVA_CREATE',
      entity: 'Proposicao',
      entityId: result.proposicao.id,
      metadata: {
        sessaoId,
        sessaoNumero: sessao.numero,
        sessaoData: sessao.data.toISOString(),
        resultado: data.resultado,
        motivo: data.motivo,
        proposicao: `${data.tipo} ${data.numero}/${data.ano}`
      }
    })

    return createSuccessResponse(
      {
        proposicao: result.proposicao,
        item: result.item
      },
      `Proposicao retroativa registrada (${data.tipo} ${data.numero}/${data.ano} — ${data.resultado})`,
      undefined,
      201
    )
  },
  { permissions: 'sessao.manage' }
)
