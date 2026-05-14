/**
 * RN-172 — Publicacao de Pauta de Reuniao de Comissao.
 *
 * Espelha RN-171 (Pauta de Sessao) para reunioes de comissao. A pauta
 * vive em `ReuniaoComissao.arquivoPauta` +
 * `ReuniaoComissao.dataPublicacaoPauta`.
 *
 * Dois modos:
 *  1. `reuniaoId` informado -> anexa pauta em reuniao existente.
 *  2. `comissaoId + numero + ano + tipo` informados -> find-or-create.
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
import { logAudit } from '@/lib/audit'

const TipoReuniaoSchema = z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'ESPECIAL'])

const PublicarPautaSchema = z
  .object({
    reuniaoId: z.string().nullish().transform((v) => v ?? undefined),

    comissaoId: z.string().nullish().transform((v) => v ?? undefined),
    numero: z.number().int().positive().nullish().transform((v) => v ?? undefined),
    ano: z.number().int().min(1900).max(2100).nullish().transform((v) => v ?? undefined),
    tipo: TipoReuniaoSchema.nullish().transform((v) => v ?? undefined),
    data: z.string().nullish().transform((v) => v ?? undefined),
    local: z.string().nullish().transform((v) => v ?? undefined),

    arquivoPautaUrl: z.string().url('URL do arquivo da pauta deve ser valida'),
    dataPublicacaoPauta: z.string().nullish().transform((v) => v ?? undefined),
    observacoes: z.string().max(2000).nullish().transform((v) => v ?? undefined),
  })
  .refine(
    (d) =>
      d.reuniaoId || (d.comissaoId && d.numero && d.ano && d.tipo && d.data),
    {
      message:
        'Forneca reuniaoId OU comissaoId + numero + ano + tipo + data.',
    },
  )

export const POST = withAuth(
  withErrorHandler(async (request: NextRequest, _context, session: Session) => {
    const role = (session.user as { role?: string })?.role
    if (role !== 'ADMIN' && role !== 'SECRETARIA') {
      throw new UnauthorizedError(
        'Apenas ADMIN ou SECRETARIA podem publicar pautas de reuniao',
      )
    }

    const body = await request.json()
    const payload = PublicarPautaSchema.parse(body)

    const dataPublicacao = payload.dataPublicacaoPauta
      ? new Date(payload.dataPublicacaoPauta)
      : new Date()

    let reuniaoAlvoId: string
    let reuniaoCriada = false

    if (payload.reuniaoId) {
      const existing = await prisma.reuniaoComissao.findUnique({
        where: { id: payload.reuniaoId },
        select: { id: true },
      })
      if (!existing) {
        throw new NotFoundError(`Reuniao ${payload.reuniaoId}`)
      }
      reuniaoAlvoId = existing.id
    } else {
      if (
        !payload.comissaoId ||
        !payload.numero ||
        !payload.ano ||
        !payload.tipo ||
        !payload.data
      ) {
        throw new ValidationError(
          'Forneca comissaoId, numero, ano, tipo e data quando reuniaoId nao for informado',
        )
      }

      const comissao = await prisma.comissao.findUnique({
        where: { id: payload.comissaoId },
        select: { id: true },
      })
      if (!comissao) {
        throw new NotFoundError(`Comissao ${payload.comissaoId}`)
      }

      const found = await prisma.reuniaoComissao.findFirst({
        where: {
          comissaoId: payload.comissaoId,
          numero: payload.numero,
          ano: payload.ano,
        },
        select: { id: true },
      })

      if (found) {
        reuniaoAlvoId = found.id
      } else {
        const nova = await prisma.reuniaoComissao.create({
          data: {
            comissaoId: payload.comissaoId,
            numero: payload.numero,
            ano: payload.ano,
            tipo: payload.tipo,
            status: 'CONCLUIDA',
            data: new Date(payload.data),
            local: payload.local ?? null,
            criadoPorId: session.user.id,
          },
          select: { id: true },
        })
        reuniaoAlvoId = nova.id
        reuniaoCriada = true
      }
    }

    const atualizada = await prisma.reuniaoComissao.update({
      where: { id: reuniaoAlvoId },
      data: {
        arquivoPauta: payload.arquivoPautaUrl,
        dataPublicacaoPauta: dataPublicacao,
        ...(payload.observacoes ? { observacoes: payload.observacoes } : {}),
      },
      select: {
        id: true,
        comissaoId: true,
        numero: true,
        ano: true,
        tipo: true,
        data: true,
        arquivoPauta: true,
        dataPublicacaoPauta: true,
      },
    })

    await logAudit({
      request,
      session,
      action: 'REUNIAO_COMISSAO_PAUTA_PUBLICACAO',
      entity: 'ReuniaoComissao',
      entityId: atualizada.id,
      metadata: {
        reuniaoCriada,
        comissaoId: atualizada.comissaoId,
        numero: atualizada.numero,
        ano: atualizada.ano,
        tipo: atualizada.tipo,
        dataPublicacaoPauta: dataPublicacao.toISOString(),
      },
    })

    return createSuccessResponse(
      { ...atualizada, reuniaoCriada },
      reuniaoCriada
        ? 'Reuniao criada e pauta publicada com sucesso'
        : 'Pauta publicada com sucesso',
      undefined,
      201,
    )
  }),
  { permissions: 'comissao.manage' },
)
