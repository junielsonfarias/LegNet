import { prisma } from '@/lib/prisma'

const CONFIG_KEY = 'seguranca.2fa.enabled'
const CACHE_TTL_MS = 60_000

let cachedValue: boolean | null = null
let cachedAt = 0

export const TWO_FACTOR_CONFIG_KEY = CONFIG_KEY

export async function is2FAEnabledGlobally(): Promise<boolean> {
  const now = Date.now()
  if (cachedValue !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedValue
  }

  try {
    const config = await prisma.configuracao.findUnique({
      where: { chave: CONFIG_KEY },
      select: { valor: true }
    })
    const value = config?.valor === 'true'
    cachedValue = value
    cachedAt = now
    return value
  } catch {
    return cachedValue ?? false
  }
}

export async function setGlobalTwoFactorEnabled(enabled: boolean): Promise<void> {
  await prisma.configuracao.upsert({
    where: { chave: CONFIG_KEY },
    update: { valor: enabled ? 'true' : 'false' },
    create: {
      chave: CONFIG_KEY,
      valor: enabled ? 'true' : 'false',
      descricao: 'Habilita ou desabilita a verificacao em duas etapas (2FA) para todo o sistema',
      categoria: 'Seguranca',
      tipo: 'boolean',
      editavel: true
    }
  })
  invalidate2FAConfigCache()
}

export function invalidate2FAConfigCache(): void {
  cachedValue = null
  cachedAt = 0
}
