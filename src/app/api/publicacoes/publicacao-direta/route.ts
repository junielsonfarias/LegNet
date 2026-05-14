/**
 * RN-169 — Endpoint de Publicacao Direta de Documentos Administrativos.
 *
 * Reaproveita o modelo `Publicacao` como hub universal de documentos
 * (portarias, atos da Mesa/Presidencia, oficios, editais, erratas,
 * convocacoes, comunicados, agendas, atas e pautas avulsas).
 *
 * Diferentemente do POST /api/publicacoes (CRUD generico do admin), este
 * endpoint:
 *  - Aceita apenas tipos administrativos (lista controlada via Zod).
 *  - Publica por padrao (`publicada: true`).
 *  - Aceita multiplos documentos via campo `documentos JSONB`.
 *  - Conteudo eh opcional (pode ser apenas titulo + ementa + PDFs).
 *
 * Permissoes: `publicacao.manage` (mesma do POST atual).
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { withAuth } from '@/lib/auth/permissions'
import {
  withErrorHandler,
  createSuccessResponse,
} from '@/lib/error-handler'
import { publicacoesService } from '@/lib/publicacoes-service'
import { logAudit } from '@/lib/audit'

// Tipos administrativos suportados pela Publicacao Direta (RN-169).
// Lista controlada (subset do enum TipoPublicacao) para evitar mistura
// com NoticiaInformativo/Manual/etc, que tem fluxos proprios.
const TIPOS_ADMINISTRATIVOS = [
  'PORTARIA',
  'DECRETO',
  'RESOLUCAO',
  'ATA_SESSAO',
  'PAUTA_SESSAO',
  'ATO_MESA',
  'ATO_PRESIDENCIA',
  'OFICIO',
  'EDITAL',
  'ERRATA',
  'CONVOCACAO',
  'COMUNICADO',
  'AGENDA',
  'RELATORIO',
  'PLANEJAMENTO',
  'OUTRO',
] as const

const DocumentoSchema = z.object({
  nome: z.string().min(1).max(255),
  url: z.string().url(),
})

const PublicacaoDiretaSchema = z.object({
  tipo: z.enum(TIPOS_ADMINISTRATIVOS),
  titulo: z.string().min(3).max(500),
  numero: z.string().max(50).nullish().transform((v) => v ?? null),
  ano: z.number().int().min(1900).max(2100).optional(),
  data: z.string().min(1),  // ISO date
  ementa: z.string().max(5000).nullish().transform((v) => v ?? null),
  conteudo: z.string().max(50000).nullish().transform((v) => v ?? null),
  url: z.string().url().nullish().transform((v) => v ?? null),
  documentos: z.array(DocumentoSchema).max(20).optional(),
  autorNome: z.string().max(200).nullish().transform((v) => v ?? null),
  categoriaId: z.string().nullish().transform((v) => v ?? null),
})

export const POST = withAuth(
  withErrorHandler(async (request: NextRequest, _context, session: Session) => {
    const body = await request.json()
    const data = PublicacaoDiretaSchema.parse(body)

    const userName = (session.user as { name?: string; email?: string })?.name
      || (session.user as { email?: string })?.email
      || 'Administrador'

    const publicacao = await publicacoesService.create({
      titulo: data.titulo,
      descricao: data.ementa ?? null,
      tipo: data.tipo,
      numero: data.numero,
      ano: data.ano ?? new Date(data.data).getFullYear(),
      data: data.data,
      conteudo: data.conteudo ?? '',
      url: data.url,
      documentos: data.documentos ?? null,
      publicada: true,  // RN-169: publicacao direta ja publica
      categoriaId: data.categoriaId,
      autorTipo: 'ORGAO',
      autorNome: data.autorNome ?? userName,
    })

    await logAudit({
      request,
      session,
      action: 'PUBLICACAO_DIRETA_CREATE',
      entity: 'Publicacao',
      entityId: publicacao.id,
      metadata: {
        tipo: data.tipo,
        numero: data.numero,
        ano: publicacao.ano,
        documentos: data.documentos?.length ?? 0,
      },
    })

    return createSuccessResponse(
      publicacao,
      'Documento publicado com sucesso',
      undefined,
      201,
    )
  }),
  { permissions: 'publicacao.manage' },
)

export const TIPOS_ADMINISTRATIVOS_VALORES = TIPOS_ADMINISTRATIVOS
