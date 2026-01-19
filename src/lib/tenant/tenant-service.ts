/**
 * Tenant Service - Operações de banco de dados para tenants
 */

import { prisma } from '@/lib/prisma'
import type { Tenant } from '@prisma/client'
import {
  TenantInfo,
  extractTenantIdentifier,
  DEFAULT_TENANT_SLUG,
  normalizeTenantSlug,
} from './tenant-resolver'

// Cache em memória para evitar consultas repetidas
const tenantCache = new Map<string, { tenant: TenantInfo | null; expiry: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Converte entidade Prisma Tenant para TenantInfo
 */
function toTenantInfo(tenant: Tenant): TenantInfo {
  return {
    id: tenant.id,
    slug: tenant.slug,
    nome: tenant.nome,
    sigla: tenant.sigla,
    dominio: tenant.dominio,
    subdominio: tenant.subdominio,
    logoUrl: tenant.logoUrl,
    faviconUrl: tenant.faviconUrl,
    corPrimaria: tenant.corPrimaria,
    corSecundaria: tenant.corSecundaria,
    cidade: tenant.cidade,
    estado: tenant.estado,
    plano: tenant.plano,
    ativo: tenant.ativo,
  }
}

/**
 * Busca tenant pelo identificador (slug, domínio ou subdomínio)
 */
export async function findTenantByIdentifier(
  type: 'domain' | 'subdomain' | 'slug' | 'default',
  identifier: string
): Promise<TenantInfo | null> {
  const cacheKey = `${type}:${identifier}`

  // Verifica cache
  const cached = tenantCache.get(cacheKey)
  if (cached && cached.expiry > Date.now()) {
    return cached.tenant
  }

  try {
    let tenant: Tenant | null = null

    switch (type) {
      case 'domain':
        tenant = await prisma.tenant.findFirst({
          where: {
            dominio: identifier,
            ativo: true,
          },
        })
        break

      case 'subdomain':
        tenant = await prisma.tenant.findFirst({
          where: {
            subdominio: identifier,
            ativo: true,
          },
        })
        break

      case 'slug':
      case 'default':
        tenant = await prisma.tenant.findFirst({
          where: {
            slug: identifier,
            ativo: true,
          },
        })
        break
    }

    const result: TenantInfo | null = tenant ? toTenantInfo(tenant) : null

    // Atualiza cache
    tenantCache.set(cacheKey, { tenant: result, expiry: Date.now() + CACHE_TTL })

    return result
  } catch (error) {
    console.error('Erro ao buscar tenant:', error)
    return null
  }
}

/**
 * Resolve o tenant a partir do hostname
 */
export async function resolveTenantFromHostname(hostname: string): Promise<TenantInfo | null> {
  const { type, identifier } = extractTenantIdentifier(hostname)

  // Tenta encontrar pelo tipo identificado
  let tenant = await findTenantByIdentifier(type, identifier)

  // Se não encontrou e não é default, tenta buscar pelo slug normalizado
  if (!tenant && type !== 'default') {
    const normalizedSlug = normalizeTenantSlug(identifier)
    tenant = await findTenantByIdentifier('slug', normalizedSlug)
  }

  // Se ainda não encontrou, tenta o tenant padrão
  if (!tenant) {
    tenant = await findTenantByIdentifier('default', DEFAULT_TENANT_SLUG)
  }

  return tenant
}

/**
 * Busca tenant pelo ID
 *
 * @param id - ID do tenant
 * @param includeInactive - Se true, inclui tenants inativos (default: false)
 */
export async function findTenantById(id: string, includeInactive = false): Promise<TenantInfo | null> {
  const cacheKey = `id:${id}:${includeInactive}`

  // Verifica cache
  const cached = tenantCache.get(cacheKey)
  if (cached && cached.expiry > Date.now()) {
    return cached.tenant
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        ...(includeInactive ? {} : { ativo: true }),
      },
    })

    const result: TenantInfo | null = tenant ? toTenantInfo(tenant) : null

    // Atualiza cache
    tenantCache.set(cacheKey, { tenant: result, expiry: Date.now() + CACHE_TTL })

    return result
  } catch (error) {
    console.error('Erro ao buscar tenant por ID:', error)
    return null
  }
}

/**
 * Lista todos os tenants ativos
 */
export async function listActiveTenants(): Promise<TenantInfo[]> {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    })

    return tenants.map(toTenantInfo)
  } catch (error) {
    console.error('Erro ao listar tenants:', error)
    return []
  }
}

/**
 * Cria um novo tenant
 */
export async function createTenant(data: {
  slug: string
  nome: string
  sigla?: string
  cnpj?: string
  dominio?: string
  subdominio?: string
  cidade?: string
  estado?: string
  logoUrl?: string
  corPrimaria?: string
  corSecundaria?: string
  plano?: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE'
}): Promise<TenantInfo> {
  const tenant = await prisma.tenant.create({
    data: {
      slug: normalizeTenantSlug(data.slug),
      nome: data.nome,
      sigla: data.sigla,
      cnpj: data.cnpj,
      dominio: data.dominio,
      subdominio: data.subdominio,
      cidade: data.cidade,
      estado: data.estado,
      logoUrl: data.logoUrl,
      corPrimaria: data.corPrimaria || '#1e40af',
      corSecundaria: data.corSecundaria || '#3b82f6',
      plano: data.plano || 'BASICO',
      ativo: true,
    },
  })

  // Limpa cache
  clearTenantCache()

  return toTenantInfo(tenant)
}

/**
 * Atualiza um tenant
 */
export async function updateTenant(
  id: string,
  data: Partial<{
    nome: string
    sigla: string | null
    cnpj: string | null
    dominio: string | null
    subdominio: string | null
    cidade: string | null
    estado: string | null
    logoUrl: string | null
    faviconUrl: string | null
    corPrimaria: string
    corSecundaria: string
    plano: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE'
    ativo: boolean
  }>
): Promise<TenantInfo | null> {
  try {
    const tenant = await prisma.tenant.update({
      where: { id },
      data,
    })

    // Limpa cache
    clearTenantCache()

    return toTenantInfo(tenant)
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error)
    return null
  }
}

/**
 * Desativa um tenant (soft delete)
 */
export async function deactivateTenant(id: string): Promise<boolean> {
  try {
    await prisma.tenant.update({
      where: { id },
      data: { ativo: false },
    })

    // Limpa cache
    clearTenantCache()

    return true
  } catch (error) {
    console.error('Erro ao desativar tenant:', error)
    return false
  }
}

/**
 * Limpa o cache de tenants
 */
export function clearTenantCache(): void {
  tenantCache.clear()
}

/**
 * Verifica se um slug já existe
 */
export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const normalized = normalizeTenantSlug(slug)

  const tenant = await prisma.tenant.findFirst({
    where: {
      slug: normalized,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

  return !!tenant
}

/**
 * Verifica se um domínio já existe
 */
export async function domainExists(dominio: string, excludeId?: string): Promise<boolean> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      dominio: dominio.toLowerCase(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

  return !!tenant
}

/**
 * Verifica se um subdomínio já existe
 */
export async function subdomainExists(subdominio: string, excludeId?: string): Promise<boolean> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      subdominio: subdominio.toLowerCase(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

  return !!tenant
}
