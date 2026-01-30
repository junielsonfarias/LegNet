import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/permissions'
import { getSessaoHandler, updateSessaoHandler, deleteSessaoHandler } from './_handlers'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

/**
 * GET /api/sessoes/[id]
 * Busca sessão por ID ou slug
 */
export const GET = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }, _session) => {
    return getSessaoHandler(request, params)
  },
  { permissions: 'sessao.view' }
)

/**
 * PUT /api/sessoes/[id]
 * Atualiza sessão existente
 */
export const PUT = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }, session) => {
    return updateSessaoHandler(request, params, session)
  },
  { permissions: 'sessao.manage' }
)

/**
 * DELETE /api/sessoes/[id]
 * Exclui sessão
 */
export const DELETE = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }, session) => {
    return deleteSessaoHandler(request, params, session)
  },
  { permissions: 'sessao.manage' }
)
