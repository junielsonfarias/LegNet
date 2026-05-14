/**
 * API publica - Normas Juridicas (lista)
 * Cumpre PNTP Diamante: Lei Organica, Regimento Interno, Codigo de Etica,
 * leis, decretos, resolucoes. Dados em formato aberto (JSON).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'


const TIPOS_VALIDOS = [
  'LEI_ORDINARIA',
  'LEI_COMPLEMENTAR',
  'DECRETO_LEGISLATIVO',
  'RESOLUCAO',
  'EMENDA_LEI_ORGANICA',
  'LEI_ORGANICA',
  'REGIMENTO_INTERNO',
  'CODIGO_ETICA'
] as const

type TipoNormaLiteral = (typeof TIPOS_VALIDOS)[number]

export const GET = withErrorHandler(async (request: NextRequest) => {
  enforceRateLimit(request, 'PUBLIC')

  const { searchParams } = new URL(request.url)
  const tipoParam = searchParams.get('tipo')?.toUpperCase()
  const anoParam = searchParams.get('ano')
  const situacao = searchParams.get('situacao') || undefined
  const busca = searchParams.get('busca') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const tipo = tipoParam && TIPOS_VALIDOS.includes(tipoParam as TipoNormaLiteral)
    ? (tipoParam as TipoNormaLiteral)
    : undefined

  const ano = anoParam ? parseInt(anoParam, 10) : undefined

  const where = {
    ...(tipo && { tipo }),
    ...(ano && { ano }),
    ...(situacao && { situacao: situacao as 'VIGENTE' | 'REVOGADA' | 'REVOGADA_PARCIALMENTE' | 'COM_ALTERACOES' | 'SUSPENSA' }),
    ...(busca && {
      OR: [
        { ementa: { contains: busca, mode: 'insensitive' as const } },
        { assunto: { contains: busca, mode: 'insensitive' as const } },
        { indexacao: { contains: busca, mode: 'insensitive' as const } }
      ]
    })
  }

  const [normas, total] = await Promise.all([
    prisma.normaJuridica.findMany({
      where,
      select: {
        id: true,
        tipo: true,
        numero: true,
        ano: true,
        data: true,
        dataPublicacao: true,
        dataVigencia: true,
        ementa: true,
        situacao: true,
        orgaoEmissor: true,
        aplicavelA: true,
        diarioOficial: true,
        assunto: true
      },
      orderBy: [{ ano: 'desc' }, { numero: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.normaJuridica.count({ where })
  ])

  const dados = normas.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    numero: n.numero,
    ano: n.ano,
    referencia: `${n.tipo} ${n.numero}/${n.ano}`,
    data_aprovacao: n.data.toISOString().split('T')[0],
    data_publicacao: n.dataPublicacao?.toISOString().split('T')[0] || null,
    data_vigencia: n.dataVigencia?.toISOString().split('T')[0] || null,
    ementa: n.ementa,
    situacao: n.situacao,
    orgao_emissor: n.orgaoEmissor,
    aplicavel_a: n.aplicavelA,
    diario_oficial: n.diarioOficial,
    assunto: n.assunto
  }))

  return withPublicCache(
    NextResponse.json({
      dados,
      metadados: {
        total,
        pagina: page,
        limite: limit,
        paginas: Math.ceil(total / limit),
        atualizacao: new Date().toISOString(),
        licenca: 'CC-BY 4.0'
      }
    }),
    { maxAge: 300, swr: 900 }
  )
})
