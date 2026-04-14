/**
 * Testes unitários para src/lib/http-cache.ts (Fase 2).
 */

import { NextResponse } from 'next/server'
import {
  withPublicCache,
  withNoCache,
  PUBLIC_CACHE_DEFAULTS,
} from '@/lib/http-cache'

const makeResponse = () => new NextResponse(JSON.stringify({ ok: true }))

describe('withPublicCache', () => {
  it('aplica defaults (s-maxage=60, swr=300)', () => {
    const res = withPublicCache(makeResponse())
    const cc = res.headers.get('Cache-Control') || ''

    expect(cc).toContain('public')
    expect(cc).toContain('s-maxage=60')
    expect(cc).toContain('stale-while-revalidate=300')
    expect(PUBLIC_CACHE_DEFAULTS.maxAge).toBe(60)
    expect(PUBLIC_CACHE_DEFAULTS.swr).toBe(300)
  })

  it('honra maxAge e swr customizados', () => {
    const res = withPublicCache(makeResponse(), { maxAge: 30, swr: 600 })
    const cc = res.headers.get('Cache-Control') || ''

    expect(cc).toContain('s-maxage=30')
    expect(cc).toContain('stale-while-revalidate=600')
  })

  it('não permite cache de browser por padrão (sem max-age)', () => {
    const res = withPublicCache(makeResponse())
    const cc = res.headers.get('Cache-Control') || ''
    expect(cc).not.toMatch(/(?:^|,\s*)max-age=\d+/)
  })

  it('quando allowBrowser=true, inclui max-age=0 no Cache-Control', () => {
    const res = withPublicCache(makeResponse(), { allowBrowser: true })
    const cc = res.headers.get('Cache-Control') || ''
    expect(cc).toContain('max-age=0')
    expect(cc).toContain('s-maxage=60')
  })

  it('define CDN-Cache-Control com s-maxage', () => {
    const res = withPublicCache(makeResponse(), { maxAge: 120 })
    expect(res.headers.get('CDN-Cache-Control')).toBe('public, s-maxage=120')
  })

  it('define Vary incluindo x-tenant-slug e Accept', () => {
    const res = withPublicCache(makeResponse())
    const vary = res.headers.get('Vary') || ''
    expect(vary).toContain('x-tenant-slug')
    expect(vary).toContain('Accept')
  })

  it('preserva Vary preexistente e adiciona novos valores', () => {
    const base = makeResponse()
    base.headers.set('Vary', 'Authorization')
    const res = withPublicCache(base)
    const vary = res.headers.get('Vary') || ''
    expect(vary).toContain('Authorization')
    expect(vary).toContain('x-tenant-slug')
    expect(vary).toContain('Accept')
  })

  it('não duplica valores em Vary se já presentes', () => {
    const base = makeResponse()
    base.headers.set('Vary', 'x-tenant-slug, Accept')
    const res = withPublicCache(base)
    const vary = res.headers.get('Vary') || ''
    const parts = vary.split(',').map((s) => s.trim())
    expect(parts.filter((p) => p === 'x-tenant-slug')).toHaveLength(1)
    expect(parts.filter((p) => p === 'Accept')).toHaveLength(1)
  })

  it('retorna a mesma NextResponse (mutação, não clone)', () => {
    const base = makeResponse()
    const res = withPublicCache(base)
    expect(res).toBe(base)
  })
})

describe('withNoCache', () => {
  it('define Cache-Control como no-store', () => {
    const res = withNoCache(makeResponse())
    const cc = res.headers.get('Cache-Control') || ''
    expect(cc).toContain('no-store')
    expect(cc).toContain('no-cache')
    expect(cc).toContain('must-revalidate')
  })

  it('retorna a mesma resposta', () => {
    const base = makeResponse()
    const res = withNoCache(base)
    expect(res).toBe(base)
  })
})
