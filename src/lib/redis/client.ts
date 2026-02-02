/**
 * Cliente Redis com Fallback para Memória
 *
 * Em produção: usa Redis para escalabilidade horizontal
 * Em desenvolvimento ou quando Redis não está disponível: usa cache em memória
 *
 * CONFIGURAÇÃO:
 * - REDIS_URL: URL de conexão Redis (ex: redis://localhost:6379)
 * - REDIS_ENABLED: "true" para forçar uso do Redis
 *
 * IMPORTANTE: Este módulo é SERVER-ONLY. Não importe em componentes client-side.
 * Para rate limiting em código client-safe, use @/lib/rate-limit-simple
 */

// Interface unificada para operações de cache/rate-limit
export interface CacheClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlMs?: number): Promise<void>
  del(key: string): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, ttlMs: number): Promise<void>
  ttl(key: string): Promise<number>
  keys(pattern: string): Promise<string[]>
  isRedis(): boolean
}

// Logging simplificado para evitar dependências circulares
const log = {
  info: (msg: string, ctx?: any) => console.log(`[INFO] ${msg}`, ctx ? JSON.stringify(ctx) : ''),
  warn: (msg: string, ctx?: any) => console.warn(`[WARN] ${msg}`, ctx ? JSON.stringify(ctx) : ''),
  error: (msg: string, ctx?: any) => console.error(`[ERROR] ${msg}`, ctx ? JSON.stringify(ctx) : '')
}

// Implementação em memória (fallback)
class MemoryCacheClient implements CacheClient {
  private store = new Map<string, { value: string; expiresAt: number | null }>()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Limpa entradas expiradas a cada minuto (apenas no servidor)
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null
    })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const newValue = (parseInt(current || '0', 10) + 1).toString()

    // Preserva TTL existente
    const entry = this.store.get(key)
    const ttlMs = entry?.expiresAt ? entry.expiresAt - Date.now() : undefined

    await this.set(key, newValue, ttlMs && ttlMs > 0 ? ttlMs : undefined)
    return parseInt(newValue, 10)
  }

  async expire(key: string, ttlMs: number): Promise<void> {
    const entry = this.store.get(key)
    if (entry) {
      entry.expiresAt = Date.now() + ttlMs
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key)
    if (!entry || !entry.expiresAt) return -1

    const remaining = entry.expiresAt - Date.now()
    return remaining > 0 ? Math.ceil(remaining / 1000) : -2
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    const result: string[] = []
    const keys = Array.from(this.store.keys())

    for (const key of keys) {
      if (regex.test(key)) {
        result.push(key)
      }
    }

    return result
  }

  isRedis(): boolean {
    return false
  }

  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.store.entries())
    for (const [key, entry] of entries) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Implementação Redis (produção) - só inicializa no servidor
class RedisCacheClient implements CacheClient {
  private redis: any = null // ioredis client
  private connected = false
  private initPromise: Promise<void> | null = null

  constructor(redisUrl: string) {
    this.initPromise = this.initRedis(redisUrl)
  }

  private async initRedis(redisUrl: string): Promise<void> {
    // Só inicializa no servidor
    if (typeof window !== 'undefined') {
      return
    }

    try {
      // Dynamic import para evitar erro no client-side
      const Redis = (await import('ioredis')).default

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
        retryStrategy: (times: number) => {
          if (times > 3) return null
          return Math.min(times * 100, 3000)
        }
      })

      this.redis.on('connect', () => {
        this.connected = true
        log.info('Redis conectado com sucesso')
      })

      this.redis.on('error', (err: Error) => {
        log.error('Erro no Redis', { error: err.message })
        this.connected = false
      })

      this.redis.on('close', () => {
        log.warn('Conexão Redis fechada')
        this.connected = false
      })

      // Aguarda conexão inicial
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout ao conectar Redis'))
        }, 5000)

        this.redis.once('connect', () => {
          clearTimeout(timeout)
          resolve()
        })

        this.redis.once('error', (err: Error) => {
          clearTimeout(timeout)
          reject(err)
        })
      })
    } catch (error) {
      log.error('Falha ao inicializar Redis', { error: String(error) })
      throw error
    }
  }

  private async ensureConnected(): Promise<boolean> {
    if (this.initPromise) {
      try {
        await this.initPromise
      } catch {
        return false
      }
    }
    return this.connected
  }

  async get(key: string): Promise<string | null> {
    if (!(await this.ensureConnected())) return null
    return this.redis.get(key)
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    if (!(await this.ensureConnected())) return

    if (ttlMs) {
      await this.redis.set(key, value, 'PX', ttlMs)
    } else {
      await this.redis.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    if (!(await this.ensureConnected())) return
    await this.redis.del(key)
  }

  async incr(key: string): Promise<number> {
    if (!(await this.ensureConnected())) return 0
    return this.redis.incr(key)
  }

  async expire(key: string, ttlMs: number): Promise<void> {
    if (!(await this.ensureConnected())) return
    await this.redis.pexpire(key, ttlMs)
  }

  async ttl(key: string): Promise<number> {
    if (!(await this.ensureConnected())) return -1
    return this.redis.ttl(key)
  }

  async keys(pattern: string): Promise<string[]> {
    if (!(await this.ensureConnected())) return []
    return this.redis.keys(pattern)
  }

  isRedis(): boolean {
    return this.connected
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }
}

// Factory para criar o cliente apropriado
let cacheClientInstance: CacheClient | null = null

export async function getCacheClient(): Promise<CacheClient> {
  if (cacheClientInstance) {
    return cacheClientInstance
  }

  // No browser, sempre usa memória
  if (typeof window !== 'undefined') {
    cacheClientInstance = new MemoryCacheClient()
    return cacheClientInstance
  }

  const redisUrl = process.env.REDIS_URL
  const redisEnabled = process.env.REDIS_ENABLED === 'true'

  if (redisUrl && redisEnabled) {
    try {
      cacheClientInstance = new RedisCacheClient(redisUrl)
      log.info('Usando Redis para cache/rate-limit')
    } catch (error) {
      log.warn('Falha ao conectar Redis, usando cache em memória')
      cacheClientInstance = new MemoryCacheClient()
    }
  } else {
    log.info('Redis não configurado, usando cache em memória')
    cacheClientInstance = new MemoryCacheClient()
  }

  return cacheClientInstance
}

// Singleton síncrono - sempre usa memória inicialmente
const memoryCacheClient = new MemoryCacheClient()

export function getCacheClientSync(): CacheClient {
  // Retorna cliente de memória por padrão (seguro para client e server)
  return cacheClientInstance || memoryCacheClient
}

// Utilitários para rate limiting
export const rateLimitKeys = {
  login: (identifier: string) => `ratelimit:login:${identifier}`,
  api: (type: string, identifier: string) => `ratelimit:api:${type}:${identifier}`,
  resetPassword: (identifier: string) => `ratelimit:reset:${identifier}`
}

// Utilitários para cache
export const cacheKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  user: (userId: string) => `user:${userId}`,
  config: (key: string) => `config:${key}`
}
