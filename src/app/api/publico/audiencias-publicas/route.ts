/**
 * API Publica de Audiencias Publicas
 * GET: Lista audiencias publicas
 *
 * TODO: Criar modelo AudienciaPublica no Prisma e migrar dados.
 * Atualmente retorna dados vazios ate que o modelo seja implementado.
 * O admin (/admin/audiencias-publicas) tambem usa mock e precisa ser migrado.
 */

import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Retornar estrutura vazia ate que o modelo Prisma seja criado
  return createSuccessResponse({
    audiencias: [],
    total: 0,
    stats: {
      total: 0,
      agendadas: 0,
      realizadas: 0,
      canceladas: 0
    }
  })
}
