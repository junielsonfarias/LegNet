/**
 * RN-173 — Publicacao de Parecer de Comissao.
 *
 * Espelha RN-170/171/172 para Parecer. O parecer vive em `Parecer.arquivoUrl`
 * + `Parecer.dataEmissao` + `Parecer.status='EMITIDO'`. Sem fonte paralela
 * em Publicacao.
 *
 * Dois modos:
 *  1. `parecerId` informado -> anexa PDF a parecer existente.
 *  2. `proposicaoId + comissaoId + relatorId + tipo + fundamentacao`
 *     informados -> find-or-create. Se nao achar Parecer com
 *     (proposicaoId, comissaoId), cria novo com `status='EMITIDO'`
 *     usando o `@@unique([proposicaoId, comissaoId])` existente.
 *
 * Schema ja tinha os campos prontos — sem migration necessaria.
 *
 * Permissoes: ADMIN ou SECRETARIA (via `comissao.manage`).
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

const TipoParecerSchema = z.enum([
  'FAVORAVEL',
  'FAVORAVEL_COM_EMENDAS',
  'CONTRARIO',
  'PELA_INCONSTITUCIONALIDADE',
  'PELA_ILEGALIDADE',
  'PELA_PREJUDICIALIDADE',
  'PELA_RETIRADA',
])

const PublicarParecerSchema = z
  .object({
    parecerId: z.string().nullish().transform((v) => v ?? undefined),

    // Find-or-create
    proposicaoId: z.string().nullish().transform((v) => v ?? undefined),
    comissaoId: z.string().nullish().transform((v) => v ?? undefined),
    relatorId: z.string().nullish().transform((v) => v ?? undefined),
    reuniaoId: z.string().nullish().transform((v) => v ?? undefined),
    tipo: TipoParecerSchema.nullish().transform((v) => v ?? undefined),
    numero: z.string().max(50).nullish().transform((v) => v ?? undefined),
    ano: z.number().int().min(1900).max(2100).nullish().transform((v) => v ?? undefined),
    fundamentacao: z.string().min(10).max(50000).nullish().transform((v) => v ?? undefined),
    ementa: z.string().max(2000).nullish().transform((v) => v ?? undefined),
    conclusao: z.string().max(5000).nullish().transform((v) => v ?? undefined),

    // Dados do arquivo
    arquivoUrl: z.string().url('URL do arquivo deve ser valida'),
    arquivoNome: z.string().max(255).nullish().transform((v) => v ?? undefined),
    arquivoTamanho: z.number().int().nonnegative().nullish().transform((v) => v ?? undefined),

    // Datas
    dataDistribuicao: z.string().nullish().transform((v) => v ?? undefined),
    dataEmissao: z.string().nullish().transform((v) => v ?? undefined),

    observacoes: z.string().max(2000).nullish().transform((v) => v ?? undefined),
  })
  .refine(
    (d) =>
      d.parecerId ||
      (d.proposicaoId && d.comissaoId && d.relatorId && d.tipo && d.fundamentacao),
    {
      message:
        'Forneca parecerId OU proposicaoId + comissaoId + relatorId + tipo + fundamentacao.',
    },
  )

export const POST = withAuth(
  withErrorHandler(async (request: NextRequest, _context, session: Session) => {
    const role = (session.user as { role?: string })?.role
    if (role !== 'ADMIN' && role !== 'SECRETARIA') {
      throw new UnauthorizedError(
        'Apenas ADMIN ou SECRETARIA podem publicar pareceres',
      )
    }

    const body = await request.json()
    const payload = PublicarParecerSchema.parse(body)

    const dataEmissao = payload.dataEmissao
      ? new Date(payload.dataEmissao)
      : new Date()

    let parecerAlvoId: string
    let parecerCriado = false

    if (payload.parecerId) {
      const existing = await prisma.parecer.findUnique({
        where: { id: payload.parecerId },
        select: { id: true },
      })
      if (!existing) {
        throw new NotFoundError(`Parecer ${payload.parecerId}`)
      }
      parecerAlvoId = existing.id
    } else {
      if (
        !payload.proposicaoId ||
        !payload.comissaoId ||
        !payload.relatorId ||
        !payload.tipo ||
        !payload.fundamentacao
      ) {
        throw new ValidationError(
          'Forneca proposicaoId, comissaoId, relatorId, tipo e fundamentacao quando parecerId nao for informado',
        )
      }

      // Valida que proposicao, comissao e relator existem
      const [proposicao, comissao, relator] = await Promise.all([
        prisma.proposicao.findUnique({
          where: { id: payload.proposicaoId },
          select: { id: true },
        }),
        prisma.comissao.findUnique({
          where: { id: payload.comissaoId },
          select: { id: true },
        }),
        prisma.parlamentar.findUnique({
          where: { id: payload.relatorId },
          select: { id: true },
        }),
      ])

      if (!proposicao) {
        throw new NotFoundError(`Proposicao ${payload.proposicaoId}`)
      }
      if (!comissao) {
        throw new NotFoundError(`Comissao ${payload.comissaoId}`)
      }
      if (!relator) {
        throw new NotFoundError(`Relator ${payload.relatorId}`)
      }

      // Valida reuniao se fornecida
      if (payload.reuniaoId) {
        const reuniao = await prisma.reuniaoComissao.findUnique({
          where: { id: payload.reuniaoId },
          select: { id: true, comissaoId: true },
        })
        if (!reuniao) {
          throw new NotFoundError(`Reuniao ${payload.reuniaoId}`)
        }
        if (reuniao.comissaoId !== payload.comissaoId) {
          throw new ValidationError(
            'A reuniao informada nao pertence a comissao informada',
          )
        }
      }

      // Find-or-create por (proposicaoId, comissaoId) — eh o unique
      const found = await prisma.parecer.findUnique({
        where: {
          proposicaoId_comissaoId: {
            proposicaoId: payload.proposicaoId,
            comissaoId: payload.comissaoId,
          },
        },
        select: { id: true },
      })

      if (found) {
        parecerAlvoId = found.id
      } else {
        const novo = await prisma.parecer.create({
          data: {
            proposicaoId: payload.proposicaoId,
            comissaoId: payload.comissaoId,
            relatorId: payload.relatorId,
            reuniaoId: payload.reuniaoId ?? null,
            tipo: payload.tipo,
            status: 'EMITIDO',
            numero: payload.numero ?? null,
            ano: payload.ano ?? dataEmissao.getUTCFullYear(),
            fundamentacao: payload.fundamentacao,
            ementa: payload.ementa ?? null,
            conclusao: payload.conclusao ?? null,
            dataDistribuicao: payload.dataDistribuicao
              ? new Date(payload.dataDistribuicao)
              : dataEmissao,
            dataElaboracao: dataEmissao,
            dataEmissao,
            observacoes: payload.observacoes ?? null,
          },
          select: { id: true },
        })
        parecerAlvoId = novo.id
        parecerCriado = true
      }
    }

    // Atualiza arquivo + datas + status
    const atualizado = await prisma.parecer.update({
      where: { id: parecerAlvoId },
      data: {
        arquivoUrl: payload.arquivoUrl,
        ...(payload.arquivoNome ? { arquivoNome: payload.arquivoNome } : {}),
        ...(payload.arquivoTamanho !== undefined ? { arquivoTamanho: payload.arquivoTamanho } : {}),
        dataEmissao,
        status: 'EMITIDO',
        ...(payload.observacoes ? { observacoes: payload.observacoes } : {}),
      },
      select: {
        id: true,
        proposicaoId: true,
        comissaoId: true,
        relatorId: true,
        tipo: true,
        status: true,
        numero: true,
        ano: true,
        arquivoUrl: true,
        dataEmissao: true,
      },
    })

    await logAudit({
      request,
      session,
      action: 'PARECER_PUBLICACAO',
      entity: 'Parecer',
      entityId: atualizado.id,
      metadata: {
        parecerCriado,
        proposicaoId: atualizado.proposicaoId,
        comissaoId: atualizado.comissaoId,
        relatorId: atualizado.relatorId,
        tipo: atualizado.tipo,
        ano: atualizado.ano,
        dataEmissao: dataEmissao.toISOString(),
      },
    })

    return createSuccessResponse(
      { ...atualizado, parecerCriado },
      parecerCriado
        ? 'Parecer criado e publicado com sucesso'
        : 'Parecer publicado com sucesso',
      undefined,
      201,
    )
  }),
  { permissions: 'comissao.manage' },
)
