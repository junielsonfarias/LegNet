import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { dashboardService } from '@/lib/services/dashboard-service'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// GET - Buscar atividades recentes
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

  const atividades = await dashboardService.getAtividades(limit)

  return createSuccessResponse(atividades, 'Atividades carregadas com sucesso')
}, { permissions: 'dashboard.view' })
