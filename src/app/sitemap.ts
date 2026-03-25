import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const baseUrl = process.env.SITE_URL || 'https://camara.gov.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/parlamentares`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/parlamentares/galeria`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/parlamentares/mesa-diretora`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/parlamentares/comparativo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/transparencia`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/transparencia/contratos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/transparencia/licitacoes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/transparencia/despesas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/transparencia/receitas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/transparencia/leis`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/transparencia/decretos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/transparencia/folha-pagamento`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/transparencia/servidores`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/legislativo/proposicoes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/legislativo/sessoes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/legislativo/pautas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/legislativo/comissoes`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/legislativo/normas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/noticias`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/calendario`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/participacao-cidada`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/tramitacoes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    // Institucionais
    { url: `${baseUrl}/institucional/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/institucional/papel-camara`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/institucional/papel-vereador`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/institucional/lei-organica`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
    { url: `${baseUrl}/institucional/regimento`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
    { url: `${baseUrl}/institucional/ouvidoria`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/institucional/e-sic`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  // Páginas dinâmicas - Parlamentares
  let parlamentarPages: MetadataRoute.Sitemap = []
  try {
    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      select: { id: true, apelido: true, updatedAt: true }
    })
    parlamentarPages = parlamentares
      .filter(p => p.apelido)
      .map(p => ({
        url: `${baseUrl}/parlamentares/${encodeURIComponent(p.apelido!.toLowerCase().replace(/\s+/g, '-'))}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }))
  } catch { /* ignore if table not available */ }

  // Páginas dinâmicas - Notícias
  let noticiaPages: MetadataRoute.Sitemap = []
  try {
    const noticias = await prisma.noticia.findMany({
      where: { publicada: true },
      select: { id: true, updatedAt: true },
      orderBy: { dataPublicacao: 'desc' },
      take: 200
    })
    noticiaPages = noticias.map(n => ({
      url: `${baseUrl}/noticias/${n.id}`,
      lastModified: n.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
  } catch { /* ignore */ }

  // Páginas dinâmicas - Normas jurídicas
  let normaPages: MetadataRoute.Sitemap = []
  try {
    const normas = await prisma.normaJuridica.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { dataPublicacao: 'desc' },
      take: 500
    })
    normaPages = normas.map(n => ({
      url: `${baseUrl}/legislativo/normas/${n.id}`,
      lastModified: n.updatedAt,
      changeFrequency: 'yearly' as const,
      priority: 0.7
    }))
  } catch { /* ignore */ }

  return [...staticPages, ...parlamentarPages, ...noticiaPages, ...normaPages]
}
