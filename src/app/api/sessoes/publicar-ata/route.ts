/**
 * RN-170 — Publicacao de Ata da Sessao
 *
 * Permite publicar a ata de uma sessao realizada. Suporta dois modos:
 *
 *  1. **Sessao existente**: admin fornece `sessaoId` e o endpoint atualiza
 *     os campos de ata desse registro.
 *
 *  2. **Find-or-create**: admin fornece `numero`, `tipo` e `data`. O endpoint
 *     procura uma Sessao com esses dados (mesmo ano). Se nao encontrar,
 *     cria uma nova Sessao automaticamente (finalizada=true, status=CONCLUIDA)
 *     usando `sessaoDbService.create`, que ja resolve legislatura/periodo.
 *
 * Em ambos os modos, atualiza os campos:
 *  - `arquivoAtaAssinada` (URL do PDF)
 *  - `dataPublicacaoAta` (default: hoje)
 *  - `statusAta='APROVADA'`
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

const PublicarAtaSchema = z
  .object({
    sessaoId: z.string().nullish().transform((v) => v ?? undefined),

    // Find-or-create (usados quando sessaoId ausente)
    numero: z.number().int().positive().nullish().transform((v) => v ?? undefined),
    tipo: TipoSessaoSchema.nullish().transform((v) => v ?? undefined),
    data: z.string().nullish().transform((v) => v ?? undefined),
    horario: z.string().nullish().transform((v) => v ?? undefined),
    local: z.string().nullish().transform((v) => v ?? undefined),

    // Dados da ata
    arquivoAtaUrl: z.string().url('URL do arquivo da ata deve ser valida'),
    dataPublicacaoAta: z.string().nullish().transform((v) => v ?? undefined),
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
        'Apenas ADMIN ou SECRETARIA podem publicar atas',
      )
    }

    const body = await request.json()
    const payload = PublicarAtaSchema.parse(body)

    const dataPublicacao = payload.dataPublicacaoAta
      ? new Date(payload.dataPublicacaoAta)
      : new Date()

    let sessaoAlvoId: string
    let sessaoCriada = false

    if (payload.sessaoId) {
      // Modo 1: sessao existente
      const existing = await prisma.sessao.findUnique({
        where: { id: payload.sessaoId },
        select: { id: true },
      })
      if (!existing) {
        throw new NotFoundError(`Sessao ${payload.sessaoId}`)
      }
      sessaoAlvoId = existing.id
    } else {
      // Modo 2: find-or-create por numero + tipo + ano da data
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
        // Cria nova sessao retroativa (finalizada=true). O service resolve
        // legislatura/periodo automaticamente baseado na data e gera pauta
        // basica + ata placeholder.
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

    // Atualiza os campos da ata
    const atualizada = await prisma.sessao.update({
      where: { id: sessaoAlvoId },
      data: {
        arquivoAtaAssinada: payload.arquivoAtaUrl,
        dataPublicacaoAta: dataPublicacao,
        statusAta: 'APROVADA',
        // Se foi criada agora, marca tambem o campo legado arquivoAta para
        // consistencia com leituras antigas.
        arquivoAta: payload.arquivoAtaUrl,
      },
      select: {
        id: true,
        numero: true,
        tipo: true,
        data: true,
        arquivoAtaAssinada: true,
        dataPublicacaoAta: true,
        statusAta: true,
      },
    })

    await logAudit({
      request,
      session,
      action: 'SESSAO_ATA_PUBLICACAO',
      entity: 'Sessao',
      entityId: atualizada.id,
      metadata: {
        sessaoCriada,
        numero: atualizada.numero,
        tipo: atualizada.tipo,
        dataPublicacaoAta: dataPublicacao.toISOString(),
        observacoes: payload.observacoes ?? null,
      },
    })

    return createSuccessResponse(
      { ...atualizada, sessaoCriada },
      sessaoCriada
        ? 'Sessao criada e ata publicada com sucesso'
        : 'Ata publicada com sucesso',
      undefined,
      201,
    )
  }),
  { permissions: 'sessao.manage' },
)
