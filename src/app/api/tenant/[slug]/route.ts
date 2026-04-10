/**
 * API Route: /api/tenant/[slug]
 *
 * Retorna informações de um tenant específico pelo slug
 */

import { NextRequest, NextResponse } from 'next/server'
import { findTenantByIdentifier } from '@/lib/tenant'
import { withErrorHandler, ValidationError, NotFoundError } from '@/lib/error-handler'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  const { slug } = await params

  if (!slug) {
    throw new ValidationError('Slug do tenant é obrigatório')
  }

  const tenant = await findTenantByIdentifier('slug', slug)

  if (!tenant) {
    throw new NotFoundError('Tenant')
  }

  return NextResponse.json({ tenant })
})
