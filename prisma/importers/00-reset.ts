/**
 * Reset do banco DEV antes do import (decisão: importar só Chaves).
 *
 * Limpa TODAS as tabelas de dados, PRESERVANDO autenticação/admin
 * (users, accounts, sessions, verification_tokens) e o histórico de migrações.
 *
 * Segurança:
 *  - Só executa se DATABASE_URL apontar para localhost/127.0.0.1.
 *  - Usa session_replication_role=replica (requer superuser, ex.: postgres no
 *    Docker) para desabilitar FKs e apagar em qualquer ordem, numa única
 *    transação interativa (mesma conexão).
 */
import type { ImportContext } from './lib/runner'

const PRESERVE = new Set([
  'users',
  'accounts',
  'sessions',
  'verification_tokens',
  '_prisma_migrations',
])

export async function resetDatabase(ctx: ImportContext): Promise<void> {
  const url = process.env.DATABASE_URL ?? ''
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    throw new Error(
      `RESET abortado por segurança: DATABASE_URL não aponta para localhost.\n  URL atual: ${url.replace(/:[^:@]*@/, ':***@')}`
    )
  }

  const rows = await ctx.prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  )
  const targets = rows.map((r) => r.tablename).filter((t) => !PRESERVE.has(t))

  ctx.log(`⚠ RESET: limpando ${targets.length} tabelas (preservando auth/admin)...`)

  await ctx.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET session_replication_role = replica`)
    for (const t of targets) {
      await tx.$executeRawUnsafe(`DELETE FROM "${t}"`)
    }
    await tx.$executeRawUnsafe(`SET session_replication_role = origin`)
  })

  ctx.stats.bump('tabelas_limpas', targets.length)
  ctx.log('    ✔ reset concluído (admin e login preservados)')
}
