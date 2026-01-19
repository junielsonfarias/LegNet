/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone para Vercel e Docker
  output: 'standalone',

  // Configurações de performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
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
  
  // Suprimir warnings de React
  reactStrictMode: false,
  
  // Configurações de logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Configurações de poweredByHeader
  poweredByHeader: false,
};

module.exports = nextConfig;
