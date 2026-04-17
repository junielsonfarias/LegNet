import { PrismaClient } from '@prisma/client'
import { attachQueryTracker } from './prisma-query-tracker'

/**
 * Configuracao do Prisma Client otimizada para Vercel/Serverless
 *
 * - Usa singleton pattern para evitar multiplas conexoes
 * - Configurado para funcionar com Supabase (pooling)
 * - Logs reduzidos em producao
 * - N+1 tracker opcional via PRISMA_QUERY_TRACKING=true (ver prisma-query-tracker.ts)
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Singleton do Prisma Client
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// No-op em produção (verifica env var internamente)
attachQueryTracker(prisma)

// Em desenvolvimento, mantemos a instancia no global para hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper para desconectar (util em testes e shutdown)
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

// Helper para verificar conexao com o banco
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
