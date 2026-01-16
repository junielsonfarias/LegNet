/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Configurações de imagem otimizadas
  images: {
    domains: ['localhost', 'camaramojuidoscampos.pa.gov.br'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'camaramojuidoscampos.pa.gov.br',
        port: '',
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
  
  // Configurações de output (apenas para produção)
  // output: 'standalone', // Removido para desenvolvimento
  
  // Configurações de poweredByHeader
  poweredByHeader: false,
};

module.exports = nextConfig;
