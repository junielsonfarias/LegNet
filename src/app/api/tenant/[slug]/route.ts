/**
 * API Route: /api/tenant/[slug]
 *
 * Retorna informações de um tenant específico pelo slug
 */

import { NextRequest, NextResponse } from 'next/server'
import { findTenantByIdentifier } from '@/lib/tenant'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug do tenant é obrigatório' },
        { status: 400 }
      )
    }

    const tenant = await findTenantByIdentifier('slug', slug)

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tenant })
  } catch (error) {
    console.error('Erro ao buscar tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
