import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export interface ResultadoBusca {
  tipo: 'proposicao' | 'norma' | 'publicacao' | 'parlamentar' | 'documento' | 'noticia'
  id: string
  titulo: string
  resumo: string | null
  href: string
  data?: Date | null
  metadata?: Record<string, string | number | null>
}

/**
 * GET /api/busca/global?q=...
 *
 * Busca textual unica em multiplos modelos publicos. Atende ao criterio 1.4
 * da Matriz PNTP 2026 ("Ferramenta de pesquisa de conteudo").
 *
 * Estrategia: usa `contains` com `mode: insensitive` em campos textuais
 * relevantes de cada modelo. Para portais com > 100k registros, considerar
 * migrar para Postgres tsvector + indice GIN (deferido para futura
 * otimizacao caso necessario).
 *
 * Rate limit: PUBLIC bucket.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  enforceRateLimit(request, 'PUBLIC')

  const { searchParams } = new URL(request.url)
  const params = QuerySchema.parse(Object.fromEntries(searchParams))
  const q = params.q.trim()
  const limit = params.limit

  const insensitive = 'insensitive' as const

  const [proposicoes, normas, publicacoes, parlamentares, documentos, noticias] =
    await Promise.all([
      prisma.proposicao
        .findMany({
          where: {
            OR: [
              { ementa: { contains: q, mode: insensitive } },
              { texto: { contains: q, mode: insensitive } },
              { numero: { contains: q, mode: insensitive } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            numero: true,
            ano: true,
            tipo: true,
            ementa: true,
            createdAt: true,
            status: true,
          },
        })
        .catch(() => []),
      prisma.normaJuridica
        .findMany({
          where: {
            OR: [
              { ementa: { contains: q, mode: insensitive } },
              { texto: { contains: q, mode: insensitive } },
            ],
          },
          orderBy: { dataPublicacao: 'desc' },
          take: limit,
          select: {
            id: true,
            tipo: true,
            numero: true,
            ano: true,
            ementa: true,
            dataPublicacao: true,
          },
        })
        .catch(() => []),
      prisma.publicacao
        .findMany({
          where: {
            publicada: true,
            OR: [
              { titulo: { contains: q, mode: insensitive } },
              { conteudo: { contains: q, mode: insensitive } },
              { descricao: { contains: q, mode: insensitive } },
            ],
          },
          orderBy: { data: 'desc' },
          take: limit,
          select: {
            id: true,
            tipo: true,
            titulo: true,
            descricao: true,
            data: true,
          },
        })
        .catch(() => []),
      prisma.parlamentar
        .findMany({
          where: {
            ativo: true,
            OR: [
              { nome: { contains: q, mode: insensitive } },
              { apelido: { contains: q, mode: insensitive } },
              { biografia: { contains: q, mode: insensitive } },
              { partido: { contains: q, mode: insensitive } },
            ],
          },
          take: limit,
          select: {
            id: true,
            nome: true,
            apelido: true,
            partido: true,
            biografia: true,
          },
        })
        .catch(() => []),
      prisma.documentoTransparencia
        .findMany({
          where: {
            status: 'publicado',
            OR: [
              { titulo: { contains: q, mode: insensitive } },
              { descricao: { contains: q, mode: insensitive } },
            ],
          },
          orderBy: { dataPublicacao: 'desc' },
          take: limit,
          select: {
            id: true,
            tipo: true,
            titulo: true,
            descricao: true,
            ano: true,
            dataPublicacao: true,
          },
        })
        .catch(() => []),
      prisma.noticia
        .findMany({
          where: {
            publicada: true,
            OR: [
              { titulo: { contains: q, mode: insensitive } },
              { resumo: { contains: q, mode: insensitive } },
              { conteudo: { contains: q, mode: insensitive } },
            ],
          },
          orderBy: { dataPublicacao: 'desc' },
          take: limit,
          select: {
            id: true,
            titulo: true,
            resumo: true,
            dataPublicacao: true,
          },
        })
        .catch(() => []),
    ])

  const resultados: ResultadoBusca[] = []

  for (const p of proposicoes) {
    resultados.push({
      tipo: 'proposicao',
      id: p.id,
      titulo: `${p.tipo} ${p.numero}/${p.ano}`,
      resumo: p.ementa,
      href: `/legislativo/proposicoes/${p.id}`,
      data: p.createdAt,
      metadata: { status: p.status },
    })
  }

  for (const n of normas) {
    resultados.push({
      tipo: 'norma',
      id: n.id,
      titulo: `${n.tipo} ${n.numero}/${n.ano}`,
      resumo: n.ementa,
      href: `/legislativo/normas/${n.id}`,
      data: n.dataPublicacao,
      metadata: { tipo: n.tipo },
    })
  }

  for (const pub of publicacoes) {
    resultados.push({
      tipo: 'publicacao',
      id: pub.id,
      titulo: pub.titulo,
      resumo: pub.descricao,
      href: `/transparencia/publicacoes`,
      data: pub.data,
      metadata: { tipo: pub.tipo },
    })
  }

  for (const pa of parlamentares) {
    resultados.push({
      tipo: 'parlamentar',
      id: pa.id,
      titulo: pa.apelido || pa.nome,
      resumo: pa.biografia,
      href: `/parlamentares`,
      metadata: { partido: pa.partido || '' },
    })
  }

  for (const d of documentos) {
    resultados.push({
      tipo: 'documento',
      id: d.id,
      titulo: d.titulo,
      resumo: d.descricao,
      href: `/transparencia/documentos/${String(d.tipo).toLowerCase().replace(/_/g, '-')}`,
      data: d.dataPublicacao,
      metadata: { ano: d.ano },
    })
  }

  for (const no of noticias) {
    resultados.push({
      tipo: 'noticia',
      id: no.id,
      titulo: no.titulo,
      resumo: no.resumo,
      href: `/noticias/${no.id}`,
      data: no.dataPublicacao,
    })
  }

  // Ordena por data (mais recente primeiro). Itens sem data ficam por ultimo.
  resultados.sort((a, b) => {
    if (!a.data && !b.data) return 0
    if (!a.data) return 1
    if (!b.data) return -1
    return new Date(b.data).getTime() - new Date(a.data).getTime()
  })

  return createSuccessResponse(
    {
      query: q,
      total: resultados.length,
      por_tipo: {
        proposicao: proposicoes.length,
        norma: normas.length,
        publicacao: publicacoes.length,
        parlamentar: parlamentares.length,
        documento: documentos.length,
        noticia: noticias.length,
      },
      resultados,
    },
    `${resultados.length} resultado(s) para "${q}"`,
  )
})
