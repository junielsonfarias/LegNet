/**
 * Tenant Resolver - Identifica o tenant a partir do hostname
 *
 * Estratégias de identificação:
 * 1. Domínio customizado: camara.santarem.pa.gov.br
 * 2. Subdomínio: santarem.camaras.gov.br
 * 3. Header X-Tenant-ID (para testes/desenvolvimento)
 * 4. Fallback para tenant padrão
 */

export interface TenantInfo {
  id: string
  slug: string
  nome: string
  sigla?: string | null
  dominio?: string | null
  subdominio?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  corPrimaria?: string | null
  corSecundaria?: string | null
  cidade?: string | null
  estado?: string | null
  plano: string
  ativo: boolean
}

// Domínios que são considerados "raiz" do sistema (não são tenants)
const ROOT_DOMAINS = [
  'localhost',
  'camaras.gov.br',
  'camaras.com.br',
  'vercel.app',
  '127.0.0.1',
]

// Subdomínios que devem ser ignorados
const IGNORED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'staging', 'dev']

// Tenant padrão quando não for possível identificar
export const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'default'

/**
 * Extrai o identificador do tenant a partir do hostname
 */
export function extractTenantIdentifier(hostname: string): {
  type: 'domain' | 'subdomain' | 'default'
  identifier: string
} {
  // Remove porta se presente
  const host = hostname.split(':')[0].toLowerCase()

  // Verifica se é localhost ou IP
  if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return { type: 'default', identifier: DEFAULT_TENANT_SLUG }
  }

  // Verifica domínios raiz (retorna default)
  for (const rootDomain of ROOT_DOMAINS) {
    if (host === rootDomain || host === `www.${rootDomain}`) {
      return { type: 'default', identifier: DEFAULT_TENANT_SLUG }
    }
  }

  // Separa as partes do hostname
  const parts = host.split('.')

  // Se tem mais de 2 partes, pode ser subdomínio
  // Ex: santarem.camaras.gov.br -> ['santarem', 'camaras', 'gov', 'br']
  if (parts.length > 2) {
    const potentialSubdomain = parts[0]
    const baseDomain = parts.slice(1).join('.')

    // Verifica se o subdomínio não é um dos ignorados
    if (!IGNORED_SUBDOMAINS.includes(potentialSubdomain)) {
      // Verifica se o restante é um domínio raiz
      for (const rootDomain of ROOT_DOMAINS) {
        if (baseDomain === rootDomain || baseDomain.endsWith(`.${rootDomain}`)) {
          return { type: 'subdomain', identifier: potentialSubdomain }
        }
      }
    }
  }

  // Caso contrário, trata como domínio customizado
  // Ex: camara.santarem.pa.gov.br
  return { type: 'domain', identifier: host }
}

/**
 * Normaliza o slug do tenant (remove caracteres especiais)
 */
export function normalizeTenantSlug(slug: string): string {
  return slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9-]/g, '-') // Substitui caracteres especiais por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, '') // Remove hífens no início e fim
}

/**
 * Verifica se o tenant está ativo e válido
 */
export function isTenantValid(tenant: TenantInfo | null): boolean {
  if (!tenant) return false
  if (!tenant.ativo) return false
  return true
}

/**
 * Headers do tenant para passar entre requests
 */
export const TENANT_HEADERS = {
  TENANT_ID: 'x-tenant-id',
  TENANT_SLUG: 'x-tenant-slug',
  TENANT_NAME: 'x-tenant-name',
  TENANT_DOMAIN: 'x-tenant-domain',
} as const

/**
 * Cria headers com informações do tenant
 */
export function createTenantHeaders(tenant: TenantInfo): Record<string, string> {
  return {
    [TENANT_HEADERS.TENANT_ID]: tenant.id,
    [TENANT_HEADERS.TENANT_SLUG]: tenant.slug,
    [TENANT_HEADERS.TENANT_NAME]: tenant.nome,
    [TENANT_HEADERS.TENANT_DOMAIN]: tenant.dominio || '',
  }
}

/**
 * Extrai informações do tenant dos headers
 */
export function getTenantFromHeaders(headers: Headers): Partial<TenantInfo> | null {
  const id = headers.get(TENANT_HEADERS.TENANT_ID)
  const slug = headers.get(TENANT_HEADERS.TENANT_SLUG)
  const nome = headers.get(TENANT_HEADERS.TENANT_NAME)
  const dominio = headers.get(TENANT_HEADERS.TENANT_DOMAIN)

  if (!id || !slug) return null

  return {
    id,
    slug,
    nome: nome || '',
    dominio,
  }
}
