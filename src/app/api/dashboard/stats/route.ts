import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { dashboardService } from '@/lib/services/dashboard-service'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// GET - Buscar estatísticas do dashboard
export const GET = withAuth(async (request: NextRequest, _ctx, session) => {
  const userRole = session?.user?.role || 'USER'
  const userId = session?.user?.id

  const stats = await dashboardService.getStats(userRole, userId)

  return createSuccessResponse(stats, 'Estatísticas carregadas com sucesso')
}, { permissions: 'dashboard.view' })
