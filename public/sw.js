/**
 * Service Worker — PWA do Sistema Legislativo Municipal
 * Fase 4 / A9 do PLANO-CORRECOES-2026-Q2
 *
 * Estrategias:
 *   - /_next/static, /icons, /favicon: CACHE_FIRST (imutaveis)
 *   - /api/dados-abertos/*, /api/publico/*: STALE_WHILE_REVALIDATE (cidadao
 *     ve dados mesmo offline; revalida em background)
 *   - /transparencia/*, /legislativo/*, /institucional/*, /parlamentares/*:
 *     STALE_WHILE_REVALIDATE para HTML
 *   - Demais (/admin/*, /api/*, /login): NETWORK_FIRST (admin sempre fresco)
 *   - POST/PUT/DELETE/PATCH: nunca cacheia
 *
 * Atualize a versao quando mudar regras (forcer SW novo).
 */

const CACHE_VERSION = 'v1.0.0-2026-05-04'
const CACHE_STATIC = `static-${CACHE_VERSION}`
const CACHE_DYNAMIC = `dynamic-${CACHE_VERSION}`

self.addEventListener('install', (event) => {
  // Ativa o novo SW imediatamente (sem esperar paginas antigas fecharem)
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpa caches de versoes antigas
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

const isStaleWhileRevalidatePath = (pathname) =>
  pathname.startsWith('/api/dados-abertos/') ||
  pathname.startsWith('/api/publico/') ||
  pathname.startsWith('/transparencia') ||
  pathname.startsWith('/legislativo') ||
  pathname.startsWith('/institucional') ||
  pathname.startsWith('/parlamentares') ||
  pathname === '/'

const isStaticAsset = (pathname) =>
  pathname.startsWith('/_next/static/') ||
  pathname.startsWith('/icons/') ||
  pathname === '/favicon.ico' ||
  pathname === '/icon' ||
  pathname === '/apple-icon' ||
  pathname === '/manifest.webmanifest'

const isAuthOrAdmin = (pathname) =>
  pathname.startsWith('/admin') ||
  pathname.startsWith('/parlamentar/') ||
  pathname.startsWith('/login') ||
  pathname.startsWith('/api/auth/') ||
  pathname.startsWith('/api/admin/')

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Apenas same-origin
  if (url.origin !== self.location.origin) return

  // Mutacoes nunca passam por cache
  if (request.method !== 'GET') return

  // Admin/auth: sempre online (network-first sem fallback offline)
  if (isAuthOrAdmin(url.pathname)) return

  // Estaticos: cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Conteudo publico: stale-while-revalidate
  if (isStaleWhileRevalidatePath(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
})

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_STATIC)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response && response.ok) cache.put(request, response.clone())
    return response
  } catch (err) {
    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_DYNAMIC)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  // Retorna cache imediatamente se existe; revalida em background
  return cached || networkPromise
}
