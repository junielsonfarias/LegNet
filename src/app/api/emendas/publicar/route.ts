/**
 * RN-174 — Publicacao de Emenda.
 *
 * Espelha RN-170/171/172/173 para Emenda. A emenda publicada vive em
 * `Emenda.arquivoUrl` + `Emenda.dataPublicacao`. Sem fonte paralela em
 * Publicacao.
 *
 * Dois modos:
 *  1. `emendaId` informado -> anexa PDF a emenda existente.
 *  2. `proposicaoId + numero + tipo + autorId + textoNovo + justificativa`
 *     informados -> find-or-create. Se nao achar emenda com
 *     (proposicaoId, numero), cria nova com `status='APRESENTADA'`
 *     usando o `@@unique([proposicaoId, numero])`.
 *
 * Permissoes: ADMIN ou SECRETARIA (via `proposicao.manage`).
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
import { logAudit } from '@/lib/audit'

const TipoEmendaSchema = z.enum([
  'ADITIVA',
  'MODIFICATIVA',
  'SUPRESSIVA',
  'SUBSTITUTIVA',
  'EMENDA_DE_REDACAO',
  'AGLUTINATIVA',
])

const PublicarEmendaSchema = z
  .object({
    emendaId: z.string().nullish().transform((v) => v ?? undefined),

    // Find-or-create
    proposicaoId: z.string().nullish().transform((v) => v ?? undefined),
    numero: z.number().int().positive().nullish().transform((v) => v ?? undefined),
    tipo: TipoEmendaSchema.nullish().transform((v) => v ?? undefined),
    autorId: z.string().nullish().transform((v) => v ?? undefined),
    textoNovo: z.string().min(1).max(50000).nullish().transform((v) => v ?? undefined),
    justificativa: z.string().min(1).max(50000).nullish().transform((v) => v ?? undefined),
    textoOriginal: z.string().max(50000).nullish().transform((v) => v ?? undefined),
    artigo: z.string().max(100).nullish().transform((v) => v ?? undefined),
    paragrafo: z.string().max(100).nullish().transform((v) => v ?? undefined),
    inciso: z.string().max(50).nullish().transform((v) => v ?? undefined),
    alinea: z.string().max(50).nullish().transform((v) => v ?? undefined),
    dispositivo: z.string().max(2000).nullish().transform((v) => v ?? undefined),

    // Dados do arquivo
    arquivoUrl: z.string().url('URL do arquivo deve ser valida'),
    arquivoNome: z.string().max(255).nullish().transform((v) => v ?? undefined),
    dataPublicacao: z.string().nullish().transform((v) => v ?? undefined),

    observacoes: z.string().max(2000).nullish().transform((v) => v ?? undefined),
  })
  .refine(
    (d) =>
      d.emendaId ||
      (d.proposicaoId && d.numero && d.tipo && d.autorId && d.textoNovo && d.justificativa),
    {
      message:
        'Forneca emendaId OU proposicaoId + numero + tipo + autorId + textoNovo + justificativa.',
    },
  )

export const POST = withAuth(
  withErrorHandler(async (request: NextRequest, _context, session: Session) => {
    const role = (session.user as { role?: string })?.role
    if (role !== 'ADMIN' && role !== 'SECRETARIA') {
      throw new UnauthorizedError(
        'Apenas ADMIN ou SECRETARIA podem publicar emendas',
      )
    }

    const body = await request.json()
    const payload = PublicarEmendaSchema.parse(body)

    const dataPublicacao = payload.dataPublicacao
      ? new Date(payload.dataPublicacao)
      : new Date()

    let emendaAlvoId: string
    let emendaCriada = false

    if (payload.emendaId) {
      const existing = await prisma.emenda.findUnique({
        where: { id: payload.emendaId },
        select: { id: true },
      })
      if (!existing) {
        throw new NotFoundError(`Emenda ${payload.emendaId}`)
      }
      emendaAlvoId = existing.id
    } else {
      if (
        !payload.proposicaoId ||
        !payload.numero ||
        !payload.tipo ||
        !payload.autorId ||
        !payload.textoNovo ||
        !payload.justificativa
      ) {
        throw new ValidationError(
          'Forneca proposicaoId, numero, tipo, autorId, textoNovo e justificativa quando emendaId nao for informado',
        )
      }

      const [proposicao, autor] = await Promise.all([
        prisma.proposicao.findUnique({
          where: { id: payload.proposicaoId },
          select: { id: true },
        }),
        prisma.parlamentar.findUnique({
          where: { id: payload.autorId },
          select: { id: true },
        }),
      ])
      if (!proposicao) {
        throw new NotFoundError(`Proposicao ${payload.proposicaoId}`)
      }
      if (!autor) {
        throw new NotFoundError(`Autor ${payload.autorId}`)
      }

      const found = await prisma.emenda.findUnique({
        where: {
          proposicaoId_numero: {
            proposicaoId: payload.proposicaoId,
            numero: payload.numero,
          },
        },
        select: { id: true },
      })

      if (found) {
        emendaAlvoId = found.id
      } else {
        const nova = await prisma.emenda.create({
          data: {
            proposicaoId: payload.proposicaoId,
            numero: payload.numero,
            tipo: payload.tipo,
            status: 'APRESENTADA',
            autorId: payload.autorId,
            textoNovo: payload.textoNovo,
            justificativa: payload.justificativa,
            textoOriginal: payload.textoOriginal ?? null,
            artigo: payload.artigo ?? null,
            paragrafo: payload.paragrafo ?? null,
            inciso: payload.inciso ?? null,
            alinea: payload.alinea ?? null,
            dispositivo: payload.dispositivo ?? null,
            observacoes: payload.observacoes ?? null,
          },
          select: { id: true },
        })
        emendaAlvoId = nova.id
        emendaCriada = true
      }
    }

    const atualizada = await prisma.emenda.update({
      where: { id: emendaAlvoId },
      data: {
        arquivoUrl: payload.arquivoUrl,
        ...(payload.arquivoNome ? { arquivoNome: payload.arquivoNome } : {}),
        dataPublicacao,
        ...(payload.observacoes ? { observacoes: payload.observacoes } : {}),
      },
      select: {
        id: true,
        proposicaoId: true,
        numero: true,
        tipo: true,
        status: true,
        autorId: true,
        arquivoUrl: true,
        dataPublicacao: true,
      },
    })

    await logAudit({
      request,
      session,
      action: 'EMENDA_PUBLICACAO',
      entity: 'Emenda',
      entityId: atualizada.id,
      metadata: {
        emendaCriada,
        proposicaoId: atualizada.proposicaoId,
        numero: atualizada.numero,
        tipo: atualizada.tipo,
        autorId: atualizada.autorId,
        dataPublicacao: dataPublicacao.toISOString(),
      },
    })

    return createSuccessResponse(
      { ...atualizada, emendaCriada },
      emendaCriada
        ? 'Emenda criada e publicada com sucesso'
        : 'Emenda publicada com sucesso',
      undefined,
      201,
    )
  }),
  { permissions: 'proposicao.manage' },
)
