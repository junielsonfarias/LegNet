import { PrismaClient } from '@prisma/client'

/**
 * Configuracao do Prisma Client otimizada para Vercel/Serverless
 *
 * - Usa singleton pattern para evitar multiplas conexoes
 * - Configurado para funcionar com Supabase (pooling)
 * - Logs reduzidos em producao
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Singleton do Prisma Client
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

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
