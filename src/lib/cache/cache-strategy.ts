/**
 * Cache Strategy - 3 Camadas
 *
 * Camada 1: Memória (ultra-rápido, local ao processo)
 * Camada 2: Redis (compartilhado entre processos, se disponível)
 * Camada 3: Stale-While-Revalidate (retorna dados antigos enquanto revalida)
 *
 * SERVER-ONLY: Não importar em componentes client-side
 */

import { cache as memoryCache, CACHE_TTL } from './memory-cache'
import { getCacheClient, type CacheClient } from '@/lib/redis/client'

interface CacheOptions {
  /** TTL da camada de memória em ms (padrão: 60s) */
  memoryTTL?: number
  /** TTL da camada Redis em ms (padrão: 5min) */
  redisTTL?: number
  /** TTL de dados stale em ms (padrão: 30min) */
  staleTTL?: number
  /** Prefixo do namespace no Redis */
  prefix?: string
  /** Desabilitar camada de memória */
  skipMemory?: boolean
  /** Desabilitar camada Redis */
  skipRedis?: boolean
}

// TTLs padrão por tipo de dado legislativo
export const LEGISLATIVE_TTL = {
  /** Dados que quase nunca mudam (tipos, configurações) */
  STATIC: {
    memoryTTL: CACHE_TTL.HOUR,
    redisTTL: CACHE_TTL.DAY,
    staleTTL: CACHE_TTL.DAY * 7,
  },
  /** Dados que mudam pouco (parlamentares, comissões) */
  SLOW: {
    memoryTTL: CACHE_TTL.LONG,
    redisTTL: CACHE_TTL.HOUR,
    staleTTL: CACHE_TTL.DAY,
  },
  /** Dados que mudam moderadamente (proposições, tramitações) */
  MODERATE: {
    memoryTTL: CACHE_TTL.MEDIUM,
    redisTTL: CACHE_TTL.LONG,
    staleTTL: CACHE_TTL.HOUR,
  },
  /** Dados que mudam frequentemente (sessão ativa, votação) */
  FAST: {
    memoryTTL: CACHE_TTL.SHORT,
    redisTTL: CACHE_TTL.MEDIUM,
    staleTTL: CACHE_TTL.LONG,
  },
  /** Dados em tempo real (não cachear em memória, Redis curto) */
  REALTIME: {
    memoryTTL: 5_000, // 5 segundos
    redisTTL: CACHE_TTL.SHORT,
    staleTTL: CACHE_TTL.MEDIUM,
    skipMemory: true,
  },
} as const

/**
 * Busca dado com estratégia de 3 camadas
 *
 * @example
 * const parlamentares = await cachedFetch(
 *   'parlamentares:ativos',
 *   () => prisma.parlamentar.findMany({ where: { ativo: true } }),
 *   LEGISLATIVE_TTL.SLOW
 * )
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const {
    memoryTTL = CACHE_TTL.SHORT,
    redisTTL = CACHE_TTL.MEDIUM,
    staleTTL = CACHE_TTL.LONG,
    prefix = 'app',
    skipMemory = false,
    skipRedis = false,
  } = options

  const fullKey = `${prefix}:${key}`
  const staleKey = `${fullKey}:stale`

  // Camada 1: Memória
  if (!skipMemory) {
    const memResult = memoryCache.get<T>(fullKey)
    if (memResult !== null) return memResult
  }

  // Camada 2: Redis
  let redisClient: CacheClient | null = null
  if (!skipRedis) {
    try {
      redisClient = await getCacheClient()

      if (redisClient.isRedis()) {
        const redisResult = await redisClient.get(fullKey)
        if (redisResult) {
          const parsed = JSON.parse(redisResult) as T

          // Popula memória para próxima chamada
          if (!skipMemory) {
            memoryCache.set(fullKey, parsed, memoryTTL)
          }

          return parsed
        }
      }
    } catch {
      // Redis indisponível, continua
    }
  }

  // Camada 3: Tenta buscar dado fresco
  try {
    const freshData = await fetcher()

    // Popula todas as camadas
    if (!skipMemory) {
      memoryCache.set(fullKey, freshData, memoryTTL)
    }

    if (redisClient && !skipRedis) {
      try {
        const serialized = JSON.stringify(freshData)
        await redisClient.set(fullKey, serialized, redisTTL)
        // Salva cópia stale com TTL maior
        await redisClient.set(staleKey, serialized, staleTTL)
      } catch {
        // Redis indisponível
      }
    }

    return freshData
  } catch (fetchError) {
    // Stale-While-Revalidate: retorna dado antigo se fetch falhar
    if (redisClient && !skipRedis) {
      try {
        const staleResult = await redisClient.get(staleKey)
        if (staleResult) {
          const parsed = JSON.parse(staleResult) as T

          // Repopula memória com dado stale
          if (!skipMemory) {
            memoryCache.set(fullKey, parsed, memoryTTL)
          }

          return parsed
        }
      } catch {
        // Redis indisponível
      }
    }

    // Sem dados stale disponíveis, propaga o erro
    throw fetchError
  }
}

/**
 * Invalida cache em todas as camadas
 *
 * @example
 * await invalidateCache('parlamentares:ativos')
 * await invalidateCacheByPrefix('parlamentares')
 */
export async function invalidateCache(key: string, prefix = 'app'): Promise<void> {
  const fullKey = `${prefix}:${key}`

  // Limpa memória
  memoryCache.delete(fullKey)

  // Limpa Redis
  try {
    const client = await getCacheClient()
    if (client.isRedis()) {
      await client.del(fullKey)
      await client.del(`${fullKey}:stale`)
    }
  } catch {
    // Redis indisponível
  }
}

/**
 * Invalida cache por prefixo em todas as camadas
 */
export async function invalidateCacheByPrefix(keyPrefix: string, prefix = 'app'): Promise<void> {
  const fullPrefix = `${prefix}:${keyPrefix}`

  // Limpa memória
  memoryCache.deleteByPrefix(fullPrefix)

  // Limpa Redis
  try {
    const client = await getCacheClient()
    if (client.isRedis()) {
      const keys = await client.keys(`${fullPrefix}*`)
      for (const key of keys) {
        await client.del(key)
      }
    }
  } catch {
    // Redis indisponível
  }
}

/**
 * Wrapper para APIs que retorna dados cacheados com header de cache info
 */
export async function cachedApiResponse<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{ data: T; cached: boolean; source: 'memory' | 'redis' | 'fresh' }> {
  const { prefix = 'api', skipMemory = false, skipRedis = false, memoryTTL = CACHE_TTL.SHORT } = options
  const fullKey = `${prefix}:${key}`

  // Camada 1
  if (!skipMemory) {
    const memResult = memoryCache.get<T>(fullKey)
    if (memResult !== null) return { data: memResult, cached: true, source: 'memory' }
  }

  // Camada 2
  if (!skipRedis) {
    try {
      const client = await getCacheClient()
      if (client.isRedis()) {
        const redisResult = await client.get(fullKey)
        if (redisResult) {
          const parsed = JSON.parse(redisResult) as T
          if (!skipMemory) memoryCache.set(fullKey, parsed, memoryTTL)
          return { data: parsed, cached: true, source: 'redis' }
        }
      }
    } catch {
      // continua
    }
  }

  // Camada 3
  const data = await cachedFetch(key, fetcher, options)
  return { data, cached: false, source: 'fresh' }
}
