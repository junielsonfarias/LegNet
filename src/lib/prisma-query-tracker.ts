/**
 * Detector de N+1 queries para Prisma.
 *
 * Ativação: `PRISMA_QUERY_TRACKING=true` em .env (apenas dev/staging).
 * Em produção, o tracker não se liga para evitar overhead.
 *
 * Como funciona:
 * - Hook no middleware do Prisma (`$use`) que incrementa contador por modelo+operação
 * - A cada janela de 500ms, se o mesmo `model.operation` ocorreu > threshold,
 *   um warning é logado via logger estruturado com o stack das chamadas.
 * - A janela é curta para flagar loops, mas longa o suficiente para agrupar
 *   chamadas originadas da mesma request.
 *
 * Como usar:
 *   import { attachQueryTracker } from '@/lib/prisma-query-tracker'
 *   attachQueryTracker(prisma)
 *
 * O tracker é idempotente — chamar 2x não duplica middleware.
 */

import type { PrismaClient } from '@prisma/client'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('prisma-n+1')

const DEFAULT_THRESHOLD = 10 // mais que 10 da mesma query em 500ms = provável N+1
const WINDOW_MS = 500

interface QueryCounter {
  key: string
  count: number
  firstSeenAt: number
  stackSamples: string[]
}

const counters = new Map<string, QueryCounter>()
let flushTimer: NodeJS.Timeout | null = null
let attached = false

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(flush, WINDOW_MS)
}

function flush() {
  flushTimer = null
  const threshold = Number(process.env.PRISMA_QUERY_N1_THRESHOLD || DEFAULT_THRESHOLD)
  counters.forEach((counter) => {
    if (counter.count >= threshold) {
      logger.warn(
        `Possível N+1: ${counter.key} executada ${counter.count}x em ${WINDOW_MS}ms`,
        {
          key: counter.key,
          count: counter.count,
          durationMs: WINDOW_MS,
          stackSample: counter.stackSamples[0]
        }
      )
    }
  })
  counters.clear()
}

function captureCallerStack(): string {
  // Pega frames relevantes (pula node_modules do Prisma)
  const err = new Error()
  const lines = (err.stack || '').split('\n').slice(3) // skip Error + este arquivo
  const appFrames = lines
    .filter((line) => line.includes('/src/') && !line.includes('prisma-query-tracker'))
    .slice(0, 3)
    .map((l) => l.trim())
  return appFrames.join(' → ') || '(sem frames de app)'
}

/**
 * Anexa o middleware de tracking ao PrismaClient.
 * Idempotente e no-op quando `PRISMA_QUERY_TRACKING !== 'true'`.
 */
export function attachQueryTracker(client: PrismaClient): void {
  if (attached) return
  if (process.env.PRISMA_QUERY_TRACKING !== 'true') return
  attached = true

  client.$use(async (params, next) => {
    const key = `${params.model ?? 'raw'}.${params.action}`
    const existing = counters.get(key)
    if (existing) {
      existing.count++
      if (existing.stackSamples.length < 3) {
        existing.stackSamples.push(captureCallerStack())
      }
    } else {
      counters.set(key, {
        key,
        count: 1,
        firstSeenAt: Date.now(),
        stackSamples: [captureCallerStack()]
      })
    }
    scheduleFlush()
    return next(params)
  })

  logger.info('Prisma N+1 tracker ativado', {
    threshold: Number(process.env.PRISMA_QUERY_N1_THRESHOLD || DEFAULT_THRESHOLD),
    windowMs: WINDOW_MS
  })
}
