/**
 * API: Executar Automação
 * POST - Executar agendamentos pendentes
 * GET - Verificar próximos agendamentos
 * SEGURANÇA: Todas as operações requerem permissão automacao.manage ou automacao.view
 */

import { NextRequest } from 'next/server'
import { automacaoService } from '@/lib/automacao-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * POST - Executar agendamentos
 * SEGURANÇA: Requer permissão automacao.manage
 */
export const POST = withAuth(async (request: NextRequest) => {
  // Executar todos os agendamentos pendentes
  automacaoService.executarAgendamentos()

  return createSuccessResponse({
    executed: true,
    timestamp: new Date().toISOString()
  }, 'Agendamentos executados com sucesso')
}, { permissions: 'automacao.manage' })

/**
 * GET - Verificar próximos agendamentos
 * SEGURANÇA: Requer permissão automacao.view
 */
export const GET = withAuth(async (request: NextRequest) => {
  const agendamentos = automacaoService.getAllAgendamentosPauta()
  const agora = new Date()

  const proximos = agendamentos
    .filter(a => a.proximaExecucao > agora)
    .sort((a, b) => a.proximaExecucao.getTime() - b.proximaExecucao.getTime())

  const pendentes = agendamentos
    .filter(a => a.proximaExecucao <= agora)
    .sort((a, b) => a.proximaExecucao.getTime() - b.proximaExecucao.getTime())

  return createSuccessResponse({
    proximos,
    pendentes,
    total: agendamentos.length
  }, 'Agendamentos listados')
}, { permissions: 'automacao.view' })
