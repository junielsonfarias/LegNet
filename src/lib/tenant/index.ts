/**
 * Módulo de Multi-Tenancy
 *
 * Este módulo fornece toda a infraestrutura necessária para
 * identificar e gerenciar múltiplos tenants (Câmaras Municipais).
 */

// Tipos e utilitários
export {
  type TenantInfo,
  extractTenantIdentifier,
  normalizeTenantSlug,
  isTenantValid,
  createTenantHeaders,
  getTenantFromHeaders,
  TENANT_HEADERS,
  DEFAULT_TENANT_SLUG,
} from './tenant-resolver'

// Serviços de banco de dados
export {
  findTenantByIdentifier,
  resolveTenantFromHostname,
  findTenantById,
  listActiveTenants,
  createTenant,
  updateTenant,
  deactivateTenant,
  clearTenantCache,
  slugExists,
  domainExists,
  subdomainExists,
} from './tenant-service'
