/**
 * Sistema de Cache em Memória
 * Cache simples para dados que raramente mudam
 * Em produção, considerar usar Redis para escalabilidade
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  keys: string[]
}

// TTL padrão em milissegundos
export const CACHE_TTL = {
  SHORT: 60 * 1000,           // 1 minuto
  MEDIUM: 5 * 60 * 1000,      // 5 minutos
  LONG: 15 * 60 * 1000,       // 15 minutos
  HOUR: 60 * 60 * 1000,       // 1 hora
  DAY: 24 * 60 * 60 * 1000    // 24 horas
}

// Chaves de cache predefinidas
export const CACHE_KEYS = {
  LEGISLATURA_ATIVA: 'legislatura:ativa',
  TIPOS_PROPOSICAO: 'tipos:proposicao',
  TIPOS_SESSAO: 'tipos:sessao',
  CONFIGURACOES: 'configuracoes:sistema',
  PARLAMENTARES_ATIVOS: 'parlamentares:ativos',
  COMISSOES_ATIVAS: 'comissoes:ativas',
  ESTATISTICAS_GERAL: 'estatisticas:geral'
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private stats = { hits: 0, misses: 0 }

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Verifica se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data as T
  }

  /**
   * Define um valor no cache
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM): void {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    }

    this.cache.set(key, entry)
  }

  /**
   * Remove um valor do cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Remove valores que começam com um prefixo
   */
  deleteByPrefix(prefix: string): number {
    let count = 0
    const keys = Array.from(this.cache.keys())

    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  /**
   * Verifica se uma chave existe e não está expirada
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    // Remove entradas expiradas antes de contar
    this.cleanup()

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    const entries = Array.from(this.cache.entries())

    for (const [key, entry] of entries) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }

  /**
   * Obtém ou define um valor (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  /**
   * Obtém TTL restante de uma chave
   */
  getTTL(key: string): number | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const ttl = entry.expiresAt - Date.now()
    return ttl > 0 ? ttl : null
  }

  /**
   * Renova o TTL de uma chave existente
   */
  touch(key: string, ttl: number = CACHE_TTL.MEDIUM): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    entry.expiresAt = Date.now() + ttl
    return true
  }
}

// Instância singleton do cache
export const cache = new MemoryCache()

// Limpa entradas expiradas a cada 5 minutos
setInterval(() => {
  cache.cleanup()
}, 5 * 60 * 1000)

/**
 * Decorador para cache de funções
 */
export function cached<T>(
  key: string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`

      const cachedResult = cache.get<T>(cacheKey)
      if (cachedResult !== null) {
        return cachedResult
      }

      const result = await originalMethod.apply(this, args)
      cache.set(cacheKey, result, ttl)
      return result
    }

    return descriptor
  }
}

/**
 * Helper para invalidar cache relacionado a uma entidade
 */
export function invalidateEntityCache(entity: string): void {
  cache.deleteByPrefix(`${entity}:`)
}

/**
 * Helper para criar chave de cache com parâmetros
 */
export function createCacheKey(base: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return base
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')

  return `${base}:${sortedParams}`
}

// Exportar helpers prontos para uso comum
export const cacheHelpers = {
  /**
   * Cache para legislatura ativa
   */
  async getLegislaturaAtiva<T>(fetcher: () => Promise<T>): Promise<T> {
    return cache.getOrSet(CACHE_KEYS.LEGISLATURA_ATIVA, fetcher, CACHE_TTL.HOUR)
  },

  /**
   * Cache para tipos de proposição
   */
  async getTiposProposicao<T>(fetcher: () => Promise<T>): Promise<T> {
    return cache.getOrSet(CACHE_KEYS.TIPOS_PROPOSICAO, fetcher, CACHE_TTL.DAY)
  },

  /**
   * Cache para configurações do sistema
   */
  async getConfiguracoes<T>(fetcher: () => Promise<T>): Promise<T> {
    return cache.getOrSet(CACHE_KEYS.CONFIGURACOES, fetcher, CACHE_TTL.HOUR)
  },

  /**
   * Cache para parlamentares ativos
   */
  async getParlamentaresAtivos<T>(fetcher: () => Promise<T>): Promise<T> {
    return cache.getOrSet(CACHE_KEYS.PARLAMENTARES_ATIVOS, fetcher, CACHE_TTL.LONG)
  },

  /**
   * Invalida caches de parlamentares
   */
  invalidateParlamentares(): void {
    invalidateEntityCache('parlamentares')
    cache.delete(CACHE_KEYS.PARLAMENTARES_ATIVOS)
  },

  /**
   * Invalida caches de sessões
   */
  invalidateSessoes(): void {
    invalidateEntityCache('sessoes')
  },

  /**
   * Invalida caches de proposições
   */
  invalidateProposicoes(): void {
    invalidateEntityCache('proposicoes')
  },

  /**
   * Invalida todo o cache de configurações
   */
  invalidateConfiguracoes(): void {
    invalidateEntityCache('configuracoes')
    cache.delete(CACHE_KEYS.CONFIGURACOES)
  }
}
