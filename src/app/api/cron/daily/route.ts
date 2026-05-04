/**
 * Cron diário de prazos legais (sanção tácita + notificações).
 *
 * Invocação:
 * - Vercel Cron: agendado em vercel.json. Vercel injeta automaticamente um
 *   header `authorization: Bearer $CRON_SECRET` quando `CRON_SECRET` está
 *   configurado como variável de ambiente.
 * - VPS: chamado por scripts/cron-daily.sh via curl com o mesmo header.
 *
 * Segurança: endpoint rejeita qualquer request sem o header válido.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  processarSancaoTacita,
  gerarNotificacoesPrazo,
  verificarPautasAtrasadas,
  verificarAtasAtrasadas,
  verificarContratosAtrasados,
  verificarPrazosESIC,
  verificarTokensIntegracaoVencendo
} from '@/lib/jobs/prazos-legais'
import { createLogger } from '@/lib/logging/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const logger = createLogger('api/cron/daily')

function autorizar(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    logger.error('CRON_SECRET não configurado — cron bloqueado por segurança')
    return false
  }
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  return token === secret
}

async function handler(request: NextRequest) {
  if (!autorizar(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const inicio = Date.now()
  const resultado: Record<string, unknown> = {
    executadoEm: new Date().toISOString(),
    jobs: {}
  }

  try {
    const sancao = await processarSancaoTacita()
    ;(resultado.jobs as Record<string, unknown>).sancaoTacita = sancao
  } catch (error) {
    logger.error('Erro em processarSancaoTacita', error)
    ;(resultado.jobs as Record<string, unknown>).sancaoTacita = {
      erro: error instanceof Error ? error.message : 'erro desconhecido'
    }
  }

  try {
    const notificacoes = await gerarNotificacoesPrazo()
    ;(resultado.jobs as Record<string, unknown>).notificacoesPrazo = notificacoes
  } catch (error) {
    logger.error('Erro em gerarNotificacoesPrazo', error)
    ;(resultado.jobs as Record<string, unknown>).notificacoesPrazo = {
      erro: error instanceof Error ? error.message : 'erro desconhecido'
    }
  }

  const verificacoesPNTP: Array<[string, () => Promise<unknown>]> = [
    ['pautasAtrasadas', verificarPautasAtrasadas],
    ['atasAtrasadas', verificarAtasAtrasadas],
    ['contratosAtrasados', verificarContratosAtrasados],
    ['prazosESIC', verificarPrazosESIC],
    ['tokensIntegracaoVencendo', verificarTokensIntegracaoVencendo]
  ]

  for (const [nome, fn] of verificacoesPNTP) {
    try {
      const saida = await fn()
      ;(resultado.jobs as Record<string, unknown>)[nome] = saida
    } catch (error) {
      logger.error(`Erro em ${nome}`, error)
      ;(resultado.jobs as Record<string, unknown>)[nome] = {
        erro: error instanceof Error ? error.message : 'erro desconhecido'
      }
    }
  }

  resultado.duracaoMs = Date.now() - inicio
  logger.info('Cron diário executado', resultado)
  return NextResponse.json(resultado)
}

export const GET = handler
export const POST = handler
