// @next/bundle-analyzer é devDependency — se ausente (ex: npm ci --only=production
// com versão antiga do update.sh), o build seguia falhando. Torna opcional.
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch {
  // bundle-analyzer não instalado — OK, só afeta `npm run analyze`
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deploy self-hosted VPS (2026-07-02): o ESLint NAO roda no `next build`.
  // Motivo: em produção o plugin @typescript-eslint (transitivo de
  // eslint-config-next) nao e registrado, e os comentarios
  // `eslint-disable @typescript-eslint/no-explicit-any` no codigo apontam para
  // uma regra "nao encontrada" -> ESLint aborta o build (site nao sobe).
  // O type-check do TypeScript CONTINUA rodando no build (nao afetado por isto).
  // Lint permanece disponivel em dev/CI via `npm run lint`.
  // (Antes: F1.5 mantinha ignoreDuringBuilds:false, validado so na Vercel.)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Hotfix Vercel (2026-05-27): isomorphic-dompurify usa jsdom em SSR e
  // jsdom le browser/default-stylesheet.css via fs em init. Quando bundled
  // pelo Next, o asset CSS interno nao e copiado e o build falha em
  // /vercel/path0/browser/default-stylesheet.css ENOENT. Solucao: marcar
  // ambos como external packages — o Next requer/resolves direto de
  // node_modules em runtime (mantem assets relativos).
  // Requer Next.js 15+.
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
  // Configurações de performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      'react-day-picker',
      'clsx',
      'tailwind-merge',
      'sonner'
    ],
  },

  // Configurações de imagem otimizadas para Vercel + Supabase (Multi-Tenant)
  images: {
    remotePatterns: [
      // Supabase Storage (todos os projetos - Multi-Tenant)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      // Vercel Blob Storage
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      // Domínios governamentais genéricos (.gov.br)
      {
        protocol: 'https',
        hostname: '**.gov.br',
        pathname: '/**',
      },
      // Localhost para desenvolvimento
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Configurações de compressão
  compress: true,
  
  // Redirects 308 (permanente) para consolidar URLs duplicadas:
  //  - /transparencia/decretos|portarias: paginas legadas substituidas por
  //    /transparencia/atos/[tipo] (criterio PNTP 2.6).
  //  - /transparencia/documentos/plano-anual-contratacoes e
  //    /transparencia/documentos/planejamento-estrategico: documentos com
  //    pagina dedicada e mais rica em /transparencia/plano-contratacoes-anual
  //    e /transparencia/plano-estrategico.
  async redirects() {
    return [
      {
        source: '/transparencia/decretos',
        destination: '/transparencia/atos/decretos',
        permanent: true,
      },
      {
        source: '/transparencia/portarias',
        destination: '/transparencia/atos/portarias',
        permanent: true,
      },
      {
        source: '/transparencia/documentos/plano-anual-contratacoes',
        destination: '/transparencia/plano-contratacoes-anual',
        permanent: true,
      },
      {
        source: '/transparencia/documentos/planejamento-estrategico',
        destination: '/transparencia/plano-estrategico',
        permanent: true,
      },
    ]
  },

  // Configurações de headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Headers específicos para recursos estáticos
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
        ],
      },
      {
        source: '/_next/static/chunks/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
    ]
  },
  
  // Configurações de webpack simplificadas
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Suprimir warnings específicos apenas em desenvolvimento
      config.ignoreWarnings = [
        /Extra attributes from the server/,
        /Warning: Extra attributes/,
        /data-new-gr-c-s-check-loaded/,
        /data-gr-ext-installed/,
        /cz-shortcut-listen/,
        /Download the React DevTools/,
        /warnForExtraAttributes/,
        /class,style/,
        /hydration/,
        /Prop `className` did not match/,
        /Server: "__className_/,
        /Client: "__className_/,
        /window.console.error/,
        /console.error/,
        /hydration-error-info.ts/,
        /app-index.tsx/,
        /Fast Refresh/,
        /webpack-internal/,
        /rebuilding/,
        /done in/,
      ]
    }
    
    // Resolver problemas de módulos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
  
  // Strict Mode do React: ativado para detectar efeitos inseguros e APIs deprecadas.
  // Impacto em dev: efeitos/useState rodam 2x para detectar side-effects impuros.
  // Não afeta produção.
  reactStrictMode: true,
  
  // Configurações de logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Configurações de poweredByHeader
  poweredByHeader: false,
};

module.exports = withBundleAnalyzer(nextConfig);
