/**
 * API Route: /api/tenant/current
 *
 * Retorna informações do tenant atual baseado no hostname da requisição.
 * O middleware já identifica o tenant e passa via header x-tenant-slug.
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantFromHostname, findTenantByIdentifier } from '@/lib/tenant'
import { TENANT_HEADERS, DEFAULT_TENANT_SLUG } from '@/lib/tenant'
import type { TenantInfo } from '@/lib/tenant/tenant-resolver'

/**
 * Tenant padrão para fallback quando não há nenhum no banco
 */
const DEFAULT_TENANT_MOCK: TenantInfo = {
  id: 'default',
  slug: 'default',
  nome: 'Câmara Municipal',
  sigla: 'CM',
  dominio: null,
  subdominio: null,
  logoUrl: null,
  faviconUrl: null,
  corPrimaria: '#1e40af',
  corSecundaria: '#3b82f6',
  cidade: null,
  estado: null,
  plano: 'BASICO',
  ativo: true,
}

export async function GET(request: NextRequest) {
  try {
    // Tenta obter o tenant do header (setado pelo middleware)
    const tenantSlug = request.headers.get(TENANT_HEADERS.TENANT_SLUG)

    if (tenantSlug && tenantSlug !== 'default') {
      // Busca pelo slug do header
      const tenant = await findTenantByIdentifier('slug', tenantSlug)

      if (tenant) {
        return NextResponse.json({ tenant })
      }
    }

    // Fallback: resolve pelo hostname
    const hostname = request.headers.get('host') || 'localhost'
    const tenant = await resolveTenantFromHostname(hostname)

    if (tenant) {
      return NextResponse.json({ tenant })
    }

    // Se não encontrou, tenta o tenant padrão do banco
    const defaultTenant = await findTenantByIdentifier('default', DEFAULT_TENANT_SLUG)

    if (defaultTenant) {
      return NextResponse.json({ tenant: defaultTenant })
    }

    // Retorna tenant mock como último fallback
    return NextResponse.json({ tenant: DEFAULT_TENANT_MOCK })
  } catch (error) {
    console.error('Erro ao buscar tenant atual:', error)

    // Retorna tenant mock em caso de erro
    return NextResponse.json({ tenant: DEFAULT_TENANT_MOCK })
  }
}
