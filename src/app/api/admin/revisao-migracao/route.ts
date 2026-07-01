/**
 * Central de Revisão da Migração — API.
 *
 * GET  ?categoria=sem-autor|sem-resultado|votacao-nominal|nao-identificados
 *      lista os registros incompletos daquela categoria (paginado).
 * PATCH salva a revisão manual: preenche os CAMPOS REAIS (autorId/resultado) e
 *      a observação do revisor (revisaoObservacao), marcando revisadoEm.
 *
 * Objetivo: nada se perde — o que a migração automática não identificou é
 * completado manualmente e passa a refletir no portal público imediatamente.
 */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PROP_SELECT = {
  id: true, tipo: true, numero: true, ano: true, titulo: true, ementa: true,
  autorId: true, resultado: true, sessaoId: true, sessaoVotacaoId: true,
  documentos: true, texto: true, revisaoObservacao: true, revisadoEm: true,
} as const

async function listarCategoria(categoria: string, page: number, limit: number, q: string) {
  const skip = (page - 1) * limit
  const busca = q ? { OR: [{ titulo: { contains: q, mode: 'insensitive' as const } }, { ementa: { contains: q, mode: 'insensitive' as const } }] } : {}

  if (categoria === 'sem-autor') {
    const where = { deletedAt: null, autorId: null, autorEntidadeId: null, ...busca }
    const [items, total] = await Promise.all([
      prisma.proposicao.findMany({ where, select: PROP_SELECT, orderBy: [{ ano: 'desc' }, { numero: 'asc' }], skip, take: limit }),
      prisma.proposicao.count({ where }),
    ])
    return { items, total }
  }
  if (categoria === 'sem-resultado') {
    // AND para não deixar a busca (que usa OR) sobrescrever o filtro "tem sessão".
    const where = {
      deletedAt: null, resultado: null,
      AND: [{ OR: [{ sessaoId: { not: null } }, { sessaoVotacaoId: { not: null } }] }, ...(q ? [busca] : [])],
    }
    const [items, total] = await Promise.all([
      prisma.proposicao.findMany({ where, select: PROP_SELECT, orderBy: [{ ano: 'desc' }, { numero: 'asc' }], skip, take: limit }),
      prisma.proposicao.count({ where }),
    ])
    return { items, total }
  }
  if (categoria === 'votacao-nominal') {
    // Matérias cujo documento de apuração/lista tem voto manuscrito (sem Votacao ainda).
    const docs = await prisma.publicacao.findMany({
      where: { titulo: { contains: 'Votaç', mode: 'insensitive' }, conteudo: { contains: 'APURAÇÃO' } },
      select: { id: true, titulo: true, conteudo: true, arquivo: true },
    })
    const items: unknown[] = []
    for (const d of docs) {
      const ocr = (d.conteudo || '').split('<!--ocr-->')[1] || ''
      const m = ocr.match(/projeto de lei\s*n?[ºo°.]*\s*0*(\d{1,4})\s*[\/\-]\s*((?:19|20)\d{2})/i)
      if (!m) continue
      const numero = String(parseInt(m[1], 10)).padStart(3, '0')
      const prop = await prisma.proposicao.findFirst({ where: { tipo: 'PROJETO_LEI', ano: parseInt(m[2], 10), numero: { in: [numero, String(parseInt(m[1], 10))] } }, select: { id: true, numero: true, ano: true, titulo: true, _count: { select: { votacoes: true } } } })
      if (!prop) continue
      items.push({ documentoId: d.id, documentoTitulo: d.titulo, arquivo: d.arquivo, proposicao: prop, votosRegistrados: prop._count.votacoes })
    }
    return { items: items.slice(skip, skip + limit), total: items.length }
  }
  // nao-identificados: publicações sem categoria clara / link externo / com observação
  const where = {
    OR: [
      { categoriaId: null as string | null },
      { arquivo: null, conteudo: { contains: 'drive.google' } },
      { revisaoObservacao: { not: null } },
    ],
    ...(q ? { AND: [{ titulo: { contains: q, mode: 'insensitive' as const } }] } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.publicacao.findMany({ where, select: { id: true, tipo: true, titulo: true, arquivo: true, revisaoObservacao: true, revisadoEm: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.publicacao.count({ where }),
  ])
  return { items, total }
}

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria') || 'sem-autor'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10))
  const q = searchParams.get('q') || ''

  // Contadores por categoria (para os badges das abas)
  const [semAutor, semResultado, naoIdent] = await Promise.all([
    prisma.proposicao.count({ where: { deletedAt: null, autorId: null, autorEntidadeId: null } }),
    prisma.proposicao.count({ where: { deletedAt: null, resultado: null, OR: [{ sessaoId: { not: null } }, { sessaoVotacaoId: { not: null } }] } }),
    prisma.publicacao.count({ where: { OR: [{ categoriaId: null }, { arquivo: null, conteudo: { contains: 'drive.google' } }] } }),
  ])

  const { items, total } = await listarCategoria(categoria, page, limit, q)
  return createSuccessResponse({ items, total, page, limit, contadores: { 'sem-autor': semAutor, 'sem-resultado': semResultado, 'nao-identificados': naoIdent } })
}, { permissions: 'tramitacao.view' })

const patchSchema = z.object({
  tipo: z.enum(['proposicao', 'publicacao']),
  id: z.string().min(1),
  autorId: z.string().nullish(),
  resultado: z.enum(['APROVADA', 'REJEITADA', 'EMPATE']).nullish(),
  revisaoObservacao: z.string().nullish(),
})

export const PATCH = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) throw new ValidationError('Dados inválidos', parsed.error.flatten())
  const { tipo, id, autorId, resultado, revisaoObservacao } = parsed.data

  if (tipo === 'proposicao') {
    const data: Record<string, unknown> = { revisadoEm: new Date() }
    if (autorId !== undefined) data.autorId = autorId || null
    if (resultado !== undefined) data.resultado = resultado || null
    if (revisaoObservacao !== undefined) data.revisaoObservacao = revisaoObservacao || null
    const p = await prisma.proposicao.update({ where: { id }, data, select: PROP_SELECT })
    return createSuccessResponse(p, 'Revisão salva')
  }
  const pub = await prisma.publicacao.update({
    where: { id },
    data: { revisaoObservacao: revisaoObservacao || null, revisadoEm: new Date() },
    select: { id: true, titulo: true, revisaoObservacao: true, revisadoEm: true },
  })
  return createSuccessResponse(pub, 'Revisão salva')
}, { permissions: 'tramitacao.manage' })
