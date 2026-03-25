import { MetadataRoute } from 'next'

const baseUrl = process.env.SITE_URL || 'https://camara.gov.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/parlamentar/',
          '/painel-operador/',
          '/login',
        ],
      },
      {
        userAgent: '*',
        allow: [
          '/api/dados-abertos/',
          '/api/publico/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
