import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { dashboardService } from '@/lib/services/dashboard-service'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// GET - Buscar próximos eventos
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

  const eventos = await dashboardService.getEventos(limit)

  return createSuccessResponse(eventos, 'Eventos carregados com sucesso')
}, { permissions: 'dashboard.view' })
