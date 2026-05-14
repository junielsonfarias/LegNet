/**
 * RN-171 — Publicacao de Pauta da Sessao
 *
 * Espelha o RN-170 (Ata) para Pauta. A pauta vive em
 * `Sessao.arquivoPauta` (URL do PDF) e `PautaSessao.dataPublicacao`.
 * Sem fonte paralela em Publicacao.
 *
 * Dois modos:
 *  1. `sessaoId` informado -> anexa pauta a sessao existente.
 *  2. `numero + tipo + data` -> find-or-create. Se nao achar Sessao com
 *     (numero, tipo, ano da data), cria nova com `status=CONCLUIDA,
 *     finalizada=true` via `sessaoDbService.create` (que ja cria
 *     `PautaSessao` placeholder).
 *
 * Garantia: sempre existe `PautaSessao` apos a operacao — criada pelo
 * service ou criada aqui se a sessao for legada sem pauta.
 *
 * Permissoes: ADMIN ou SECRETARIA.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/error-handler'
import { sessaoDbService } from '@/lib/services/sessao-db-service'
import { logAudit } from '@/lib/audit'

const TipoSessaoSchema = z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL'])

const PublicarPautaSchema = z
  .object({
    sessaoId: z.string().nullish().transform((v) => v ?? undefined),

    numero: z.number().int().positive().nullish().transform((v) => v ?? undefined),
    tipo: TipoSessaoSchema.nullish().transform((v) => v ?? undefined),
    data: z.string().nullish().transform((v) => v ?? undefined),
    horario: z.string().nullish().transform((v) => v ?? undefined),
    local: z.string().nullish().transform((v) => v ?? undefined),

    arquivoPautaUrl: z.string().url('URL do arquivo da pauta deve ser valida'),
    dataPublicacaoPauta: z.string().nullish().transform((v) => v ?? undefined),
    observacoes: z.string().max(2000).nullish().transform((v) => v ?? undefined),
  })
  .refine(
    (d) => d.sessaoId || (d.numero && d.tipo && d.data),
    {
      message:
        'Forneca sessaoId (sessao existente) OU numero+tipo+data (find-or-create).',
    },
  )

export const POST = withAuth(
  withErrorHandler(async (request: NextRequest, _context, session: Session) => {
    const role = (session.user as { role?: string })?.role
    if (role !== 'ADMIN' && role !== 'SECRETARIA') {
      throw new UnauthorizedError(
        'Apenas ADMIN ou SECRETARIA podem publicar pautas',
      )
    }

    const body = await request.json()
    const payload = PublicarPautaSchema.parse(body)

    const dataPublicacao = payload.dataPublicacaoPauta
      ? new Date(payload.dataPublicacaoPauta)
      : new Date()

    let sessaoAlvoId: string
    let sessaoCriada = false

    if (payload.sessaoId) {
      const existing = await prisma.sessao.findUnique({
        where: { id: payload.sessaoId },
        select: { id: true },
      })
      if (!existing) {
        throw new NotFoundError(`Sessao ${payload.sessaoId}`)
      }
      sessaoAlvoId = existing.id
    } else {
      if (!payload.numero || !payload.tipo || !payload.data) {
        throw new ValidationError(
          'Forneca numero, tipo e data quando sessaoId nao for informado',
        )
      }

      const dataSessao = new Date(payload.data)
      const anoSessao = dataSessao.getUTCFullYear()
      const inicioAno = new Date(Date.UTC(anoSessao, 0, 1))
      const inicioProxAno = new Date(Date.UTC(anoSessao + 1, 0, 1))

      const found = await prisma.sessao.findFirst({
        where: {
          numero: payload.numero,
          tipo: payload.tipo,
          data: { gte: inicioAno, lt: inicioProxAno },
        },
        select: { id: true },
      })

      if (found) {
        sessaoAlvoId = found.id
      } else {
        const novaResult = await sessaoDbService.create(
          {
            numero: payload.numero,
            tipo: payload.tipo,
            data: payload.data,
            horario: payload.horario ?? null,
            local: payload.local ?? null,
            status: 'CONCLUIDA',
            finalizada: true,
          },
          session.user.id,
        )
        if (!novaResult?.sessao?.id) {
          throw new ValidationError('Falha ao criar sessao automaticamente')
        }
        sessaoAlvoId = novaResult.sessao.id
        sessaoCriada = true
      }
    }

    // Garantir que existe PautaSessao para a sessao alvo. O service create()
    // ja cria uma placeholder; mas sessoes legadas podem nao ter.
    const pautaExistente = await prisma.pautaSessao.findUnique({
      where: { sessaoId: sessaoAlvoId },
      select: { id: true },
    })

    const result = await prisma.$transaction(async (tx) => {
      // Atualiza Sessao.arquivoPauta
      const sessaoAtualizada = await tx.sessao.update({
        where: { id: sessaoAlvoId },
        data: { arquivoPauta: payload.arquivoPautaUrl },
        select: {
          id: true,
          numero: true,
          tipo: true,
          data: true,
          arquivoPauta: true,
        },
      })

      // Atualiza ou cria PautaSessao
      if (pautaExistente) {
        await tx.pautaSessao.update({
          where: { sessaoId: sessaoAlvoId },
          data: {
            dataPublicacao,
            status: 'APROVADA',
          },
        })
      } else {
        await tx.pautaSessao.create({
          data: {
            sessaoId: sessaoAlvoId,
            status: 'APROVADA',
            geradaAutomaticamente: false,
            tempoTotalEstimado: 0,
            dataPublicacao,
            observacoes: 'Pauta publicada via publicar-pauta (RN-171).',
          },
        })
      }

      return sessaoAtualizada
    })

    await logAudit({
      request,
      session,
      action: 'SESSAO_PAUTA_PUBLICACAO',
      entity: 'Sessao',
      entityId: result.id,
      metadata: {
        sessaoCriada,
        numero: result.numero,
        tipo: result.tipo,
        dataPublicacaoPauta: dataPublicacao.toISOString(),
        observacoes: payload.observacoes ?? null,
      },
    })

    return createSuccessResponse(
      { ...result, sessaoCriada, dataPublicacao },
      sessaoCriada
        ? 'Sessao criada e pauta publicada com sucesso'
        : 'Pauta publicada com sucesso',
      undefined,
      201,
    )
  }),
  { permissions: 'sessao.manage' },
)
