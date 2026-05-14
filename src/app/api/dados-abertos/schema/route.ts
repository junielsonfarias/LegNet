import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'
import { RESOURCE_SCHEMAS } from '@/lib/services/dados-abertos-schemas'


/**
 * GET /api/dados-abertos/schema
 * Indice do dicionario de dados (Fase 4 / M8). Lista os recursos disponiveis
 * com link para o JSONSchema individual.
 */
export const GET = withErrorHandler(async () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const recursos = Object.values(RESOURCE_SCHEMAS).map((rs) => ({
    recurso: rs.recurso,
    titulo: rs.titulo,
    descricao: rs.descricao,
    endpoint: rs.endpoint,
    schema: `${baseUrl}/api/dados-abertos/schema/${rs.recurso}`,
    periodicidade: rs.periodicidade,
    fonteLegal: rs.fonteLegal
  }))

  return withPublicCache(
    NextResponse.json({
      titulo: 'Dicionario de Dados Abertos',
      descricao:
        'Documentacao dos campos e tipos retornados por cada endpoint /api/dados-abertos/*. ' +
        'Conformidade com PNTP (transparencia ativa) e Lei de Acesso a Informacao (12.527/2011).',
      total: recursos.length,
      recursos
    }),
    { maxAge: 300, swr: 600 }
  )
})
