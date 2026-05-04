import type { MetadataRoute } from 'next'

/**
 * Web App Manifest (PWA) — Fase 4 / A9 do PLANO-CORRECOES-2026-Q2.
 *
 * Gerado dinamicamente para suportar multi-tenant (SITE_NAME via env).
 * Servido pelo Next.js em /manifest.webmanifest.
 *
 * Ícones: usa /icon.svg gerado por src/app/icon.tsx (Next.js Metadata API).
 */
export default function manifest(): MetadataRoute.Manifest {
  const siteName = process.env.SITE_NAME || 'Câmara Municipal'
  const description = process.env.SITE_DESCRIPTION ||
    'Portal Institucional. Consulte leis, sessões, transparência e dados abertos.'
  const themeColor = process.env.SITE_THEME_COLOR || '#374151'

  return {
    name: siteName,
    short_name: siteName.replace(/^Cãmara Municipal( de)?\s+/i, '').slice(0, 12) || 'Câmara',
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: themeColor,
    lang: 'pt-BR',
    categories: ['government', 'education', 'productivity'],
    icons: [
      // Icones gerados dinamicamente via Next.js Metadata API
      // (src/app/icon.tsx e src/app/apple-icon.tsx).
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      // Apple-icon serve tambem como maskable (margem natural no design)
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Transparência',
        url: '/transparencia',
        description: 'Portal da Transparência'
      },
      {
        name: 'Sessões',
        url: '/legislativo/sessoes',
        description: 'Sessões legislativas'
      },
      {
        name: 'e-SIC',
        url: '/institucional/e-sic',
        description: 'Pedido de informação'
      },
      {
        name: 'Ouvidoria',
        url: '/institucional/ouvidoria',
        description: 'Registrar manifestação'
      }
    ]
  }
}
