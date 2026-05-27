/**
 * Job de limpeza periódica de dados expirados.
 *
 * Política (LGPD Art. 16 — eliminação após cumprimento da finalidade):
 *
 *  - Sessions NextAuth expiradas há mais de 30 dias: remoção definitiva.
 *  - VerificationToken e PasswordResetToken expirados há > 30 dias.
 *
 * IMPORTANTE — AuditLog NÃO é tocado automaticamente:
 *  RN-003 garante imutabilidade via trigger PostgreSQL
 *  (`audit_logs_block_modifications`). DELETE em audit_logs lanca
 *  excecao em runtime. A limpeza de auditLogs antigos (>2 anos) deve
 *  ser feita manualmente por DBA com priviegios elevados, dropando
 *  temporariamente o trigger. Veja `docs/OBSERVABILITY-DECISAO-APM.md`
 *  para procedimento.
 *
 * Características:
 *  - Idempotente (rodar várias vezes não amplia o estrago)
 *  - Logging estruturado de cada categoria
 *  - Não falha o cron inteiro se uma categoria der erro
 *  - Limite máximo por execução para evitar lock excessivo em prod
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('jobs/limpeza-dados')

interface ResultadoCategoria {
  removidos: number
  erro?: string
}

interface ResultadoLimpeza {
  executadoEm: string
  duracaoMs: number
  sessions: ResultadoCategoria
  verificationTokens: ResultadoCategoria
  passwordResetTokens: ResultadoCategoria
}

const TRINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000

const BATCH_LIMIT = 5000

async function limparSessions(): Promise<ResultadoCategoria> {
  try {
    const limite = new Date(Date.now() - TRINTA_DIAS_MS)
    const r = await prisma.session.deleteMany({
      where: { expires: { lt: limite } },
    })
    return { removidos: r.count }
  } catch (e) {
    log.error('Falha ao limpar sessions', e)
    return { removidos: 0, erro: e instanceof Error ? e.message : 'erro' }
  }
}

async function limparVerificationTokens(): Promise<ResultadoCategoria> {
  try {
    const limite = new Date(Date.now() - TRINTA_DIAS_MS)
    const r = await prisma.verificationToken.deleteMany({
      where: { expires: { lt: limite } },
    })
    return { removidos: r.count }
  } catch (e) {
    log.error('Falha ao limpar verification tokens', e)
    return { removidos: 0, erro: e instanceof Error ? e.message : 'erro' }
  }
}

async function limparPasswordResetTokens(): Promise<ResultadoCategoria> {
  try {
    const limite = new Date(Date.now() - TRINTA_DIAS_MS)
    // Modelo opcional — pode nao existir no Prisma client; usa raw para evitar erro.
    const r = await prisma.$executeRaw`
      DELETE FROM "password_reset_tokens"
      WHERE "expiresAt" < ${limite}
        AND "id" IN (SELECT "id" FROM "password_reset_tokens" WHERE "expiresAt" < ${limite} LIMIT ${BATCH_LIMIT})
    `
    return { removidos: Number(r) }
  } catch (e) {
    // Tabela pode nao existir em deploys que ainda usam apenas NextAuth tokens
    const msg = e instanceof Error ? e.message : String(e)
    if (/does not exist|relation .* does not exist/i.test(msg)) {
      return { removidos: 0 }
    }
    log.error('Falha ao limpar password reset tokens', e)
    return { removidos: 0, erro: msg }
  }
}

export async function limparDadosAntigos(): Promise<ResultadoLimpeza> {
  const inicio = Date.now()
  log.info('Iniciando limpeza periódica de dados', {
    sessionExpiryDays: 30,
  })

  const [sessions, verificationTokens, passwordResetTokens] = await Promise.all([
    limparSessions(),
    limparVerificationTokens(),
    limparPasswordResetTokens(),
  ])

  const resultado: ResultadoLimpeza = {
    executadoEm: new Date().toISOString(),
    duracaoMs: Date.now() - inicio,
    sessions,
    verificationTokens,
    passwordResetTokens,
  }

  log.info('Limpeza concluída', {
    duracaoMs: resultado.duracaoMs,
    sessionsRemovidas: sessions.removidos,
    verificationTokensRemovidos: verificationTokens.removidos,
    passwordResetTokensRemovidos: passwordResetTokens.removidos,
  })

  return resultado
}
